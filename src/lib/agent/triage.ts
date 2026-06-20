import { CopilotClient } from "@github/copilot-sdk";
import { azureProvider, azureModel } from "./copilot";
import { createCollector, createTriageTools } from "./tools";
import type { FeedItem, TriageResponse } from "../types";

export function buildTriagePrompt(items: FeedItem[]): string {
  const lines = items.map(
    (it) =>
      `- id=${it.id} | source=${it.source} | from=${it.author} | title: ${it.title}\n    body: ${it.body}`
  );
  return [
    "You are a productivity triage assistant.",
    "For EACH feed item listed below, perform these steps in order:",
    "1. Call summarize_item with a concise one-sentence summary (keep the item's language).",
    "2. Call tag_item with 'Task' if the user must take an action, otherwise 'Info'.",
    "3. If and only if you tagged it 'Task', call create_todo with a short actionable title.",
    "Process every item exactly once. Do not skip any item. Do not invent items.",
    "",
    "Feed items:",
    ...lines,
  ].join("\n");
}

export async function runTriage(
  items: FeedItem[],
  onDelta?: (text: string) => void
): Promise<TriageResponse> {
  const collector = createCollector();
  const client = new CopilotClient();
  try {
    const session = await client.createSession({
      model: azureModel(),
      streaming: true,
      provider: azureProvider(),
      tools: createTriageTools(collector),
    });

    if (onDelta) {
      session.on("assistant.message_delta", (event) => {
        onDelta(event.data.deltaContent);
      });
    }

    await session.sendAndWait({ prompt: buildTriagePrompt(items) });
  } finally {
    await client.stop();
  }

  return {
    results: items.map(
      (it) =>
        collector.results.get(it.id) ?? { itemId: it.id, summary: "", tag: "Info" as const }
    ),
    todos: collector.todos.map((t) => {
      const item = items.find((i) => i.id === t.itemId);
      return { ...t, sourceUrl: item?.url };
    }),
  };
}
