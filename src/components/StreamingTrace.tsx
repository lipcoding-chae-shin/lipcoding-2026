"use client";

import { useEffect, useRef } from "react";
import type { TraceEvent } from "@/lib/types";

interface Props {
  events: TraceEvent[];
  running: boolean;
}

const KIND_MARK: Record<TraceEvent["kind"], string> = {
  read: "›",
  summarize: "✎",
  tag: "#",
  todo: "+",
  done: "✓",
};

const KIND_COLOR: Record<TraceEvent["kind"], string> = {
  read: "text-faint",
  summarize: "text-accent",
  tag: "text-task",
  todo: "text-ok",
  done: "text-ok",
};

export default function StreamingTrace({ events, running }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-[#0e1116] shadow-sm">
      <header className="flex items-center gap-2 border-b border-white/5 px-3.5 py-2">
        <span
          className={`size-2 rounded-full ${
            running ? "live-dot bg-emerald-400" : "bg-white/25"
          }`}
        />
        <span className="font-mono text-xs font-medium text-white/80">
          agent · triage trace
        </span>
        <span className="ml-auto font-mono text-[11px] text-white/35">
          {running ? "streaming…" : "idle"}
        </span>
      </header>

      <div className="scroll-thin max-h-44 overflow-y-auto px-3.5 py-2.5">
        {events.length === 0 ? (
          <p className="font-mono text-xs text-white/30">
            트리아지를 실행하면 추론 과정이 여기에 표시됩니다.
          </p>
        ) : (
          <ul className="space-y-1">
            {events.map((e) => (
              <li
                key={e.id}
                className="trace-line flex gap-2 font-mono text-xs leading-relaxed"
              >
                <span className={`shrink-0 ${KIND_COLOR[e.kind]}`}>
                  {KIND_MARK[e.kind]}
                </span>
                <span className="text-white/75">{e.text}</span>
              </li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>
    </section>
  );
}
