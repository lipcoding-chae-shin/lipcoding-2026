"use client";

import type { SubscribedSource } from "@/lib/types";
import { SOURCE_META } from "./sources";

interface Props {
  sources: SubscribedSource[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function SubscribeBar({
  sources,
  onToggle,
  onDelete,
  onAdd,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-faint">
        구독
      </span>

      {sources.map((s) => {
        const meta = SOURCE_META[s.source];
        return (
          <span
            key={s.id}
            className={`group inline-flex items-center rounded-full border text-sm transition ${
              s.connected
                ? "border-line bg-surface-2 text-ink"
                : "border-line bg-transparent text-faint"
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(s.id)}
              aria-pressed={s.connected}
              className="press focusable inline-flex items-center gap-1.5 rounded-full py-1 pl-3.5 pr-2 hover:text-ink"
            >
              <span
                className="grid size-4 place-items-center rounded-full text-[9px] font-bold leading-none text-white"
                style={{ backgroundColor: s.connected ? meta.color : "#62666d" }}
              >
                {meta.mark}
              </span>
              <span className="max-w-[12rem] truncate">{s.label}</span>
              <span
                className={`ml-0.5 text-[11px] ${
                  s.connected ? "text-ok" : "text-faint"
                }`}
              >
                {s.connected ? "연결됨" : "연결"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              aria-label={`${s.label} 구독 삭제`}
              title="구독 삭제"
              className="focusable mr-1 grid size-5 place-items-center rounded-full text-faint opacity-60 transition hover:bg-danger/15 hover:text-danger hover:opacity-100 group-hover:opacity-100"
            >
              <svg
                viewBox="0 0 14 14"
                className="size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
              </svg>
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="press focusable inline-flex items-center gap-1 rounded-full border border-dashed border-line-strong px-3 py-1 text-sm text-muted transition hover:border-accent hover:text-ink"
      >
        <span className="text-base leading-none">+</span>
        추가
      </button>
    </div>
  );
}
