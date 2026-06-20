import { CopilotClient } from "@github/copilot-sdk";
import { azureProvider, azureModel } from "./copilot";
import { createCollector, createTriageTools } from "./tools";
import type { RawItem } from "../sources/raw";
import type { TriageResult, AgentTodo } from "./agent-types";

export interface TriageRunResult {
  results: TriageResult[];
  todos: AgentTodo[];
}

export function buildTriagePrompt(items: RawItem[], withGithub = false): string {
  const lines = items.map(
    (it) =>
      `- id=${it.id} | source=${it.source} | from=${it.author} | title: ${it.title}\n    body: ${it.body}`
  );
  const githubLine = withGithub
    ? [
        "",
        "Additionally, use the GitHub MCP tools to fetch the user's most recent " +
          "notifications or review requests. For each, summarize_item and tag_item " +
          "(use a synthetic id like 'github-<n>'), and create_todo if it needs action.",
      ]
    : [];
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
    ...githubLine,
  ].join("\n");
}

export function githubMcpServers() {
  const token = process.env.GITHUB_MCP_TOKEN;
  if (!token) return undefined;
  return {
    github: {
      type: "http" as const,
      url: "https://api.githubcopilot.com/mcp/",
      headers: { Authorization: `Bearer ${token}` },
      tools: ["*"],
    },
  };
}

export async function runTriage(
  items: RawItem[],
  onDelta?: (text: string) => void
): Promise<TriageRunResult> {
  const collector = createCollector();
  const client = new CopilotClient();
  try {
    const mcpServers = githubMcpServers();
    const session = await client.createSession({
      model: azureModel(),
      streaming: true,
      provider: azureProvider(),
      tools: createTriageTools(collector),
      ...(mcpServers ? { mcpServers } : {}),
    });

    if (onDelta) {
      session.on("assistant.message_delta", (event) => {
        onDelta(event.data.deltaContent);
      });
    }

    await session.sendAndWait({ prompt: buildTriagePrompt(items, Boolean(mcpServers)) });
  } finally {
    await client.stop();
  }

  return {
    results: items.map(
      (it) =>
        collector.results.get(it.id) ?? { itemId: it.id, summary: "", tag: "Info" as const }
    ),
    todos: collector.todos,
  };
}
