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

/**
 * How the current user is related to a GitHub item. This is the single most
 * important signal for triage: `review-requested`/`assignee` almost always
 * mean the user must act (Task), while `mentioned`/`author` are usually FYI
 * (Info). The relationship is not a field on the search result, so callers
 * derive it from the query that produced the item.
 */
export type GithubRelationship =
  | "review-requested"
  | "assignee"
  | "mentioned"
  | "author"
  | "involved";

/** Collapse a body to a single short line so it adds signal without noise. */
function bodySnippet(body: string | null | undefined, max = 200): string {
  if (!body) return "";
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (!oneLine) return "";
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

export function githubItemsFromSearch(
  items: GithubIssueLike[],
  relationship?: GithubRelationship
): RawItem[] {
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
    const meta = [
      kind,
      it.state,
      relationship ? `relationship=${relationship}` : null,
    ].filter(Boolean);
    const snippet = bodySnippet(it.body);
    const body = snippet ? `${meta.join(" · ")} — ${snippet}` : meta.join(" · ");
    return {
      id: `github-${id}`,
      source: "github",
      title: repo ? `[${repo}] ${num}${title}` : `${num}${title}`,
      body,
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

/**
 * Relationship-scoped searches, in priority order (strongest action signal
 * first). Running them separately lets us label each item with *why* it
 * surfaced — the key context the single `involves:` query threw away.
 */
const RELATIONSHIP_QUERIES: { relationship: GithubRelationship; q: string }[] = [
  { relationship: "review-requested", q: "review-requested:%s is:open is:pr" },
  { relationship: "assignee", q: "assignee:%s is:open" },
  { relationship: "mentioned", q: "mentions:%s is:open" },
  { relationship: "author", q: "author:%s is:open" },
];

/** Priority for dedupe: lower index = stronger signal, wins on conflict. */
const RELATIONSHIP_PRIORITY: GithubRelationship[] = [
  "review-requested",
  "assignee",
  "mentioned",
  "author",
  "involved",
];

async function searchGithub(
  q: string,
  headers: Record<string, string>,
  perPage = 10
): Promise<GithubIssueLike[]> {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(
    q
  )}&sort=updated&order=desc&per_page=${perPage}`;
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub search failed: ${res.status}`);
  const data = (await res.json()) as { items?: GithubIssueLike[] };
  return data.items ?? [];
}

export async function fetchGithubFeed(
  token: string | undefined,
  limit = 10
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

  // Run each relationship query; merge with dedupe by id keeping the strongest
  // relationship. Falls back to the broad `involves:` query if every scoped
  // query yields nothing (e.g. token scope quirks), so the feed never goes
  // empty when there is genuinely involved activity.
  const byId = new Map<string, RawItem>();
  const rank = (rel: GithubRelationship) => RELATIONSHIP_PRIORITY.indexOf(rel);

  await Promise.all(
    RELATIONSHIP_QUERIES.map(async ({ relationship, q }) => {
      const items = await searchGithub(q.replace("%s", login), headers);
      for (const raw of githubItemsFromSearch(items, relationship)) {
        const existing = byId.get(raw.id);
        if (!existing || rank(relationship) < rank(relationshipOf(existing))) {
          byId.set(raw.id, raw);
        }
      }
    })
  );

  if (byId.size === 0) {
    const items = await searchGithub(`involves:${login} is:open`, headers);
    for (const raw of githubItemsFromSearch(items, "involved")) {
      byId.set(raw.id, raw);
    }
  }

  return [...byId.values()]
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, limit);
}

/** Recover the relationship label encoded in a RawItem body for dedupe. */
function relationshipOf(item: RawItem): GithubRelationship {
  const m = item.body.match(/relationship=([\w-]+)/);
  return (m?.[1] as GithubRelationship) ?? "involved";
}
