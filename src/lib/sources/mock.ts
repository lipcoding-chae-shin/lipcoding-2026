import type { RawItem } from "./raw";

/** ISO timestamp `days`+`hours` before now — spreads mock items across dates. */
function ago(days: number, hours = 0): string {
  return new Date(Date.now() - (days * 24 + hours) * 3_600_000).toISOString();
}

/**
 * Offline demo fixture. Spans all three sources (gmail/github/news) so the
 * feed looks full without any real connector or API key. Each item carries a
 * canned `summary`/`tag` used when Azure OpenAI is not configured; when it is,
 * the triage agent overrides them at ingestion.
 */
export function mockRawFeed(): RawItem[] {
  return [
    {
      id: "gmail-mock-1",
      source: "gmail",
      title: "[청구] 6월 클라우드 사용료 결제 안내",
      body: "6월 클라우드 사용료 청구서가 발행되었습니다. 결제 기한은 6월 25일이며, 기한 내 미결제 시 서비스가 중단될 수 있습니다.",
      author: "billing@cloud.example.com",
      url: "https://mail.google.com/mail/u/0/#inbox/gmail-mock-1",
      receivedAt: ago(0, 3),
      summary: "6월 클라우드 사용료 결제 기한이 6월 25일입니다. 기한 내 결제가 필요합니다.",
      tag: "Task",
    },
    {
      id: "gmail-mock-2",
      source: "gmail",
      title: "회신 요망: 디자인 시안 최종 확인 부탁드립니다",
      body: "첨부한 디자인 시안 v3에 대한 최종 확인을 오늘 중으로 회신 부탁드립니다. 확정되면 바로 개발에 전달하겠습니다.",
      author: "design-lead@example.com",
      url: "https://mail.google.com/mail/u/0/#inbox/gmail-mock-2",
      receivedAt: ago(1, 2),
      summary: "디자인 시안 v3 최종 확인 회신이 오늘 중으로 필요합니다.",
      tag: "Task",
    },
    {
      id: "gmail-mock-3",
      source: "gmail",
      title: "[천하제일 입코딩 대회 2026] 참가 안내 및 필수 준수사항",
      body: "안녕하세요, 천하제일 입코딩 대회 2026 운영팀입니다. 음성 코딩 본선은 12:30~16:30, 총 4시간 진행됩니다. 결과물은 반드시 브라우저에서 동작하는 웹 앱이어야 하며, GitHub Copilot SDK를 깊게 활용해야 합니다. 허용 도구는 VS Code + GitHub Copilot + Copilot CLI뿐이며, 그 외 AI 에이전트 사용 시 즉시 실격 처리됩니다.",
      author: "no-reply@lipcoding.kr",
      url: "https://mail.google.com/mail/u/0/#inbox/gmail-mock-3",
      receivedAt: ago(2, 5),
      summary: "입코딩 대회 본선은 4시간 음성 코딩이며, Copilot SDK 기반 웹 앱이 필수입니다. 허용 도구 외 AI 사용 시 실격됩니다.",
      tag: "Task",
    },
    {
      id: "gmail-mock-4",
      source: "gmail",
      title: "[중요] 제출 마감 16:30 — Azure 배포 및 제출 링크 안내",
      body: "제출은 16:30 마감이며, 미제출 시 자동 탈락입니다. 16:00을 기능 동결 시점으로 권장드립니다. 결과물은 Azure 클라우드(azd up 권장)에 배포되어 공개 URL로 접근 가능해야 하며, 모델 호출은 Azure OpenAI 또는 Microsoft Foundry를 경유해야 합니다. 제출은 lipcoding.kr/submissions 에서 진행해 주세요.",
      author: "submissions@lipcoding.kr",
      url: "https://mail.google.com/mail/u/0/#inbox/gmail-mock-4",
      receivedAt: ago(4, 1),
      summary: "16:30 제출 마감(미제출 시 자동 탈락). Azure 배포 + Azure OpenAI/Foundry 경유가 필요하며 lipcoding.kr/submissions로 제출합니다.",
      tag: "Task",
    },
    {
      id: "gmail-mock-5",
      source: "gmail",
      title: "대회 전 준비 체크리스트: 마이크·CLI·계정 로그인 점검",
      body: "본선 전 준비 사항을 안내드립니다. 노이즈캔슬 헤드셋과 음성 입력(F5/Win+H)을 점검하고, GitHub CLI·Azure CLI·Azure Developer CLI를 설치한 뒤 az login / azd auth login / gh auth login을 미리 완료해 주세요. 개인 GitHub 계정으로 체크인하고 Azure 구독이 활성 상태인지 확인 바랍니다.",
      author: "ops@lipcoding.kr",
      url: "https://mail.google.com/mail/u/0/#inbox/gmail-mock-5",
      receivedAt: ago(6, 4),
      summary: "본선 전 마이크·음성입력 점검, gh/az/azd 설치 및 로그인, 개인 GitHub 계정·Azure 구독 활성화를 미리 준비하세요.",
      tag: "Info",
    },
    {
      id: "github-mock-1",
      source: "github",
      title: "PR #142 — feed route returns 500 on empty source",
      body: "빈 소스로 /api/feed를 호출하면 500이 발생합니다. 가드 처리가 필요하며 리뷰를 요청합니다.",
      author: "teammate-a",
      url: "https://github.com/example/repo/pull/142",
      receivedAt: ago(1, 6),
      summary: "빈 소스에서 /api/feed가 500을 반환하는 PR #142 리뷰 요청입니다.",
      tag: "Task",
    },
    {
      id: "github-mock-2",
      source: "github",
      title: "Issue #88 closed — auth token refresh fixed",
      body: "인증 토큰 갱신 버그가 수정되어 이슈 #88이 종료되었습니다. 별도 조치는 필요 없습니다.",
      author: "bot",
      url: "https://github.com/example/repo/issues/88",
      receivedAt: ago(3, 8),
      summary: "인증 토큰 갱신 버그가 해결되어 이슈 #88이 종료되었습니다. 참고만 하세요.",
      tag: "Info",
    },
    {
      id: "news-1",
      source: "news",
      title: "보안 패치 배포: 오늘 18시 서버 재시작 예정",
      body: "인프라팀이 18:00에 보안 패치를 배포합니다. 배포 전 본인 서비스 헬스체크를 확인해 주세요.",
      author: "infra-team",
      url: "https://intra.example.com/news/1",
      receivedAt: ago(8, 2),
      summary: "오늘 18시 보안 패치 배포 전 본인 서비스 헬스체크 확인이 필요합니다.",
      tag: "Task",
    },
    {
      id: "news-2",
      source: "news",
      title: "사내 점심 메뉴 투표 결과 공지",
      body: "이번 주 점심 메뉴 투표 결과가 게시판에 공유되었습니다. 참고만 하세요.",
      author: "office",
      url: "https://intra.example.com/news/2",
      receivedAt: ago(11, 5),
      summary: "이번 주 점심 메뉴 투표 결과가 게시판에 공유되었습니다. 참고만 하세요.",
      tag: "Info",
    },
  ];
}
