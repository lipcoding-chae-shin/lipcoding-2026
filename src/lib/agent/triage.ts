import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";
import { azureProvider, azureModel, copilotCliPath } from "./copilot";
import { createCollector, createTriageTools } from "./tools";
import type { RawItem } from "../sources/raw";
import type { TriageResult, AgentTodo } from "./agent-types";

export interface TriageRunResult {
  results: TriageResult[];
  todos: AgentTodo[];
}

/**
 * Shared Task-vs-Info rubric injected into both the prompt body and the
 * system message. Without this, the model defaults almost everything to
 * 'Info' — especially GitHub items, whose `relationship=` body signal it
 * would otherwise ignore.
 */
export const CLASSIFICATION_GUIDANCE = [
  "Tagging rubric — decide who is expected to act next:",
  "- 'Task': the USER must personally do something (reply, review, decide, fix, approve, attend).",
  "- 'Info': FYI only — no action needed, or someone else owns the next step, or it is just a status/notification/newsletter.",
  "For GitHub items, the `relationship=` field in the body is the strongest signal:",
  "- relationship=review-requested → the user owes a code review → almost always 'Task'.",
  "- relationship=assignee → the user owns this issue/PR → almost always 'Task'.",
  "- relationship=mentioned → usually 'Info', unless the body clearly asks the user to act.",
  "- relationship=author → the user's own open item waiting on others → usually 'Info', unless it is blocked on the user.",
  "When the body text explicitly requests an action from the user, prefer 'Task' regardless of source.",
].join("\n");

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
    CLASSIFICATION_GUIDANCE,
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

export const TRIAGE_SYSTEM_MESSAGE = [
  "You are a productivity triage assistant.",
  "You MUST use the provided tools to record your work — do not just describe what you would do.",
  "For EACH feed item, in order:",
  "1. Call summarize_item with a concise one-sentence summary (keep the item's language).",
  "2. Call tag_item with 'Task' if the user must take an action, otherwise 'Info'.",
  "3. If and only if you tagged it 'Task', call create_todo with a short actionable title.",
  "Process every item exactly once. Do not skip any item. Do not invent items.",
  "",
  CLASSIFICATION_GUIDANCE,
].join("\n");

export interface TriageOptions {
  /** Whether to attach the GitHub MCP server (extra latency). Default: true
   *  when GITHUB_MCP_TOKEN is set. The eager feed path passes `false` because
   *  GitHub items are already fetched directly via the REST source. */
  github?: boolean;
}

export async function runTriage(
  items: RawItem[],
  onDelta?: (text: string) => void,
  opts: TriageOptions = {}
): Promise<TriageRunResult> {
  const collector = createCollector();
  // Explicitly resolve the bundled CLI: the SDK's own resolver fails under
  // Next.js, which would silently disable the agent. Falls back to SDK
  // default when not found (non-Next.js runtimes).
  const cliPath = copilotCliPath();
  const client = new CopilotClient(
    cliPath ? { connection: RuntimeConnection.forStdio({ path: cliPath }) } : undefined
  );
  try {
    const mcpServers = opts.github === false ? undefined : githubMcpServers();
    const availableTools = [
      "summarize_item",
      "tag_item",
      "create_todo",
      ...(mcpServers ? ["mcp:*"] : []),
    ];
    const session = await client.createSession({
      model: azureModel(),
      streaming: true,
      provider: azureProvider(),
      tools: createTriageTools(collector),
      availableTools,
      systemMessage: { mode: "replace", content: TRIAGE_SYSTEM_MESSAGE },
      skipCustomInstructions: true,
      ...(mcpServers ? { mcpServers } : {}),
    });

    if (onDelta) {
      session.on("assistant.message_delta", (event) => {
        onDelta(event.data.deltaContent);
      });
    }

    await session.sendAndWait(
      { prompt: buildTriagePrompt(items, Boolean(mcpServers)) },
      300_000
    );
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
