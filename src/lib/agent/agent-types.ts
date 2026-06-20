import type { Tag } from "../types";

/** Backend-internal agent result types (not part of the shared API contract). */

export type TagKind = Tag;

export interface TriageResult {
  itemId: string;
  summary: string;
  tag: TagKind;
}

/** A todo proposed by the agent while triaging (collector-internal shape). */
export interface AgentTodo {
  id: string;
  itemId: string;
  title: string;
  done: boolean;
}

export function isTagKind(value: string): value is TagKind {
  return value === "Task" || value === "Info";
}
