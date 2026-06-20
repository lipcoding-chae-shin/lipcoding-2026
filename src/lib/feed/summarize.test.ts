import { describe, it, expect, beforeEach } from "vitest";
import { summarizeFeed, clearSummaryCache } from "./summarize";
import type { RawItem } from "../sources/raw";

const raw: RawItem[] = [
  {
    id: "r1",
    source: "gmail",
    title: "결제 안내",
    body: "결제 기한은 내일입니다. 확인이 필요합니다.",
    author: "billing@example.com",
    url: "https://mail.example.com/r1",
    receivedAt: "2026-06-20T08:00:00.000Z",
    summary: "결제 기한이 내일입니다. 확인이 필요합니다.",
    tag: "Task",
  },
  {
    id: "r2",
    source: "news",
    title: "공지",
    body: "점심 메뉴 투표 결과가 공유되었습니다.",
    author: "office",
    receivedAt: "2026-06-20T07:00:00.000Z",
    // no canned summary/tag → exercises the fallback path
  },
];

describe("summarizeFeed (offline / no Azure)", () => {
  beforeEach(() => {
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;
    clearSummaryCache();
  });

  it("returns FeedItems already summarized + tagged (triaged:true)", async () => {
    const items = await summarizeFeed(raw);
    expect(items).toHaveLength(2);
    for (const it of items) {
      expect(it.triaged).toBe(true);
      expect(typeof it.summary).toBe("string");
      expect(["Task", "Info"]).toContain(it.tag);
    }
  });

  it("uses canned summary/tag when present", async () => {
    const [first] = await summarizeFeed(raw);
    expect(first.id).toBe("r1");
    expect(first.summary).toBe("결제 기한이 내일입니다. 확인이 필요합니다.");
    expect(first.tag).toBe("Task");
    expect(first.url).toBe("https://mail.example.com/r1");
  });

  it("falls back to first sentence + Info when no canned values", async () => {
    const items = await summarizeFeed(raw);
    const r2 = items.find((i) => i.id === "r2")!;
    expect(r2.summary).toBe("점심 메뉴 투표 결과가 공유되었습니다.");
    expect(r2.tag).toBe("Info");
    expect(r2.url).toBe("#"); // missing url → safe fallback
  });

  it("returns [] for an empty feed", async () => {
    expect(await summarizeFeed([])).toEqual([]);
  });
});
