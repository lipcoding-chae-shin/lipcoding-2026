import { describe, it, expect } from "vitest";
import { buildTriagePrompt } from "./triage";
import type { FeedItem } from "../types";

const items: FeedItem[] = [
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
});
