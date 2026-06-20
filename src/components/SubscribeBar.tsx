"use client";

import type { SubscribedSource } from "@/lib/types";
import { SOURCE_META } from "./sources";

interface Props {
  sources: SubscribedSource[];
  onToggle: (source: SubscribedSource["source"]) => void;
}

export default function SubscribeBar({ sources, onToggle }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-faint">
        구독
      </span>
      {sources.map((s) => {
        const meta = SOURCE_META[s.source];
        return (
          <button
            key={s.source}
            type="button"
            onClick={() => onToggle(s.source)}
            aria-pressed={s.connected}
            className={`press group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm transition ${
              s.connected
                ? "border border-line bg-surface-2 text-ink"
                : "border border-line bg-transparent text-faint hover:text-muted"
            }`}
          >
            <span
              className="grid size-4 place-items-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: s.connected ? meta.color : "#c2c8d0" }}
            >
              {meta.mark}
            </span>
            {meta.label}
            <span
              className={`ml-0.5 text-[11px] ${
                s.connected ? "text-ok" : "text-faint"
              }`}
            >
              {s.connected ? "연결됨" : "연결"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
