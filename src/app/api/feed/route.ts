import { NextResponse, type NextRequest } from "next/server";
import { mockFeed } from "@/lib/sources/mock";
import { fetchGmailFeed } from "@/lib/sources/gmail";
import type { FeedItem, FeedResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("g_access")?.value;
  let gmail: FeedItem[] = [];
  try {
    gmail = await fetchGmailFeed(token);
  } catch {
    gmail = []; // fallback: keep the feed working even if Gmail fails
  }
  const items = [...gmail, ...mockFeed()].sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt)
  );
  const body: FeedResponse = { items };
  return NextResponse.json(body);
}
