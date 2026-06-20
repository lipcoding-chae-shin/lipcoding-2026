/**
 * Frontend-only mock fixture (Dev A).
 * TEMPORARY — replace these calls with `fetch('/api/feed')` and
 * `fetch('/api/triage')` once Dev B's routes land. Kept inside
 * components/ to respect the lib/ ownership boundary.
 */
import type { FeedItem, SubscribedSource, TraceEvent } from "@/lib/types";

export const SOURCES: SubscribedSource[] = [
  { id: "seed-gmail", source: "gmail", label: "Gmail", connected: true },
  { id: "seed-github", source: "github", label: "GitHub", connected: true },
];

const iso = (minsAgo: number) => new Date(Date.now() - minsAgo * 60_000).toISOString();

/**
 * Raw, un-triaged feed (summary/tag filled in by the "agent").
 * Built lazily on the client so timestamps don't differ between the
 * server render and hydration.
 */
export function getRawFeed(): FeedItem[] {
  return [
    {
    id: "f1",
    source: "gmail",
    title: "[청구] 6월 클라우드 사용료 결제 안내",
    summary: "",
    tag: null,
    url: "https://mail.example.com/f1",
    receivedAt: iso(8),
    triaged: false,
  },
  {
    id: "f2",
    source: "github",
    title: "PR #142 — feed route returns 500 on empty source",
    summary: "",
    tag: null,
    url: "https://github.com/example/repo/pull/142",
    receivedAt: iso(21),
    triaged: false,
  },
  {
    id: "f3",
    source: "github",
    title: "Discussion #57 — 다음 스프린트 범위 합의 필요",
    summary: "",
    tag: null,
    url: "https://github.com/example/repo/discussions/57",
    receivedAt: iso(46),
    triaged: false,
  },
  {
    id: "f4",
    source: "gmail",
    title: "회신 요망: 디자인 시안 최종 확인 부탁드립니다",
    summary: "",
    tag: null,
    url: "https://mail.example.com/f4",
    receivedAt: iso(73),
    triaged: false,
  },
  {
    id: "f5",
    source: "github",
    title: "Issue #88 closed — auth token refresh fixed",
    summary: "",
    tag: null,
    url: "https://github.com/example/repo/issues/88",
    receivedAt: iso(120),
    triaged: false,
  },
  ];
}

/** What the "agent" produces per item (mirrors a real triage result). */
const TRIAGE_RESULT: Record<string, { summary: string; tag: FeedItem["tag"] }> = {
  f1: { summary: "6월 클라우드 사용료 결제 마감 안내. 기한 내 확인 필요.", tag: "Task" },
  f2: { summary: "빈 소스에서 피드 라우트가 500을 반환하는 버그 리뷰 요청.", tag: "Task" },
  f3: { summary: "다음 스프린트 범위 합의가 필요한 논의. 의견 작성 필요.", tag: "Task" },
  f4: { summary: "디자인 시안 최종 확인 회신 요청. 답장 필요.", tag: "Task" },
  f5: { summary: "토큰 갱신 이슈가 해결되어 종료됨. 참고만.", tag: "Info" },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let traceSeq = 0;
const nextId = () => `t${++traceSeq}`;

/**
 * Simulates the agent streaming its reasoning while triaging the feed.
 * Calls `onTrace` for each reasoning step and `onItem` when an item is
 * summarized + tagged. Mirrors a server-sent stream from /api/triage.
 */
export async function runTriageStream(
  items: FeedItem[],
  onTrace: (e: TraceEvent) => void,
  onItem: (item: FeedItem) => void,
  signal?: { cancelled: boolean },
): Promise<void> {
  const pending = items.filter((i) => !i.triaged);
  onTrace({
    id: nextId(),
    kind: "read",
    text: `받은 신호 ${pending.length}건을 읽는 중…`,
    at: new Date().toISOString(),
  });
  await sleep(450);

  for (const item of pending) {
    if (signal?.cancelled) return;
    const result = TRIAGE_RESULT[item.id] ?? { summary: "요약 없음", tag: "Info" as const };

    onTrace({
      id: nextId(),
      itemId: item.id,
      kind: "summarize",
      text: `「${item.title.slice(0, 28)}…」 요약 생성`,
      at: new Date().toISOString(),
    });
    await sleep(520);
    if (signal?.cancelled) return;

    onTrace({
      id: nextId(),
      itemId: item.id,
      kind: "tag",
      text: `분류 → ${result.tag}`,
      at: new Date().toISOString(),
    });
    onItem({ ...item, summary: result.summary, tag: result.tag, triaged: true });
    await sleep(340);
  }

  if (signal?.cancelled) return;
  onTrace({
    id: nextId(),
    kind: "done",
    text: "트리아지 완료. 검토 후 승인하세요.",
    at: new Date().toISOString(),
  });
}
