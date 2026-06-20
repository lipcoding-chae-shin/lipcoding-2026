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
