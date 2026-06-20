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
