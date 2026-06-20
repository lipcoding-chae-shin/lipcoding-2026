import { describe, it, expect } from "vitest";
import { githubItemsFromSearch } from "./github";

describe("githubItemsFromSearch", () => {
  it("maps an involved pull request into a RawItem", () => {
    const items = githubItemsFromSearch([
      {
        id: 101,
        number: 142,
        title: "Fix feed route 500 on empty source",
        html_url: "https://github.com/acme/app/pull/142",
        repository_url: "https://api.github.com/repos/acme/app",
        state: "open",
        updated_at: "2026-06-20T09:00:00Z",
        user: { login: "chaerrypick01" },
        pull_request: { url: "https://api.github.com/repos/acme/app/pulls/142" },
      },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "github-101",
      source: "github",
      title: "[acme/app] #142 Fix feed route 500 on empty source",
      body: "PR · open",
      author: "chaerrypick01",
      url: "https://github.com/acme/app/pull/142",
    });
    expect(() => new Date(items[0].receivedAt).toISOString()).not.toThrow();
  });

  it("labels issues (no pull_request) and falls back safely", () => {
    const items = githubItemsFromSearch([
      {
        id: 202,
        number: 7,
        repository_url: "https://api.github.com/repos/acme/app",
        state: "open",
      },
    ]);
    expect(items[0].title).toBe("[acme/app] #7 (no title)");
    expect(items[0].body).toBe("Issue · open");
    expect(items[0].author).toBe("github");
    expect(items[0].url).toBe("https://github.com/acme/app");
  });

  it("encodes the relationship signal and a body snippet for triage", () => {
    const items = githubItemsFromSearch(
      [
        {
          id: 303,
          number: 9,
          title: "Add retry to feed fetch",
          repository_url: "https://api.github.com/repos/acme/app",
          state: "open",
          body: "Could you review this when you get a chance?\n\nThanks!",
          pull_request: { url: "x" },
        },
      ],
      "review-requested"
    );
    expect(items[0].body).toBe(
      "PR · open · relationship=review-requested — Could you review this when you get a chance? Thanks!"
    );
  });
});
