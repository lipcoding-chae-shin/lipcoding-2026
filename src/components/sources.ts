import type { Source, Tag } from "@/lib/types";

export interface SourceMeta {
  label: string;
  color: string;
  mark: string;
  /** Label for the identifier field in the add-source modal. */
  idLabel: string;
  /** Placeholder hint for the identifier field. */
  idPlaceholder: string;
}

export const SOURCE_META: Record<Source, SourceMeta> = {
  gmail: {
    label: "Gmail",
    color: "#ea4335",
    mark: "M",
    idLabel: "메일 주소 또는 라벨",
    idPlaceholder: "you@gmail.com 또는 라벨명",
  },
  slack: {
    label: "Slack",
    color: "#4a154b",
    mark: "S",
    idLabel: "워크스페이스 / 채널",
    idPlaceholder: "#general",
  },
  navermail: {
    label: "네이버 메일",
    color: "#03c75a",
    mark: "N",
    idLabel: "메일 주소",
    idPlaceholder: "you@naver.com",
  },
  github: {
    label: "GitHub",
    color: "#24292f",
    mark: "G",
    idLabel: "레포 (owner/repo)",
    idPlaceholder: "octocat/hello-world",
  },
  notion: {
    label: "Notion",
    color: "#37352f",
    mark: "No",
    idLabel: "데이터베이스 / 페이지",
    idPlaceholder: "페이지 URL 또는 이름",
  },
  discord: {
    label: "Discord",
    color: "#5865f2",
    mark: "D",
    idLabel: "서버 / 채널",
    idPlaceholder: "#announcements",
  },
  news: {
    label: "사내 뉴스",
    color: "#0ea5e9",
    mark: "사",
    idLabel: "키워드 / 카테고리",
    idPlaceholder: "공지, 점검 등",
  },
};

/** Order shown in the add-source modal. */
export const SOURCE_CATALOG: Source[] = [
  "gmail",
  "slack",
  "navermail",
  "github",
  "notion",
  "discord",
];

export const TAG_META: Record<Tag, { label: string; cls: string }> = {
  Task: { label: "Task", cls: "bg-task-bg text-task" },
  Info: { label: "Info", cls: "bg-info-bg text-info" },
};

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.round(hr / 24)}일 전`;
}
