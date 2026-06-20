import { NextResponse, type NextRequest } from "next/server";
import { mockRawFeed } from "@/lib/sources/mock";
import { fetchGmailFeed } from "@/lib/sources/gmail";
import { fetchGithubFeed } from "@/lib/sources/github";
import { summarizeFeed } from "@/lib/feed/summarize";
import type { RawItem } from "@/lib/sources/raw";
import type { FeedResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("g_access")?.value;

  let gmail: RawItem[] = [];
  try {
    gmail = await fetchGmailFeed(token);
  } catch {
    gmail = []; // keep the feed working even if Gmail fails
  }

  let github: RawItem[] = [];
  try {
    github = await fetchGithubFeed(process.env.GITHUB_MCP_TOKEN);
  } catch {
    github = []; // keep the feed working even if GitHub fails
  }

  // Real sources (when available) replace their mock counterparts; any source
  // without a live connection keeps falling back to mock items.
  const mock = mockRawFeed().filter((it) => {
    if (gmail.length > 0 && it.source === "gmail") return false;
    if (github.length > 0 && it.source === "github") return false;
    return true;
  });

  const raw = [...gmail, ...github, ...mock].sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt)
  );

  // Eager triage: items come back already summarized + tagged (triaged:true).
  const items = await summarizeFeed(raw);
  const body: FeedResponse = { items };
  return NextResponse.json(body);
}
