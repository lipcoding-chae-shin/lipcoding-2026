import { NextResponse } from "next/server";
import { oauthClient, GMAIL_SCOPES } from "@/lib/sources/gmail";

export const runtime = "nodejs";

export async function GET() {
  const url = oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
  });
  return NextResponse.redirect(url);
}
