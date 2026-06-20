# 입코딩 2026 — 음성 코딩 준비 키트

대회 당일(음성 코딩 12:30–16:30) **Copilot 에 미리 로드해 두는 컨텍스트**.
규칙 출처: [lipcoding-kr/lipcoding-competition-2026](https://github.com/lipcoding-kr/lipcoding-competition-2026).

## 파일

| 파일 | 용도 | 누가 읽나 |
|---|---|---|
| `.github/copilot-instructions.md` | **HARD RULES**(협상 불가) + 채점 우선순위 | VS Code Copilot 자동 |
| `AGENTS.md` | 에이전트 작업 루프 · 타임박스 · **T-60 준비 체크리스트** | Copilot CLI |
| `docs/voice-glossary.md` | 받아쓰기 **오인식 → 표준 용어/명령** 매핑 (애저→`az`/`azd` 등) | 에이전트 참조 |
| `PRD.md` | 당일 빈칸만 채우는 PRD(채점 항목 정렬) | 사람 + 에이전트 |

## 절대 규칙 5줄 요약

1. **웹 앱**으로만.
2. **Copilot SDK 깊게**(채점 25%, 깊이>개수).
3. **Azure 배포**(`azd up`) + 모델은 **Azure OpenAI/Foundry** 경유.
4. **Copilot 외 AI 도구 금지** · 외부 모델 직접 호출 금지(=실격/감점).
5. **16:30 전 제출**(미제출=자동 탈락).

## 쓰는 법

1. T-60(10:30–11:30) 키보드 허용 구간에 `AGENTS.md` 의 준비 체크리스트대로 설치·로그인.
2. 이 폴더를 작업 리포로 쓰거나, 네 대회 리포에 `.github/copilot-instructions.md` + `AGENTS.md` + `docs/` 를 복사.
3. 주제 공개 → `PRD.md` 채움 → 코딩 시작.

## 폴더 구조 (Next.js App Router · 프론트+백엔드 단일 앱)

> 분업안: `docs/division-of-labor.md` 참고. **Dev A=프론트**(`app/page.tsx`+`components/`), **Dev B=백엔드/AI/배포**(`app/api/`+`lib/`).
> 프론트는 `app/api`를 직접 import 하지 않고 **`fetch('/api/...')`로만** 호출 → 경계는 `src/lib/types.ts`(공유 계약).

```
lipcoding-2026/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx            # [공통] 루트 레이아웃
│  │  ├─ page.tsx              # [Dev A] 좌 피드 / 우 Todo 화면
│  │  ├─ globals.css           # [공통] Tailwind 전역
│  │  └─ api/                  # [Dev B] 서버 라우트 (예정)
│  │     ├─ feed/route.ts      #   GET  /api/feed
│  │     └─ triage/route.ts    #   POST /api/triage
│  ├─ components/              # [Dev A] UI 컴포넌트 (예정)
│  │  ├─ SubscribeBar.tsx
│  │  ├─ FeedList.tsx · FeedItemCard.tsx
│  │  ├─ TodoPanel.tsx · TodoItem.tsx
│  │  └─ StreamingTrace.tsx
│  └─ lib/                     # [Dev B + 공유] (예정)
│     ├─ types.ts              #   ★ 공유 계약: Source/FeedItem/Tag/Todo + API shape
│     ├─ sources/              #   gmail.ts · github-mcp.ts · mock.ts
│     └─ agent/                #   Copilot SDK 에이전트 + Azure OpenAI
├─ public/                     # 정적 자산
├─ docs/
│  ├─ division-of-labor.md     # 분업안
│  └─ voice-glossary.md        # 받아쓰기 오인식 매핑
├─ .github/copilot-instructions.md
├─ AGENTS.md · PRD.md · info.md · judge.md
├─ next.config.ts · tsconfig.json · eslint.config.mjs · postcss.config.mjs
└─ package.json
```

> `(예정)` = 아직 생성 전. 현재는 스캐폴드 기본(`app/layout.tsx`, `app/page.tsx`, `app/globals.css`)만 존재.

### 충돌 방지 규칙
- Dev A 는 `app/page.tsx` + `components/` 만, Dev B 는 `app/api/` + `lib/`(types 제외) 만 수정.
- `src/lib/types.ts` 는 **한 번 동결** — 변경 필요 시 한 줄 합의 후.
- 커밋은 작게 자주. push 전 `npm run build` 가 깨지지 않게.

### 실행
```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 프로덕션 빌드 검증
```
