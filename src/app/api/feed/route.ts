import { NextResponse, type NextRequest } from "next/server";
import { mockRawFeed } from "@/lib/sources/mock";
import { fetchGmailFeed } from "@/lib/sources/gmail";
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

  // Real Gmail (when connected) replaces the mock gmail items; mock github/news stay.
  const mock = mockRawFeed().filter((it) =>
    gmail.length > 0 ? it.source !== "gmail" : true
  );

  const raw = [...gmail, ...mock].sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt)
  );

  // Eager triage: items come back already summarized + tagged (triaged:true).
  const items = await summarizeFeed(raw);
  const body: FeedResponse = { items };
  return NextResponse.json(body);
}
