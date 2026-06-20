import type { Source, Tag } from "@/lib/types";

export const SOURCE_META: Record<
  Source,
  { label: string; color: string; mark: string }
> = {
  gmail: { label: "Gmail", color: "#ea4335", mark: "M" },
  github: { label: "GitHub", color: "#24292f", mark: "G" },
  news: { label: "사내 뉴스", color: "#0ea5e9", mark: "N" },
};

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
