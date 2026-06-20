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

function toFeedItem(raw: RawItem, summary: string, tag: Tag, triaged: boolean): FeedItem {
  return {
    id: raw.id,
    source: raw.source,
    title: raw.title,
    summary,
    tag,
    url: raw.url ?? "#",
    receivedAt: raw.receivedAt,
    triaged,
  };
}

function fallbackItem(raw: RawItem, triaged: boolean): FeedItem {
  return toFeedItem(raw, raw.summary ?? firstSentence(raw.body), raw.tag ?? "Info", triaged);
}

function cannedFeed(raw: RawItem[]): FeedItem[] {
  return raw.map((it) => fallbackItem(it, true));
}

/**
 * Triage state shared across requests. Stored on `globalThis` so it survives
 * Next.js dev (Turbopack) module reloads and is a single instance per server
 * process in production. `inflight` dedupes concurrent background runs.
 */
interface TriageState {
  cache: Map<string, TriageResult>;
  inflight: Set<string>;
  /** Epoch ms before which no new background run is started (set after a
   *  failure, e.g. an Azure 429, to avoid hammering a rate-limited model). */
  cooldownUntil: number;
}
const g = globalThis as typeof globalThis & { __triageState?: TriageState };
const state: TriageState = (g.__triageState ??= {
  cache: new Map(),
  inflight: new Set(),
  cooldownUntil: 0,
});

const FAILURE_COOLDOWN_MS = 30_000;

/** Fire-and-forget triage that fills the shared cache. Never throws. */
function triageInBackground(items: RawItem[]): void {
  if (Date.now() < state.cooldownUntil) return;
  const pending = items.filter(
    (it) => !state.cache.has(it.id) && !state.inflight.has(it.id)
  );
  if (pending.length === 0) return;
  for (const it of pending) state.inflight.add(it.id);
  // Skip the GitHub MCP roundtrip — GitHub items are already fetched via REST.
  void runTriage(pending, undefined, { github: false })
    .then(({ results }) => {
      for (const r of results) if (r.summary) state.cache.set(r.itemId, r);
    })
    .catch(() => {
      // Leave items uncached; back off before retrying so a rate-limited
      // model (e.g. Azure 429) isn't hammered on every poll.
      state.cooldownUntil = Date.now() + FAILURE_COOLDOWN_MS;
    })
    .finally(() => {
      for (const it of pending) state.inflight.delete(it.id);
    });
}

/**
 * Non-blocking eager triage. Returns immediately:
 * - Azure not configured → canned summaries (offline demo), all `triaged:true`.
 * - Azure configured → cached items return their AI summary (`triaged:true`);
 *   not-yet-triaged items return a fallback summary with `triaged:false` and a
 *   background triage run is kicked off. The client polls until all are triaged.
 */
export async function summarizeFeed(raw: RawItem[]): Promise<FeedItem[]> {
  if (raw.length === 0) return [];

  if (!isAzureConfigured()) {
    return cannedFeed(raw);
  }

  triageInBackground(raw);

  return raw.map((it) => {
    const r = state.cache.get(it.id);
    if (r && r.summary) return toFeedItem(it, r.summary, r.tag, true);
    return fallbackItem(it, false);
  });
}

/** Test/maintenance helper. */
export function clearSummaryCache(): void {
  state.cache.clear();
  state.inflight.clear();
}
