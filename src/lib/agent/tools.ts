import { defineTool } from "@github/copilot-sdk";
import { isTagKind, type TagKind, type TriageResult, type AgentTodo } from "./agent-types";

export interface TriageCollector {
  results: Map<string, TriageResult>;
  todos: AgentTodo[];
}

export function createCollector(): TriageCollector {
  return { results: new Map(), todos: [] };
}

export function createTriageTools(collector: TriageCollector) {
  const summarizeItem = defineTool("summarize_item", {
    description: "Record a concise one-sentence summary for a feed item.",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "The feed item id" },
        summary: { type: "string", description: "One-sentence summary in the item's language" },
      },
      required: ["itemId", "summary"],
    },
    handler: async (args: { itemId: string; summary: string }) => {
      const prev = collector.results.get(args.itemId);
      collector.results.set(args.itemId, {
        itemId: args.itemId,
        summary: args.summary,
        tag: prev?.tag ?? "Info",
      });
      return { ok: true };
    },
  });

  const tagItem = defineTool("tag_item", {
    description: "Tag a feed item as 'Task' (the user must act) or 'Info' (FYI only).",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "The feed item id" },
        tag: { type: "string", enum: ["Task", "Info"], description: "Task or Info" },
      },
      required: ["itemId", "tag"],
    },
    handler: async (args: { itemId: string; tag: string }) => {
      if (!isTagKind(args.tag)) throw new Error(`invalid tag: ${args.tag}`);
      const tag: TagKind = args.tag;
      const prev = collector.results.get(args.itemId);
      collector.results.set(args.itemId, {
        itemId: args.itemId,
        summary: prev?.summary ?? "",
        tag,
      });
      return { ok: true };
    },
  });

  const createTodo = defineTool("create_todo", {
    description: "Propose a Todo for a Task-tagged feed item. The user approves it later.",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "The feed item id" },
        title: { type: "string", description: "Short actionable todo title" },
      },
      required: ["itemId", "title"],
    },
    handler: async (args: { itemId: string; title: string }) => {
      collector.todos.push({
        id: `todo-${args.itemId}`,
        itemId: args.itemId,
        title: args.title,
        done: false,
      });
      return { ok: true };
    },
  });

  return [summarizeItem, tagItem, createTodo];
}
