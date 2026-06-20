"use client";

import type { InsightItem } from "./insights";
import { PLATFORM_META, compactCount } from "./insights";
import { relativeTime } from "./sources";

interface Props {
  item: InsightItem;
}

export default function InsightCard({ item }: Props) {
  const meta = PLATFORM_META[item.platform];

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="surface press focusable block rounded-xl p-3 transition hover:bg-surface-2"
    >
      <header className="flex items-center gap-2">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.mark}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-semibold text-ink">
            {item.author}
          </p>
          {item.handle && (
            <p className="truncate text-[11px] text-faint">{item.handle}</p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
        >
          {meta.label}
        </span>
      </header>

      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">
        {item.text}
      </p>

      {item.hasMedia && (
        <div
          className="mt-2 grid h-20 place-items-center rounded-lg border border-line bg-surface-2 text-[11px] text-faint"
          aria-hidden
        >
          미디어 미리보기
        </div>
      )}

      <footer className="mt-2.5 flex items-center gap-3 text-[11px] text-faint">
        <span>♥ {compactCount(item.likes)}</span>
        <span>💬 {compactCount(item.comments)}</span>
        <time
          dateTime={item.postedAt}
          suppressHydrationWarning
          className="ml-auto"
        >
          {relativeTime(item.postedAt)}
        </time>
      </footer>
    </a>
  );
}
