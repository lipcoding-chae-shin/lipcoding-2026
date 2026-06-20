/**
 * SNS 인사이트 피드 (오른쪽 패널 하단).
 * 현재는 UI 형태만 — 목 데이터. 추후 연동 소스의 실제 피드로 교체.
 */

export type InsightPlatform = "geeknews" | "linkedin" | "instagram" | "facebook";

export interface InsightItem {
  id: string;
  platform: InsightPlatform;
  /** 작성자/채널 이름 */
  author: string;
  /** @handle 또는 부가 라벨 (선택) */
  handle?: string;
  /** 카드 본문 (한두 줄 요약) */
  text: string;
  /** 썸네일/미디어가 있는 게시물인지 (플레이스홀더 표시용) */
  hasMedia?: boolean;
  url: string;
  postedAt: string; // ISO
  /** 가벼운 인게이지먼트 지표 (선택) */
  likes?: number;
  comments?: number;
}

export const PLATFORM_META: Record<
  InsightPlatform,
  { label: string; color: string; mark: string }
> = {
  geeknews: { label: "GeekNews", color: "#16a34a", mark: "GN" },
  linkedin: { label: "LinkedIn", color: "#0a66c2", mark: "in" },
  instagram: { label: "Instagram", color: "#e1306c", mark: "IG" },
  facebook: { label: "Facebook", color: "#1877f2", mark: "f" },
};

const iso = (minsAgo: number) =>
  new Date(Date.now() - minsAgo * 60_000).toISOString();

/** 형태 확인용 목 인사이트 피드. */
export function getInsightFeed(): InsightItem[] {
  return [
    {
      id: "i1",
      platform: "geeknews",
      author: "GeekNews",
      handle: "news.hada.io",
      text: "AI 코딩 에이전트가 바꾸는 개발 워크플로우 — 음성 기반 페어 프로그래밍 사례 모음",
      url: "https://news.hada.io/",
      postedAt: iso(12),
      likes: 84,
      comments: 19,
    },
    {
      id: "i2",
      platform: "linkedin",
      author: "Soyeon Kim",
      handle: "Product Designer @ Toss",
      text: "좋은 온보딩은 '기능 소개'가 아니라 '첫 성공 경험'을 설계하는 일이라는 걸 다시 느낀 한 주.",
      hasMedia: true,
      url: "https://www.linkedin.com/",
      postedAt: iso(48),
      likes: 312,
      comments: 27,
    },
    {
      id: "i3",
      platform: "instagram",
      author: "design.daily",
      handle: "@design.daily",
      text: "오늘의 UI 인스피레이션 — 미니멀 대시보드 카드 레이아웃 10선",
      hasMedia: true,
      url: "https://www.instagram.com/",
      postedAt: iso(95),
      likes: 1280,
      comments: 64,
    },
    {
      id: "i4",
      platform: "facebook",
      author: "Frontend Developers Korea",
      handle: "그룹",
      text: "React 19 마이그레이션 후기 공유합니다. Server Components 도입하면서 겪은 시행착오 정리.",
      url: "https://www.facebook.com/",
      postedAt: iso(180),
      likes: 156,
      comments: 41,
    },
  ];
}

export function compactCount(n?: number): string {
  if (n == null) return "0";
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
}
