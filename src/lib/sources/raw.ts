import type { Source, Tag } from "../types";

/**
 * Backend-internal raw item, before triage. Sources (Gmail/GitHub/news)
 * produce these; `summarizeFeed` turns them into the public `FeedItem`
 * (the frozen frontend contract) by adding an AI summary + tag.
 *
 * `summary`/`tag` are OPTIONAL canned values used only for the offline
 * mock demo (when Azure OpenAI is not configured).
 */
export interface RawItem {
  id: string;
  source: Source;
  title: string;
  body: string;
  author: string;
  url?: string;
  receivedAt: string; // ISO-8601
  summary?: string;
  tag?: Tag;
}
