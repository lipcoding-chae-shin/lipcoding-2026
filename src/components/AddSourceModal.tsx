"use client";

import { useEffect, useRef, useState } from "react";
import type { Source } from "@/lib/types";
import { SOURCE_CATALOG, SOURCE_META } from "./sources";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (source: Source, identifier: string) => void;
}

export default function AddSourceModal({ open, onClose, onAdd }: Props) {
  const [selected, setSelected] = useState<Source | null>(null);
  const [identifier, setIdentifier] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setSelected(null);
    setIdentifier("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!selected) return;
    onAdd(selected, identifier.trim());
    reset();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (selected) inputRef.current?.focus();
  }, [selected]);

  if (!open) return null;

  const meta = selected ? SOURCE_META[selected] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="구독 소스 추가"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={close}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />

      <div className="rest-shadow relative w-full max-w-md rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">구독 소스 추가</h2>
            <p className="mt-0.5 text-xs text-faint">
              소스를 고르고 계정·레포·키워드를 입력하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="focusable -mr-1 -mt-1 grid size-8 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink"
          >
            <svg
              viewBox="0 0 16 16"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {SOURCE_CATALOG.map((src) => {
            const m = SOURCE_META[src];
            const active = selected === src;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setSelected(src)}
                aria-pressed={active}
                className={`press focusable flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs transition ${
                  active
                    ? "border-accent bg-accent-weak text-ink"
                    : "border-line bg-surface-2 text-muted hover:text-ink"
                }`}
              >
                <span
                  className="grid size-7 place-items-center rounded-full text-[11px] font-bold leading-none text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.mark}
                </span>
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </div>

        {selected && meta && (
          <div className="mt-4">
            <label
              htmlFor="source-identifier"
              className="mb-1.5 block text-xs font-medium text-muted"
            >
              {meta.idLabel}
            </label>
            <input
              id="source-identifier"
              ref={inputRef}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder={meta.idPlaceholder}
              className="focusable w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none placeholder:text-tertiary"
            />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="press focusable rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!selected}
            className="press focusable rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink transition hover:opacity-90 disabled:opacity-40"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
