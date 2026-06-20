/**
 * SNS 인사이트 피드 (오른쪽 패널 하단).
 * 현재는 UI 형태만 — 목 데이터. 추후 연동 소스의 실제 피드로 교체.
 */

export type InsightPlatform =
  | "tickettaco"
  | "geeknews"
  | "linkedin"
  | "instagram"
  | "facebook";

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
  /** 최상단 고정 홍보물 여부 (강조 스타일 + 배지) */
  pinned?: boolean;
  /** 고정/이벤트 카드에 표시할 짧은 배지 라벨 (선택) */
  badge?: string;
}

export const PLATFORM_META: Record<
  InsightPlatform,
  { label: string; color: string; mark: string }
> = {
  tickettaco: { label: "티켓타코", color: "#e69500", mark: "TT" },
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
      id: "promo-lipcoding-2026",
      platform: "tickettaco",
      author: "천하제일 입코딩 대회",
      handle: "ticketa.co",
      text: "🎤 Voice Coding Hackathon with GitHub Copilot — 보이스 코딩으로 앱을 만들어 봅시다. 📅 2026.06.20(토) 🕐 09:00–18:00 📍 서울 광화문",
      hasMedia: true,
      url: "https://ticketa.co/event/z49uyhx8",
      postedAt: iso(2),
      likes: 2026,
      comments: 128,
      pinned: true,
      badge: "📣 진행 중",
    },
    {
      id: "tt-copilot-devdays",
      platform: "tickettaco",
      author: "GitHub Copilot Dev Days by .NET Dev",
      handle: "티켓타코 · 이벤트",
      text: "GitHub Copilot으로 더 빠르게 개발하는 실전 노하우. .NET 개발자 커뮤니티가 준비한 핸즈온 데이.",
      url: "https://ticketa.co/event/lx8g330a",
      postedAt: iso(40),
      likes: 412,
      comments: 33,
      badge: "이벤트",
    },
    {
      id: "tt-devfest-ai",
      platform: "tickettaco",
      author: "AI × Reality — Google DevFest 2025 in Daejeon",
      handle: "티켓타코 · 이벤트",
      text: "만들고, 기여하고, 활용하다. AI를 현실에 연결하는 개발자 컨퍼런스 — 티켓 예매 오픈.",
      hasMedia: true,
      url: "https://ticketa.co/event/fj2sm9xc",
      postedAt: iso(150),
      likes: 286,
      comments: 19,
      badge: "이벤트",
    },
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
