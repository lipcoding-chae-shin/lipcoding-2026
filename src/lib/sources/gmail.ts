import { google } from "googleapis";
import type { RawItem } from "./raw";

export const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export interface GmailHeader {
  name?: string | null;
  value?: string | null;
}
export interface GmailMessageLike {
  id?: string | null;
  snippet?: string | null;
  payload?: { headers?: GmailHeader[] | null } | null;
}

function header(msg: GmailMessageLike, name: string): string {
  const h = msg.payload?.headers?.find(
    (x) => (x.name ?? "").toLowerCase() === name.toLowerCase()
  );
  return h?.value ?? "";
}

export function gmailItemsFromMessages(messages: GmailMessageLike[]): RawItem[] {
  return messages.map((msg) => {
    const id = msg.id ?? crypto.randomUUID();
    const dateStr = header(msg, "Date");
    const parsed = dateStr ? new Date(dateStr) : new Date();
    const receivedAt = Number.isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();
    return {
      id: `gmail-${id}`,
      source: "gmail",
      title: header(msg, "Subject") || "(no subject)",
      body: msg.snippet ?? "",
      author: header(msg, "From"),
      url: `https://mail.google.com/mail/u/0/#inbox/${id}`,
      receivedAt,
    };
  });
}

export function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export async function fetchGmailFeed(accessToken: string | undefined): Promise<RawItem[]> {
  if (!accessToken) return [];
  const auth = oauthClient();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });
  const list = await gmail.users.messages.list({ userId: "me", maxResults: 10 });
  const ids = (list.data.messages ?? []).map((m) => m.id).filter(Boolean) as string[];
  const messages = await Promise.all(
    ids.map(async (id) => {
      const res = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });
      return res.data as GmailMessageLike;
    })
  );
  return gmailItemsFromMessages(messages);
}
