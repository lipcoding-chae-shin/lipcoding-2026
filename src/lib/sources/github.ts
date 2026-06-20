import type { RawItem } from "./raw";

/**
 * Real GitHub source: open issues and pull requests the user is involved in
 * (author, assignee, mentioned, commenter, or review-requested). Mirrors the
 * Gmail source — `summarizeFeed` turns these raw items into the public
 * `FeedItem` contract by adding an AI summary + tag.
 *
 * Uses the existing `GITHUB_MCP_TOKEN` (a PAT with repo read scope).
 */

export interface GithubIssueLike {
  id?: number | string | null;
  number?: number | null;
  title?: string | null;
  body?: string | null;
  html_url?: string | null;
  repository_url?: string | null;
  state?: string | null;
  updated_at?: string | null;
  user?: { login?: string | null } | null;
  /** Present (truthy) when the search result is a pull request. */
  pull_request?: unknown;
}

/** Extract `owner/name` from an API repository_url. */
function repoFromUrl(repoUrl: string | null | undefined): string {
  if (!repoUrl) return "";
  const m = repoUrl.match(/repos\/([^/]+\/[^/]+)$/);
  return m ? m[1] : "";
}

export function githubItemsFromSearch(items: GithubIssueLike[]): RawItem[] {
  return items.map((it) => {
    const id = it.id ?? crypto.randomUUID();
    const repo = repoFromUrl(it.repository_url);
    const kind = it.pull_request ? "PR" : "Issue";
    const num = it.number != null ? `#${it.number} ` : "";
    const title = it.title ?? "(no title)";
    const parsed = it.updated_at ? new Date(it.updated_at) : new Date();
    const receivedAt = Number.isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();
    return {
      id: `github-${id}`,
      source: "github",
      title: repo ? `[${repo}] ${num}${title}` : `${num}${title}`,
      body: [kind, it.state].filter(Boolean).join(" · "),
      author: it.user?.login ?? "github",
      url:
        it.html_url ??
        (repo ? `https://github.com/${repo}` : "https://github.com"),
      receivedAt,
    };
  });
}

const GITHUB_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

export async function fetchGithubFeed(
  token: string | undefined
): Promise<RawItem[]> {
  if (!token) return [];
  const headers = GITHUB_HEADERS(token);

  const me = await fetch("https://api.github.com/user", {
    headers,
    cache: "no-store",
  });
  if (!me.ok) throw new Error(`GitHub user lookup failed: ${me.status}`);
  const login = ((await me.json()) as { login?: string }).login;
  if (!login) return [];

  const q = `involves:${login} is:open`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(
    q
  )}&sort=updated&order=desc&per_page=10`;
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub search failed: ${res.status}`);

  const data = (await res.json()) as { items?: GithubIssueLike[] };
  return githubItemsFromSearch(data.items ?? []);
}
