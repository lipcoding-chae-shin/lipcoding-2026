# Triage Backend Implementation Plan (Dev B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend/AI layer of "Triage Feed": ingest subscribed sources into a unified feed, and run a Copilot SDK agent (on Azure OpenAI) that summarizes, tags (Task/Info), and proposes Todos for Task items — exposed as two HTTP endpoints with streaming.

**Architecture:** Next.js (App Router) single app. Route handlers under `src/app/api/*` call library code in `src/lib/*`. A Copilot SDK session runs the triage agent loop with three custom tools (`summarize_item`, `tag_item`, `create_todo`) and uses Azure OpenAI via BYOK. GitHub is ingested through the official GitHub remote MCP server; Gmail via read-only OAuth; internal news via a mock seed. The frontend (Dev A) consumes `GET /api/feed` and `POST /api/triage` (SSE) against the shared types in `src/lib/types.ts`.

**Tech Stack:** TypeScript, Next.js 15 (App Router, Node runtime), `@github/copilot-sdk`, `googleapis` (Gmail), Vitest (tests), Azure Container Apps via `azd`.

## Global Constraints

- Web app only; must be deployable to Azure (`azd up`, host = Azure Container Apps).
- Model calls MUST go through Azure OpenAI (BYOK), never an external model API directly.
- Copilot SDK must be used deeply: agent loop + custom tool calls + streaming (this is the app's core).
- Secrets via env only (`.env` local, Azure App Settings/Key Vault in prod). Never commit secrets. Provide `.env.example`.
- Risky/irreversible actions need a human approval gate: the agent only *proposes* Todos; it never sends mail or deletes anything. Gmail scope is read-only (`gmail.readonly`).
- Shared contract `src/lib/types.ts` is frozen after Task 1; changes require one-line agreement with Dev A.
- Node 20+ (local env has Node 24). Use `npm`.
- Each summary/tag/todo must carry the source item id so the UI can show provenance.

---

### Task 1: Scaffold Next.js app, tooling, and shared types

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.env.example`, `.gitignore` (update)
- Create: `src/app/layout.tsx`, `src/app/page.tsx` (placeholder — Dev A owns it later)
- Create: `src/lib/types.ts`
- Test: `src/lib/types.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the shared contract every other task and Dev A rely on:
  - `type SourceKind = "gmail" | "github" | "news"`
  - `interface FeedItem { id: string; source: SourceKind; title: string; body: string; author: string; url?: string; receivedAt: string }`
  - `type TagKind = "Task" | "Info"`
  - `interface TriageResult { itemId: string; summary: string; tag: TagKind }`
  - `interface Todo { id: string; itemId: string; title: string; done: boolean; sourceUrl?: string }`
  - `interface FeedResponse { items: FeedItem[] }`
  - `interface TriageResponse { results: TriageResult[]; todos: Todo[] }`

- [ ] **Step 1: Scaffold the app**

Run:
```bash
npx create-next-app@latest . --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*" --use-npm --yes
npm install @github/copilot-sdk googleapis
npm install -D vitest
```

- [ ] **Step 2: Add the test script and Vitest config**

Edit `package.json` `scripts` to include:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 3: Write the failing test for shared types**

Create `src/lib/types.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { isTagKind } from "./types";

describe("isTagKind", () => {
  it("accepts Task and Info", () => {
    expect(isTagKind("Task")).toBe(true);
    expect(isTagKind("Info")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isTagKind("Urgent")).toBe(false);
    expect(isTagKind("")).toBe(false);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `isTagKind` is not exported from `./types`.

- [ ] **Step 5: Write the shared types and helper**

Create `src/lib/types.ts`:
```ts
export type SourceKind = "gmail" | "github" | "news";

export interface FeedItem {
  id: string;
  source: SourceKind;
  title: string;
  body: string;
  author: string;
  url?: string;
  receivedAt: string; // ISO-8601
}

export type TagKind = "Task" | "Info";

export interface TriageResult {
  itemId: string;
  summary: string;
  tag: TagKind;
}

export interface Todo {
  id: string;
  itemId: string;
  title: string;
  done: boolean;
  sourceUrl?: string;
}

export interface FeedResponse {
  items: FeedItem[];
}

export interface TriageResponse {
  results: TriageResult[];
  todos: Todo[];
}

export function isTagKind(value: string): value is TagKind {
  return value === "Task" || value === "Info";
}
```

- [ ] **Step 6: Add `.env.example`**

Create `.env.example`:
```bash
# Azure OpenAI (BYOK). baseUrl is the host only, no /openai/v1 path.
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-10-21

# Gmail read-only OAuth (Task 5)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# GitHub remote MCP (Task 6). A GitHub token with repo/notifications read scope.
GITHUB_MCP_TOKEN=
```

Confirm `.env*` (except `.env.example`) is gitignored; `create-next-app` adds `.env*` to `.gitignore` by default — verify and keep `!.env.example`.

- [ ] **Step 7: Run tests and build to verify green**

Run: `npm test && npm run build`
Expected: test PASS; Next.js build succeeds.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(backend): scaffold Next.js app + shared types + env"
```

---

### Task 2: Mock news source and GET /api/feed

**Files:**
- Create: `src/lib/sources/mock.ts`
- Create: `src/app/api/feed/route.ts`
- Test: `src/lib/sources/mock.test.ts`

**Interfaces:**
- Consumes: `FeedItem`, `SourceKind` from `src/lib/types.ts`.
- Produces:
  - `mockFeed(): FeedItem[]` — deterministic seed of internal-news/Slack-style items.
  - `GET /api/feed` → `FeedResponse` JSON. Later tasks merge Gmail/GitHub items in.

- [ ] **Step 1: Write the failing test for the mock source**

Create `src/lib/sources/mock.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mockFeed } from "./mock";

describe("mockFeed", () => {
  it("returns at least 3 items, all valid FeedItems", () => {
    const items = mockFeed();
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const it of items) {
      expect(typeof it.id).toBe("string");
      expect(it.source).toBe("news");
      expect(typeof it.title).toBe("string");
      expect(() => new Date(it.receivedAt).toISOString()).not.toThrow();
    }
  });
  it("has unique ids", () => {
    const ids = mockFeed().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `./mock`.

- [ ] **Step 3: Implement the mock source**

Create `src/lib/sources/mock.ts`:
```ts
import type { FeedItem } from "../types";

export function mockFeed(): FeedItem[] {
  return [
    {
      id: "news-1",
      source: "news",
      title: "보안 패치 배포: 오늘 18시 서버 재시작 예정",
      body: "인프라팀이 18:00에 보안 패치를 배포합니다. 배포 전 본인 서비스 헬스체크를 확인해 주세요.",
      author: "infra-team",
      url: "https://intra.example.com/news/1",
      receivedAt: "2026-06-20T09:10:00.000Z",
    },
    {
      id: "news-2",
      source: "news",
      title: "Q3 OKR 초안 리뷰 요청",
      body: "각 팀 리드는 금요일까지 Q3 OKR 초안에 코멘트를 남겨 주세요. 미응답 시 자동 확정됩니다.",
      author: "strategy",
      url: "https://intra.example.com/news/2",
      receivedAt: "2026-06-20T10:00:00.000Z",
    },
    {
      id: "news-3",
      source: "news",
      title: "사내 점심 메뉴 투표 결과 공지",
      body: "이번 주 점심 메뉴 투표 결과가 게시판에 공유되었습니다. 참고만 하세요.",
      author: "office",
      url: "https://intra.example.com/news/3",
      receivedAt: "2026-06-20T11:30:00.000Z",
    },
  ];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Implement the feed route**

Create `src/app/api/feed/route.ts`:
```ts
import { NextResponse } from "next/server";
import { mockFeed } from "@/lib/sources/mock";
import type { FeedResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const body: FeedResponse = { items: mockFeed() };
  return NextResponse.json(body);
}
```

- [ ] **Step 6: Manually verify the endpoint**

Run (two terminals):
```bash
npm run dev
curl -s http://localhost:3000/api/feed | head -c 400
```
Expected: JSON `{"items":[{"id":"news-1",...}]}`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(backend): mock news source + GET /api/feed"
```

---

### Task 3: Triage tools (Copilot SDK custom tools) + collector

**Files:**
- Create: `src/lib/agent/tools.ts`
- Test: `src/lib/agent/tools.test.ts`

**Interfaces:**
- Consumes: `defineTool` from `@github/copilot-sdk`; `TagKind`, `TriageResult`, `Todo` from types.
- Produces:
  - `interface TriageCollector { results: Map<string, TriageResult>; todos: Todo[] }`
  - `createCollector(): TriageCollector`
  - `createTriageTools(collector: TriageCollector): ReturnType<typeof defineTool>[]` — three tools whose handlers mutate the collector. Used by Task 4.

- [ ] **Step 1: Write the failing test (handlers mutate the collector)**

Create `src/lib/agent/tools.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createCollector, createTriageTools } from "./tools";

// The SDK tool object exposes the handler we configured. We call it directly
// to test our collector logic without a live model.
type ToolLike = { name: string; handler: (args: any) => Promise<unknown> };

function byName(tools: unknown[], name: string): ToolLike {
  const t = (tools as ToolLike[]).find((x) => x.name === name);
  if (!t) throw new Error(`tool ${name} not found`);
  return t;
}

describe("triage tools", () => {
  it("summarize_item + tag_item merge into one result", async () => {
    const c = createCollector();
    const tools = createTriageTools(c);
    await byName(tools, "summarize_item").handler({ itemId: "x1", summary: "S" });
    await byName(tools, "tag_item").handler({ itemId: "x1", tag: "Task" });
    expect(c.results.get("x1")).toEqual({ itemId: "x1", summary: "S", tag: "Task" });
  });

  it("create_todo appends a todo", async () => {
    const c = createCollector();
    const tools = createTriageTools(c);
    await byName(tools, "create_todo").handler({ itemId: "x1", title: "Do it" });
    expect(c.todos).toEqual([
      { id: "todo-x1", itemId: "x1", title: "Do it", done: false },
    ]);
  });

  it("tag_item rejects invalid tags", async () => {
    const c = createCollector();
    const tools = createTriageTools(c);
    await expect(
      byName(tools, "tag_item").handler({ itemId: "x1", tag: "Nope" })
    ).rejects.toThrow();
  });
});
```

> Note: if the SDK's `defineTool` does not surface `name`/`handler` as readable properties, adjust the test to import the handler factories directly. Verify the shape with `node -e "const s=require('@github/copilot-sdk'); console.log(Object.keys(s.defineTool('t',{description:'d',parameters:{type:'object',properties:{}},handler:async()=>({})})))"` before writing the assertions.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tools`
Expected: FAIL — cannot find `./tools`.

- [ ] **Step 3: Implement the tools and collector**

Create `src/lib/agent/tools.ts`:
```ts
import { defineTool } from "@github/copilot-sdk";
import { isTagKind, type TagKind, type TriageResult, type Todo } from "../types";

export interface TriageCollector {
  results: Map<string, TriageResult>;
  todos: Todo[];
}

export function createCollector(): TriageCollector {
  return { results: new Map(), todos: [] };
}

export function createTriageTools(collector: TriageCollector) {
  const summarizeItem = defineTool("summarize_item", {
    description: "Record a concise one-sentence summary for a feed item.",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "The feed item id" },
        summary: { type: "string", description: "One-sentence summary in the item's language" },
      },
      required: ["itemId", "summary"],
    },
    handler: async (args: { itemId: string; summary: string }) => {
      const prev = collector.results.get(args.itemId);
      collector.results.set(args.itemId, {
        itemId: args.itemId,
        summary: args.summary,
        tag: prev?.tag ?? "Info",
      });
      return { ok: true };
    },
  });

  const tagItem = defineTool("tag_item", {
    description: "Tag a feed item as 'Task' (the user must act) or 'Info' (FYI only).",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "The feed item id" },
        tag: { type: "string", enum: ["Task", "Info"], description: "Task or Info" },
      },
      required: ["itemId", "tag"],
    },
    handler: async (args: { itemId: string; tag: string }) => {
      if (!isTagKind(args.tag)) throw new Error(`invalid tag: ${args.tag}`);
      const tag: TagKind = args.tag;
      const prev = collector.results.get(args.itemId);
      collector.results.set(args.itemId, {
        itemId: args.itemId,
        summary: prev?.summary ?? "",
        tag,
      });
      return { ok: true };
    },
  });

  const createTodo = defineTool("create_todo", {
    description: "Propose a Todo for a Task-tagged feed item. The user approves it later.",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "The feed item id" },
        title: { type: "string", description: "Short actionable todo title" },
      },
      required: ["itemId", "title"],
    },
    handler: async (args: { itemId: string; title: string }) => {
      collector.todos.push({
        id: `todo-${args.itemId}`,
        itemId: args.itemId,
        title: args.title,
        done: false,
      });
      return { ok: true };
    },
  });

  return [summarizeItem, tagItem, createTodo];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tools`
Expected: PASS. (If `defineTool` does not expose `name`/`handler`, refactor handlers into exported plain functions and test those, then pass them to `defineTool` — keep collector logic in testable functions.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(backend): triage tools + collector (summarize/tag/create_todo)"
```

---

### Task 4: Triage runner (agent loop on Azure) + POST /api/triage (SSE)

**Files:**
- Create: `src/lib/agent/copilot.ts`
- Create: `src/lib/agent/triage.ts`
- Create: `src/app/api/triage/route.ts`
- Test: `src/lib/agent/triage.test.ts`
- Create: `scripts/smoke-triage.ts`

**Interfaces:**
- Consumes: `createCollector`, `createTriageTools` (Task 3); `FeedItem`, `TriageResponse` (Task 1).
- Produces:
  - `azureProvider(): { type: "azure"; baseUrl: string; apiKey: string; azure: { apiVersion: string } }`
  - `buildTriagePrompt(items: FeedItem[]): string`
  - `runTriage(items: FeedItem[], onDelta?: (text: string) => void): Promise<TriageResponse>`
  - `POST /api/triage` body `{ items: FeedItem[] }` → SSE stream: `event: delta` (`{text}`), then `event: result` (`TriageResponse`), or `event: error` (`{message}`).

- [ ] **Step 1: Write the failing test for the prompt builder (pure function)**

Create `src/lib/agent/triage.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildTriagePrompt } from "./triage";
import type { FeedItem } from "../types";

const items: FeedItem[] = [
  { id: "a1", source: "news", title: "T1", body: "B1", author: "x", receivedAt: "2026-06-20T00:00:00.000Z" },
];

describe("buildTriagePrompt", () => {
  it("instructs the three-step tool flow and includes every item id", () => {
    const p = buildTriagePrompt(items);
    expect(p).toContain("summarize_item");
    expect(p).toContain("tag_item");
    expect(p).toContain("create_todo");
    expect(p).toContain("id=a1");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- triage`
Expected: FAIL — cannot find `./triage`.

- [ ] **Step 3: Implement the Azure provider helper**

Create `src/lib/agent/copilot.ts`:
```ts
export function azureProvider() {
  const baseUrl = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY are required");
  }
  return {
    type: "azure" as const,
    baseUrl, // host only, e.g. https://your-resource.openai.azure.com
    apiKey,
    azure: { apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21" },
  };
}

export function azureModel(): string {
  return process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o-mini";
}
```

- [ ] **Step 4: Implement the triage runner**

Create `src/lib/agent/triage.ts`:
```ts
import { CopilotClient } from "@github/copilot-sdk";
import { azureProvider, azureModel } from "./copilot";
import { createCollector, createTriageTools } from "./tools";
import type { FeedItem, TriageResponse } from "../types";

export function buildTriagePrompt(items: FeedItem[]): string {
  const lines = items.map(
    (it) =>
      `- id=${it.id} | source=${it.source} | from=${it.author} | title: ${it.title}\n    body: ${it.body}`
  );
  return [
    "You are a productivity triage assistant.",
    "For EACH feed item listed below, perform these steps in order:",
    "1. Call summarize_item with a concise one-sentence summary (keep the item's language).",
    "2. Call tag_item with 'Task' if the user must take an action, otherwise 'Info'.",
    "3. If and only if you tagged it 'Task', call create_todo with a short actionable title.",
    "Process every item exactly once. Do not skip any item. Do not invent items.",
    "",
    "Feed items:",
    ...lines,
  ].join("\n");
}

export async function runTriage(
  items: FeedItem[],
  onDelta?: (text: string) => void
): Promise<TriageResponse> {
  const collector = createCollector();
  const client = new CopilotClient();
  try {
    const session = await client.createSession({
      model: azureModel(),
      streaming: true,
      provider: azureProvider(),
      tools: createTriageTools(collector),
    });

    if (onDelta) {
      session.on("assistant.message_delta", (event) => {
        onDelta(event.data.deltaContent);
      });
    }

    await session.sendAndWait({ prompt: buildTriagePrompt(items) });
  } finally {
    await client.stop();
  }

  return {
    results: items.map(
      (it) =>
        collector.results.get(it.id) ?? { itemId: it.id, summary: "", tag: "Info" as const }
    ),
    todos: collector.todos.map((t) => {
      const item = items.find((i) => i.id === t.itemId);
      return { ...t, sourceUrl: item?.url };
    }),
  };
}
```

- [ ] **Step 5: Run the unit test to verify it passes**

Run: `npm test -- triage`
Expected: PASS (the pure `buildTriagePrompt` test). `runTriage` is exercised by the smoke script, not unit tests, because it needs a live Azure deployment.

- [ ] **Step 6: Implement the SSE route**

Create `src/app/api/triage/route.ts`:
```ts
import type { NextRequest } from "next/server";
import { runTriage } from "@/lib/agent/triage";
import type { FeedItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let items: FeedItem[] = [];
  try {
    const parsed = (await req.json()) as { items?: FeedItem[] };
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
```

- [ ] **Step 7: Add a smoke script for the live agent**

Create `scripts/smoke-triage.ts`:
```ts
import { runTriage } from "../src/lib/agent/triage";
import { mockFeed } from "../src/lib/sources/mock";

async function main() {
  const out = await runTriage(mockFeed(), (t) => process.stdout.write(t));
  console.log("\n--- RESULTS ---");
  console.log(JSON.stringify(out, null, 2));
  const tasks = out.results.filter((r) => r.tag === "Task").length;
  if (out.results.length === 0) throw new Error("no results produced");
  console.log(`\nresults=${out.results.length} tasks=${tasks} todos=${out.todos.length}`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 8: Run the smoke test against Azure (requires `.env`)**

Run:
```bash
set -a && source .env && set +a && npx tsx scripts/smoke-triage.ts
```
Expected: streamed reasoning text, then a JSON `TriageResponse` where every mock item has a non-empty `summary`, news-1 and news-2 are likely `Task` with todos, news-3 is `Info`.

- [ ] **Step 9: Manually verify the SSE route**

Run (dev server up):
```bash
curl -N -s -X POST http://localhost:3000/api/triage \
  -H 'Content-Type: application/json' \
  -d "$(curl -s http://localhost:3000/api/feed)"
```
Expected: a stream of `event: delta` lines followed by one `event: result` line containing `results` and `todos`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(backend): triage agent on Azure OpenAI + POST /api/triage SSE"
```

---

### Task 5: Gmail read-only source + OAuth routes + merge into feed

**Files:**
- Create: `src/lib/sources/gmail.ts`
- Create: `src/app/api/auth/google/route.ts`
- Create: `src/app/api/auth/google/callback/route.ts`
- Modify: `src/app/api/feed/route.ts`
- Test: `src/lib/sources/gmail.test.ts`

**Interfaces:**
- Consumes: `googleapis`; `FeedItem` from types; the OAuth access token stored in an httpOnly cookie `g_access`.
- Produces:
  - `gmailItemsFromMessages(messages: GmailMessageLike[]): FeedItem[]` — pure mapper (testable).
  - `fetchGmailFeed(accessToken: string | undefined): Promise<FeedItem[]>` — returns `[]` when no token (mock-fallback friendly).
  - `GET /api/auth/google` → 302 to Google consent (`gmail.readonly`).
  - `GET /api/auth/google/callback` → exchanges code, sets `g_access` cookie, 302 to `/`.

- [ ] **Step 1: Write the failing test for the pure mapper**

Create `src/lib/sources/gmail.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { gmailItemsFromMessages } from "./gmail";

describe("gmailItemsFromMessages", () => {
  it("maps Gmail messages into FeedItems", () => {
    const items = gmailItemsFromMessages([
      {
        id: "m1",
        snippet: "Please review the deploy plan",
        payload: {
          headers: [
            { name: "Subject", value: "Deploy plan review" },
            { name: "From", value: "Alice <alice@example.com>" },
            { name: "Date", value: "Fri, 20 Jun 2026 09:00:00 +0000" },
          ],
        },
      },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "gmail-m1",
      source: "gmail",
      title: "Deploy plan review",
      author: "Alice <alice@example.com>",
      body: "Please review the deploy plan",
      url: "https://mail.google.com/mail/u/0/#inbox/m1",
    });
    expect(() => new Date(items[0].receivedAt).toISOString()).not.toThrow();
  });

  it("falls back to '(no subject)' and empty author safely", () => {
    const items = gmailItemsFromMessages([{ id: "m2", snippet: "", payload: { headers: [] } }]);
    expect(items[0].title).toBe("(no subject)");
    expect(items[0].author).toBe("");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- gmail`
Expected: FAIL — cannot find `./gmail`.

- [ ] **Step 3: Implement the Gmail source**

Create `src/lib/sources/gmail.ts`:
```ts
import { google } from "googleapis";
import type { FeedItem } from "../types";

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

export function gmailItemsFromMessages(messages: GmailMessageLike[]): FeedItem[] {
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

export async function fetchGmailFeed(accessToken: string | undefined): Promise<FeedItem[]> {
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- gmail`
Expected: PASS.

- [ ] **Step 5: Implement the OAuth start route**

Create `src/app/api/auth/google/route.ts`:
```ts
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
```

- [ ] **Step 6: Implement the OAuth callback route**

Create `src/app/api/auth/google/callback/route.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";
import { oauthClient } from "@/lib/sources/gmail";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/?gmail=error", req.url));

  const auth = oauthClient();
  const { tokens } = await auth.getToken(code);
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
```

- [ ] **Step 7: Merge Gmail into the feed (with mock fallback)**

Replace `src/app/api/feed/route.ts`:
```ts
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
```

- [ ] **Step 8: Run tests + build to verify green**

Run: `npm test && npm run build`
Expected: all tests PASS; build succeeds.

- [ ] **Step 9: Manually verify the OAuth flow**

With Google OAuth client configured and `.env` set, run `npm run dev`, open `http://localhost:3000/api/auth/google`, complete consent, then `curl -s --cookie "g_access=<token>" http://localhost:3000/api/feed`. Expected: feed includes `gmail-*` items. If OAuth is not set up, `GET /api/feed` still returns mock items (fallback verified).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(backend): Gmail read-only OAuth source + feed merge with fallback"
```

---

### Task 6: GitHub via remote MCP in the triage session (P1)

**Files:**
- Modify: `src/lib/agent/triage.ts`
- Test: `src/lib/agent/triage.test.ts` (extend)

**Interfaces:**
- Consumes: `GITHUB_MCP_TOKEN` env; the official GitHub remote MCP at `https://api.githubcopilot.com/mcp/`.
- Produces:
  - `githubMcpServers(): Record<string, unknown> | undefined` — returns the `mcpServers` config when a token is present, else `undefined`.
  - `runTriage` passes `mcpServers` to `createSession` and the prompt asks the agent to pull recent GitHub notifications/PRs as additional Task/Info items.

- [ ] **Step 1: Write the failing test for the MCP config builder**

Add to `src/lib/agent/triage.test.ts`:
```ts
import { githubMcpServers } from "./triage";

describe("githubMcpServers", () => {
  it("returns undefined without a token", () => {
    delete process.env.GITHUB_MCP_TOKEN;
    expect(githubMcpServers()).toBeUndefined();
  });
  it("builds an http MCP config with the bearer token", () => {
    process.env.GITHUB_MCP_TOKEN = "ghp_test";
    const cfg = githubMcpServers()!;
    expect(cfg.github).toMatchObject({
      type: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: { Authorization: "Bearer ghp_test" },
      tools: ["*"],
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- triage`
Expected: FAIL — `githubMcpServers` not exported.

- [ ] **Step 3: Implement the MCP config + wire into the session**

In `src/lib/agent/triage.ts`, add:
```ts
export function githubMcpServers() {
  const token = process.env.GITHUB_MCP_TOKEN;
  if (!token) return undefined;
  return {
    github: {
      type: "http" as const,
      url: "https://api.githubcopilot.com/mcp/",
      headers: { Authorization: `Bearer ${token}` },
      tools: ["*"],
    },
  };
}
```

Update the `createSession` call inside `runTriage` to include MCP when available:
```ts
    const mcpServers = githubMcpServers();
    const session = await client.createSession({
      model: azureModel(),
      streaming: true,
      provider: azureProvider(),
      tools: createTriageTools(collector),
      ...(mcpServers ? { mcpServers } : {}),
    });
```

And extend `buildTriagePrompt` with a GitHub instruction appended only when MCP is on. Add an optional flag:
```ts
export function buildTriagePrompt(items: FeedItem[], withGithub = false): string {
  // ...existing lines...
  const githubLine = withGithub
    ? [
        "",
        "Additionally, use the GitHub MCP tools to fetch the user's most recent " +
          "notifications or review requests. For each, summarize_item and tag_item " +
          "(use a synthetic id like 'github-<n>'), and create_todo if it needs action.",
      ]
    : [];
  return [/* ...existing... */ ...githubLine].join("\n");
}
```
Then in `runTriage` call `buildTriagePrompt(items, Boolean(mcpServers))`.

> Before relying on tool names, run `npm test` (the config test) — it asserts only our config shape, which does not require a live MCP. The live MCP path is validated by the smoke step.

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npm test -- triage`
Expected: PASS.

- [ ] **Step 5: Smoke test GitHub MCP (requires `GITHUB_MCP_TOKEN`)**

Run:
```bash
set -a && source .env && set +a && npx tsx scripts/smoke-triage.ts
```
Expected: the streamed reasoning mentions fetching GitHub notifications; results include `github-*` items in addition to the mock items. If the MCP server is unreachable, `runTriage` still returns the mock/Gmail results (no GitHub items).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(backend): GitHub remote MCP wired into triage session (P1)"
```

---

### Task 7: Azure deployment with azd (Container Apps)

**Files:**
- Create: `Dockerfile`
- Create: `azure.yaml`
- Create: `infra/main.bicep`, `infra/main.parameters.json`
- Modify: `next.config.ts` (enable standalone output)
- Modify: `README.md` (run/deploy one-liner)

**Interfaces:**
- Consumes: the built Next.js app; env vars `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`, `GOOGLE_*`, `GITHUB_MCP_TOKEN`.
- Produces: a public Azure Container Apps URL serving the app; `azd up` deploys it.

> **Risky action gate:** `azd up` provisions billable Azure resources and `azd down` deletes them. Get explicit human approval (voice confirmation) before running either.

- [ ] **Step 1: Enable standalone output**

Edit `next.config.ts`:
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone" };
export default nextConfig;
```

- [ ] **Step 2: Add a Dockerfile**

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 3: Add the azd project file**

Create `azure.yaml`:
```yaml
name: triage-feed
services:
  web:
    project: .
    language: ts
    host: containerapp
    docker:
      path: ./Dockerfile
```

- [ ] **Step 4: Generate infra and confirm it builds**

Run:
```bash
azd init --template minimal --no-prompt || true
```
If `infra/` is not generated, create `infra/main.bicep` for a Container Apps environment + a single container app exposing port 3000, with the env vars above wired from azd environment values (use `azd env set AZURE_OPENAI_ENDPOINT ...` etc.). Validate:
```bash
az bicep build --file infra/main.bicep
```
Expected: bicep compiles with no errors.

- [ ] **Step 5: Deploy (human-approved)**

After voice confirmation:
```bash
azd auth login
azd up
```
Expected: provisioning succeeds and azd prints the app URL.

- [ ] **Step 6: Smoke test the deployed app**

Run:
```bash
curl -s "$(azd env get-values | grep -i SERVICE_WEB_URI | cut -d= -f2 | tr -d '\"')/api/feed" | head -c 300
```
Expected: JSON feed from the live Azure URL.

- [ ] **Step 7: Record the URL and update README**

Put the deployed URL into `PRD.md` §5 "배포 URL" and add a one-line run/deploy section to `README.md`. Commit:
```bash
git add -A
git commit -m "feat(backend): azd deploy to Azure Container Apps + docs"
```

---

## Self-Review

**Spec coverage (PRD.md):**
- §3 vertical slice (subscribe → feed → summarize → tag → Task→Todo): Tasks 2, 4, 5.
- §4 Copilot SDK depth (agent loop + tool calls + streaming + MCP): Tasks 3, 4, 6.
- §5 Azure OpenAI via BYOK + `azd up` Container Apps: Tasks 4, 7.
- §6 features P0/P1: Tasks 2, 4, 5 (P0), 6 (P1), 7 (deploy).
- §8 responsible AI (read-only Gmail, propose-not-send Todos, secrets in env, risky-action gate): Tasks 1, 4, 5, 7.
- Frontend (left feed / right Todo UI): owned by Dev A — out of scope for this backend plan; the `GET /api/feed` and `POST /api/triage` contracts are the integration surface.

**Placeholder scan:** No TBD/TODO; every code step shows full code. The one conditional is the `defineTool` introspection note in Task 3 — handled with an explicit verification command and a fallback testing strategy.

**Type consistency:** `FeedItem`, `TagKind`, `TriageResult`, `Todo`, `FeedResponse`, `TriageResponse` are defined once in Task 1 and used unchanged in Tasks 2–7. Tool handler arg shapes match the `parameters` JSON schemas. `runTriage`/`buildTriagePrompt`/`githubMcpServers`/`azureProvider`/`azureModel` signatures are consistent across tasks.

**Risk note:** `defineTool` property introspection (Task 3 test) and the exact `mcpServers`/`createSession` option names are taken from the SDK docs; verify against the installed package version with the small `node -e` probe before asserting in tests. If the package differs, keep collector/config logic in pure exported functions and test those.
