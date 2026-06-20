import type { FeedItem, Tag } from "../types";
import type { RawItem } from "../sources/raw";
import { isAzureConfigured } from "../agent/copilot";
import { runTriage } from "../agent/triage";
import type { TriageResult } from "../agent/agent-types";

/**
 * Eager triage: turn raw source items into already-summarized, already-tagged
 * public `FeedItem`s. This is what `GET /api/feed` returns, so the UI renders a
 * pre-triaged feed without any user action.
 *
 * - Azure OpenAI configured → the Copilot SDK agent summarizes + tags each item.
 * - Otherwise → fall back to each item's canned summary/tag (offline mock demo).
 */

/** Naive first-sentence fallback when an item has no canned summary. */
function firstSentence(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^.*?[.!?。！？](\s|$)/);
  const sentence = (match ? match[0] : trimmed).trim();
  return sentence.length > 140 ? `${sentence.slice(0, 139)}…` : sentence;
}

function toFeedItem(raw: RawItem, summary: string, tag: Tag): FeedItem {
  return {
    id: raw.id,
    source: raw.source,
    title: raw.title,
    summary,
    tag,
    url: raw.url ?? "#",
    receivedAt: raw.receivedAt,
    triaged: true,
  };
}

function cannedFeed(raw: RawItem[]): FeedItem[] {
  return raw.map((it) =>
    toFeedItem(it, it.summary ?? firstSentence(it.body), it.tag ?? "Info")
  );
}

/** In-memory cache so repeated feed fetches don't re-run the agent per item. */
const cache = new Map<string, TriageResult>();

export async function summarizeFeed(raw: RawItem[]): Promise<FeedItem[]> {
  if (raw.length === 0) return [];

  if (!isAzureConfigured()) {
    return cannedFeed(raw);
  }

  const uncached = raw.filter((it) => !cache.has(it.id));
  if (uncached.length > 0) {
    try {
      const { results } = await runTriage(uncached);
      for (const r of results) cache.set(r.itemId, r);
    } catch {
      // Agent failed (network/credentials) — degrade gracefully to canned data.
      return cannedFeed(raw);
    }
  }

  return raw.map((it) => {
    const r = cache.get(it.id);
    if (r && r.summary) return toFeedItem(it, r.summary, r.tag);
    return toFeedItem(it, it.summary ?? firstSentence(it.body), it.tag ?? "Info");
  });
}

/** Test/maintenance helper. */
export function clearSummaryCache(): void {
  cache.clear();
}
