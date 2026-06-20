# 분업안 — Subscribe & Triage Feed (입코딩 2026)

> 2인 음성 코딩. Next.js 단일 앱을 **레이어로 분리**하고 **공유 계약(타입/API)을 먼저 동결**해 충돌 없이 병렬 작업.
> 핵심 원칙: 각자 자기 Copilot 으로 **자기 폴더만** 건드린다.

---

## 0. 같이 (12:30–13:00, ~20분) — 합의 후 분리

- Next.js(App Router) 앱 스캐폴드 + `azd` 템플릿 + `.env.example`
- **공유 계약 동결**: `src/lib/types.ts`
  - `Source` (gmail | github | news), `FeedItem`, `Tag('Task' | 'Info')`, `Todo`
  - API 응답 shape: `/api/feed`, `/api/triage`
- 이 파일이 두 사람 사이의 **인터페이스**. 동결 후엔 서로 내부 구현만 수정.

## Dev A — 프론트엔드 / UX (좌 피드 · 우 Todo)

**소유 경로**: `src/app/page.tsx`, `src/components/`

- `page.tsx`: 좌 피드 / 우 Todo 2단 레이아웃
- `components/`
  - `SubscribeBar` — 소스 구독 등록
  - `FeedList` / `FeedItemCard` — 요약 + 태그 배지 + 출처 링크
  - `TodoPanel` / `TodoItem` — 편집·완료·삭제
  - `StreamingTrace` — 요약·태깅 reasoning 스트리밍 표시
- 승인·편집 UX(책임 있는 AI 게이트), 취소/되돌리기
- **mock API**로 독립 개발 → B 완성 후 실 API 연결

## Dev B — 백엔드 / AI / 배포

**소유 경로**: `src/app/api/`, `src/lib/`(types.ts 제외)

- `src/lib/sources/`
  - `gmail.ts` — 읽기전용 OAuth(`gmail.readonly`)
  - `github-mcp.ts` — GitHub MCP/도구
  - `mock.ts` — 사내뉴스 시드
- `src/lib/agent/`
  - Copilot SDK 에이전트 + 도구(`summarize_item`, `tag_item`, `create_todo`)
  - Azure OpenAI 클라이언트 + 스트리밍
- `src/app/api/feed/route.ts`, `src/app/api/triage/route.ts`
- `azd up` 1차 배포, env/Key Vault, 폴백 토글

## 타임박스

| 시간 | Dev A | Dev B |
|---|---|---|
| 13:00–14:30 | 피드 + Todo UI (mock 기반) | 요약·태깅 파이프라인 1개 끝까지 + 1차 `azd up` |
| 14:30–16:00 | 통합(실 API 연결), 스트리밍 UX, 승인 게이트 | Gmail 실연동 · GitHub MCP 깊이 · 스트리밍 |
| 16:00–16:30 | 동결 · 스모크 테스트 · README | 재배포 · 제출 |

## 충돌 방지 규칙

- Dev A 는 `app/page.tsx` + `components/` 만, Dev B 는 `app/api/` + `lib/` 만.
- `src/lib/types.ts` 는 한 번 동결. 변경 필요 시 **한 줄 합의 후** 수정.
- 커밋은 작게 자주. push 전 `npm run build` 가 깨지지 않게.
