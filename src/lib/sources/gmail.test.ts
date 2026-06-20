import { describe, it, expect } from "vitest";
import { gmailItemsFromMessages } from "./gmail";

describe("gmailItemsFromMessages", () => {
  it("maps Gmail messages into FeedItems", () => {
    const items = gmailItemsFromMessages([
      {
        id: "m1",
        snippet: "Please review the deploy plan",
        payload: {
          headers: [
            { name: "Subject", value: "Deploy plan review" },
            { name: "From", value: "Alice <alice@example.com>" },
            { name: "Date", value: "Fri, 20 Jun 2026 09:00:00 +0000" },
          ],
        },
      },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "gmail-m1",
      source: "gmail",
      title: "Deploy plan review",
      author: "Alice <alice@example.com>",
      body: "Please review the deploy plan",
      url: "https://mail.google.com/mail/u/0/#inbox/m1",
    });
    expect(() => new Date(items[0].receivedAt).toISOString()).not.toThrow();
  });

  it("falls back to '(no subject)' and empty author safely", () => {
    const items = gmailItemsFromMessages([{ id: "m2", snippet: "", payload: { headers: [] } }]);
    expect(items[0].title).toBe("(no subject)");
    expect(items[0].author).toBe("");
  });
});
