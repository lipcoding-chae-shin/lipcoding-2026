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
