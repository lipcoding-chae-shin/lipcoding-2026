import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Absolute path to the bundled `@github/copilot` CLI (`index.js`).
 *
 * The SDK normally locates this itself, but its resolver
 * (`import.meta.resolve` / `createRequire(__filename)`) fails under the
 * Next.js (Turbopack) bundled runtime — it can't see the project's
 * `node_modules`, so the agent throws and the feed silently degrades to
 * canned summaries. We resolve the path explicitly and hand it to
 * `CopilotClient` via `connection`.
 *
 * Resolution order:
 *   1. `COPILOT_CLI_PATH` env override (honored by the SDK too).
 *   2. Walk up from `process.cwd()` looking for
 *      `node_modules/@github/copilot/index.js`.
 *
 * Returns `undefined` when not found, so non-Next.js callers fall back to
 * the SDK's own resolution.
 */
export function copilotCliPath(): string | undefined {
  const override = process.env.COPILOT_CLI_PATH;
  if (override && existsSync(override)) return override;

  let dir = process.cwd();
  // Walk up the directory tree to support hoisted/monorepo layouts.
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, "node_modules", "@github", "copilot", "index.js");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

export function azureProvider() {
  const baseUrl = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = azureApiKey();
  if (!baseUrl || !apiKey) {
    throw new Error("AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY are required");
  }
  return {
    type: "azure" as const,
    baseUrl, // host only, e.g. https://your-resource.openai.azure.com
    apiKey,
    azure: { apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21" },
  };
}

/** Azure OpenAI key. Accepts AZURE_OPENAI_API_KEY (canonical) or AZURE_OPENAI_KEY (alias). */
function azureApiKey(): string | undefined {
  return process.env.AZURE_OPENAI_API_KEY ?? process.env.AZURE_OPENAI_KEY;
}

export function azureModel(): string {
  return process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o-mini";
}

/** True when Azure OpenAI is configured. Used to choose the live agent path
 * vs. the offline canned-summary fallback without throwing. */
export function isAzureConfigured(): boolean {
  return Boolean(process.env.AZURE_OPENAI_ENDPOINT && azureApiKey());
}
