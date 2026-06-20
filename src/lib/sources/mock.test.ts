import { describe, it, expect } from "vitest";
import { mockRawFeed } from "./mock";

describe("mockRawFeed", () => {
  it("returns at least 3 items, all valid RawItems", () => {
    const items = mockRawFeed();
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const it of items) {
      expect(typeof it.id).toBe("string");
      expect(["gmail", "github", "news"]).toContain(it.source);
      expect(typeof it.title).toBe("string");
      expect(typeof it.body).toBe("string");
      expect(() => new Date(it.receivedAt).toISOString()).not.toThrow();
    }
  });
  it("has unique ids", () => {
    const ids = mockRawFeed().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("spans all three sources for a full offline demo", () => {
    const sources = new Set(mockRawFeed().map((i) => i.source));
    expect(sources).toEqual(new Set(["gmail", "github", "news"]));
  });
});
