import { describe, it, expect } from "vitest";
import { mockFeed } from "./mock";

describe("mockFeed", () => {
  it("returns at least 3 items, all valid FeedItems", () => {
    const items = mockFeed();
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const it of items) {
      expect(typeof it.id).toBe("string");
      expect(it.source).toBe("news");
      expect(typeof it.title).toBe("string");
      expect(() => new Date(it.receivedAt).toISOString()).not.toThrow();
    }
  });
  it("has unique ids", () => {
    const ids = mockFeed().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
