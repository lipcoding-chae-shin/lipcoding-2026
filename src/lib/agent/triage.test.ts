import { describe, it, expect } from "vitest";
import { buildTriagePrompt, githubMcpServers } from "./triage";
import type { RawItem } from "../sources/raw";

const items: RawItem[] = [
  { id: "a1", source: "news", title: "T1", body: "B1", author: "x", receivedAt: "2026-06-20T00:00:00.000Z" },
];

describe("buildTriagePrompt", () => {
  it("instructs the three-step tool flow and includes every item id", () => {
    const p = buildTriagePrompt(items);
    expect(p).toContain("summarize_item");
    expect(p).toContain("tag_item");
    expect(p).toContain("create_todo");
    expect(p).toContain("id=a1");
  });

  it("includes the Task/Info rubric and GitHub relationship guidance", () => {
    const p = buildTriagePrompt(items);
    expect(p).toContain("Tagging rubric");
    expect(p).toContain("relationship=review-requested");
    expect(p).toContain("relationship=assignee");
  });
});

describe("githubMcpServers", () => {
  it("returns undefined without a token", () => {
    delete process.env.GITHUB_MCP_TOKEN;
    expect(githubMcpServers()).toBeUndefined();
  });
  it("builds an http MCP config with the bearer token", () => {
    process.env.GITHUB_MCP_TOKEN = "ghp_test";
    const cfg = githubMcpServers()!;
    expect(cfg.github).toMatchObject({
      type: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: { Authorization: "Bearer ghp_test" },
      tools: ["*"],
    });
  });
});
