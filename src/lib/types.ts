/**
 * Shared contract between frontend (Dev A) and backend (Dev B).
 * FROZEN INTERFACE — change only after a one-line agreement between both devs.
 */

export type Source =
  | "gmail"
  | "slack"
  | "navermail"
  | "github"
  | "notion"
  | "discord"
  | "news";

export type Tag = "Task" | "Info";

export interface SubscribedSource {
  /** Unique per subscription instance (multiple of the same source allowed). */
  id: string;
  source: Source;
  label: string;
  connected: boolean;
}

export interface FeedItem {
  id: string;
  source: Source;
  title: string;
  /** AI-generated one-line summary (empty until triaged). */
  summary: string;
  /** AI classification (null until triaged). */
  tag: Tag | null;
  /** Link back to the original item. */
  url: string;
  receivedAt: string; // ISO
  /** True once the agent has summarized + tagged this item. */
  triaged: boolean;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  /** Feed item this todo was created from, if any. */
  sourceItemId?: string;
  createdAt: string; // ISO
}

/** One step of the agent's reasoning, streamed to the UI. */
export interface TraceEvent {
  id: string;
  itemId?: string;
  kind: "read" | "summarize" | "tag" | "todo" | "done";
  text: string;
  at: string; // ISO
}

/* ---- API shapes (GET /api/feed, POST /api/triage) ---- */

export interface FeedResponse {
  items: FeedItem[];
}

export interface TriageRequest {
  itemId: string;
}

export interface TriageResponse {
  item: FeedItem;
  /** Created when the item is tagged as a Task and the user approves. */
  todo?: Todo;
}
