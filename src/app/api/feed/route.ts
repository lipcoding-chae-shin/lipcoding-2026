import { NextResponse } from "next/server";
import { mockFeed } from "@/lib/sources/mock";
import type { FeedResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const body: FeedResponse = { items: mockFeed() };
  return NextResponse.json(body);
}
