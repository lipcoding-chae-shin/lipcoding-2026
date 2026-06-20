export type SourceKind = "gmail" | "github" | "news";

export interface FeedItem {
  id: string;
  source: SourceKind;
  title: string;
  body: string;
  author: string;
  url?: string;
  receivedAt: string; // ISO-8601
}

export type TagKind = "Task" | "Info";

export interface TriageResult {
  itemId: string;
  summary: string;
  tag: TagKind;
}

export interface Todo {
  id: string;
  itemId: string;
  title: string;
  done: boolean;
  sourceUrl?: string;
}

export interface FeedResponse {
  items: FeedItem[];
}

export interface TriageResponse {
  results: TriageResult[];
  todos: Todo[];
}

export function isTagKind(value: string): value is TagKind {
  return value === "Task" || value === "Info";
}
