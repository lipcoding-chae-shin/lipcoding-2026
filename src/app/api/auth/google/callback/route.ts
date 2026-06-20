import { NextResponse, type NextRequest } from "next/server";
import { oauthClient } from "@/lib/sources/gmail";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/?gmail=error", req.url));

  const auth = oauthClient();
  let tokens;
  try {
    ({ tokens } = await auth.getToken(code));
  } catch {
    return NextResponse.redirect(new URL("/?gmail=error", req.url));
  }
  const res = NextResponse.redirect(new URL("/?gmail=connected", req.url));
  if (tokens.access_token) {
    res.cookies.set("g_access", tokens.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 3000,
      path: "/",
    });
  }
  return res;
}
