import type { NextRequest } from "next/server";
import { runTriage } from "@/lib/agent/triage";
import type { RawItem } from "@/lib/sources/raw";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let items: RawItem[] = [];
  try {
    const parsed = (await req.json()) as { items?: RawItem[] };
    items = parsed.items ?? [];
  } catch {
    return new Response(JSON.stringify({ message: "invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      try {
        const result = await runTriage(items, (text) => send("delta", { text }));
        send("result", result);
      } catch (err) {
        send("error", { message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
