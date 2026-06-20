import type { RawItem } from "./raw";

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
      receivedAt: "2026-06-20T08:52:00.000Z",
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
      receivedAt: "2026-06-20T07:40:00.000Z",
      summary: "디자인 시안 v3 최종 확인 회신이 오늘 중으로 필요합니다.",
      tag: "Task",
    },
    {
      id: "github-mock-1",
      source: "github",
      title: "PR #142 — feed route returns 500 on empty source",
      body: "빈 소스로 /api/feed를 호출하면 500이 발생합니다. 가드 처리가 필요하며 리뷰를 요청합니다.",
      author: "teammate-a",
      url: "https://github.com/example/repo/pull/142",
      receivedAt: "2026-06-20T07:10:00.000Z",
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
      receivedAt: "2026-06-20T06:30:00.000Z",
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
      receivedAt: "2026-06-20T05:10:00.000Z",
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
      receivedAt: "2026-06-20T03:30:00.000Z",
      summary: "이번 주 점심 메뉴 투표 결과가 게시판에 공유되었습니다. 참고만 하세요.",
      tag: "Info",
    },
  ];
}
