"use client";

import type { Todo } from "@/lib/types";
import TodoItem from "./TodoItem";

interface Props {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export default function TodoPanel({ todos, onToggle, onEdit, onDelete }: Props) {
  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink">할 일</h2>
        <span className="text-xs text-faint">
          {open.length}개 남음
        </span>
      </div>

      {todos.length === 0 ? (
        <div className="mt-3 grid flex-1 place-items-center rounded-xl border border-dashed border-line text-center">
          <div className="px-6 py-10">
            <p className="text-sm text-muted">아직 할 일이 없어요.</p>
            <p className="mt-1 text-xs text-faint">
              피드의 Task 항목을 승인해 추가하세요.
            </p>
          </div>
        </div>
      ) : (
        <div className="scroll-thin mt-3 flex-1 space-y-4 overflow-y-auto pr-1">
          <ul className="space-y-2">
            {open.map((t) => (
              <TodoItem
                key={t.id}
                todo={t}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>

          {done.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
                완료 {done.length}
              </p>
              <ul className="space-y-2">
                {done.map((t) => (
                  <TodoItem
                    key={t.id}
                    todo={t}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
