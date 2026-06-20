# 프론트엔드 통합 가이드 — 피드 스펙 변경 (Dev B → Dev A)

> 백엔드가 **인입 시점 요약(eager triage)** 방식으로 바뀌었습니다.
> 피드 아이템이 **이미 요약·태깅된 상태(`triaged: true`)** 로 내려옵니다.
> 더 이상 "AI 트리아지 실행" 버튼이 필요 없습니다.

## TL;DR (프론트에서 바꿀 것 2가지)

1. **`components/mock.ts` 제거 → `GET /api/feed` 로 교체.**
   응답은 이미 `summary` / `tag` / `triaged: true` 가 채워진 `FeedItem[]` 입니다.
2. **"AI 트리아지 실행" 버튼 + `StreamingTrace` 패널 제거.**
   요약은 백엔드가 끝내서 주므로 클라이언트 트리아지 루프(`runTriageStream`)는 불필요합니다.

`src/lib/types.ts`(공유 계약)는 **프론트 정의 그대로** 백엔드가 따라갑니다. 타입 변경 없음.

## API 계약

### `GET /api/feed`
이미 요약·태깅된 피드를 반환합니다.

```ts
// 응답 (src/lib/types.ts 의 FeedResponse)
{
  items: FeedItem[]   // 각 항목 summary 채워짐, tag = "Task" | "Info", triaged: true
}
```

```jsonc
// 예시 item
{
  "id": "gmail-mock-1",
  "source": "gmail",
  "title": "[청구] 6월 클라우드 사용료 결제 안내",
  "summary": "6월 클라우드 사용료 결제 기한이 6월 25일입니다. 기한 내 결제가 필요합니다.",
  "tag": "Task",
  "url": "https://mail.google.com/mail/u/0/#inbox/gmail-mock-1",
  "receivedAt": "2026-06-20T08:52:00.000Z",
  "triaged": true
}
```

- 정렬: 백엔드가 `receivedAt` 내림차순으로 정렬해 보냅니다.
- 소스: `gmail` / `github` / `news`. Gmail 은 OAuth 연결 시 실제 메일로, 미연결 시 mock 으로 채워집니다. (현재 github/news 는 mock)
- Azure OpenAI 키가 설정되면 요약은 **Copilot SDK 에이전트**가 생성합니다. 미설정이면 mock 캔드 요약으로 폴백 — 어느 쪽이든 응답 shape 은 동일합니다.

### 권장 프론트 흐름

```ts
// 페이지 로드(및 새로고침/주기적 폴링) 시
const res = await fetch("/api/feed");
const { items }: FeedResponse = await res.json();
setFeed(items);          // 바로 렌더 — 별도 트리아지 호출 불필요
```

- `visibleFeed` 의 소스 필터(구독 토글)는 그대로 유지하면 됩니다.
- Task 항목을 사용자가 승인해 **Todo 로 만드는 흐름은 클라이언트 그대로 유지**하세요
  (책임 있는 AI: 사람이 승인). 백엔드는 Todo 를 강제로 만들지 않습니다.

## 제거 대상 정리

| 파일 | 조치 |
|---|---|
| `components/mock.ts` | 삭제 → `fetch('/api/feed')` 로 대체 |
| `runTriageStream`, `TRIAGE_RESULT`, `getRawFeed` | 제거 |
| `StreamingTrace` 컴포넌트 + `trace` state | 제거 |
| "AI 트리아지 실행" / "중지" 버튼 + `runTriage`/`stopTriage` | 제거 |
| `SubscribeBar`, `FeedList`, `TodoPanel`, `FeedItemCard`, `TodoItem` | 유지 |

## 참고 — `POST /api/triage` 는?

배치 SSE 트리아지 엔드포인트(`POST /api/triage`)는 남겨두었지만, eager triage 전환으로
**프론트에서 직접 호출할 필요는 없습니다.** 디버그/수동 재트리아지 용도로만 보세요.
