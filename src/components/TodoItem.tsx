"use client";

import { useState } from "react";
import type { Todo } from "@/lib/types";

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export default function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);

  const commit = () => {
    const next = text.trim();
    if (next && next !== todo.text) onEdit(todo.id, next);
    else setText(todo.text);
    setEditing(false);
  };

  return (
    <li className="group glass flex items-start gap-2.5 rounded-xl px-3 py-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.done ? "완료 취소" : "완료 표시"}
        onClick={() => onToggle(todo.id)}
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition ${
          todo.done
            ? "border-ok bg-ok text-white"
            : "border-line bg-white/60 hover:border-accent"
        }`}
      >
        {todo.done && (
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
            <path
              d="M3.5 8.5l3 3 6-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setText(todo.text);
                setEditing(false);
              }
            }}
            className="w-full rounded-md border border-accent bg-white/80 px-2 py-1 text-sm text-ink outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`block w-full text-left text-sm leading-snug ${
              todo.done ? "text-faint line-through" : "text-ink"
            }`}
          >
            {todo.text}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label="할 일 삭제"
        className="shrink-0 rounded-md px-1 text-faint opacity-0 transition hover:text-danger group-hover:opacity-100"
      >
        ✕
      </button>
    </li>
  );
}
