"use client";

import { useState } from "react";
import type { FeedItem } from "@/lib/types";
import { SOURCE_META, TAG_META, relativeTime } from "./sources";

interface Props {
  item: FeedItem;
  /** Called after the user reviews & approves a todo draft. */
  onCreateTodo: (item: FeedItem, text: string) => void;
}

export default function FeedItemCard({ item, onCreateTodo }: Props) {
  const meta = SOURCE_META[item.source];
  const [draft, setDraft] = useState<string | null>(null);

  const openApproval = () =>
    setDraft(item.summary ? item.summary.replace(/\s*참고만\.?$/, "") : item.title);

  const approve = () => {
    const text = (draft ?? "").trim();
    if (text) onCreateTodo(item, text);
    setDraft(null);
  };

  return (
    <article
      className="rounded-xl border border-line bg-surface p-3.5 shadow-sm transition hover:shadow"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      <header className="flex items-center gap-2 text-xs text-faint">
        <span
          className="grid size-4 place-items-center rounded-full text-[9px] font-bold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.mark}
        </span>
        <span className="text-muted">{meta.label}</span>
        <span aria-hidden>·</span>
        <time dateTime={item.receivedAt} suppressHydrationWarning>
          {relativeTime(item.receivedAt)}
        </time>
        <div className="ml-auto">
          {item.tag ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_META[item.tag].cls}`}
            >
              {TAG_META[item.tag].label}
            </span>
          ) : (
            <span className="rounded-full bg-info-bg px-2 py-0.5 text-[11px] font-medium text-faint">
              분류 대기
            </span>
          )}
        </div>
      </header>

      <h3 className="mt-2 text-[15px] font-semibold leading-snug text-ink">
        {item.title}
      </h3>

      {item.triaged ? (
        <p className="mt-1 text-sm leading-relaxed text-muted">{item.summary}</p>
      ) : (
        <div className="mt-2 space-y-1.5" aria-hidden>
          <div className="h-2.5 w-11/12 rounded bg-line/70" />
          <div className="h-2.5 w-2/3 rounded bg-line/70" />
        </div>
      )}

      <footer className="mt-3 flex items-center gap-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-accent hover:underline"
        >
          원본 열기 ↗
        </a>
        {item.tag === "Task" && draft === null && (
          <button
            type="button"
            onClick={openApproval}
            className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink transition hover:opacity-90"
          >
            Todo로 추가
          </button>
        )}
      </footer>

      {draft !== null && (
        <div className="mt-3 rounded-lg border border-accent-weak bg-accent-weak/60 p-2.5">
          <label className="text-[11px] font-medium uppercase tracking-wide text-accent">
            검토 후 승인 — 할 일 문구를 수정할 수 있어요
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            autoFocus
            className="mt-1.5 w-full resize-none rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-md px-2.5 py-1 text-sm text-muted hover:text-ink"
            >
              취소
            </button>
            <button
              type="button"
              onClick={approve}
              disabled={!draft.trim()}
              className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-accent-ink disabled:opacity-40"
            >
              승인하고 추가
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
