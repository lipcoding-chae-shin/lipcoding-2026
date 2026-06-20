"use client";

import { useRef, useState } from "react";
import type { FeedItem, Source, SubscribedSource, Todo } from "@/lib/types";
import SubscribeBar from "@/components/SubscribeBar";
import AddSourceModal from "@/components/AddSourceModal";
import { SOURCE_META } from "@/components/sources";
import FeedList from "@/components/FeedList";
import TodoPanel from "@/components/TodoPanel";
import InsightFeed from "@/components/InsightFeed";
import ThemeToggle from "@/components/ThemeToggle";
import { SOURCES, getRawFeed } from "@/components/mock";
import { getInsightFeed } from "@/components/insights";

export default function Page() {
  const [sources, setSources] = useState<SubscribedSource[]>(SOURCES);
  const [feed] = useState<FeedItem[]>(getRawFeed);
  const [insights] = useState(getInsightFeed);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [undo, setUndo] = useState<{ todo: Todo; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceUndo, setSourceUndo] = useState<{
    source: SubscribedSource;
    index: number;
  } | null>(null);
  const sourceUndoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  const connected = new Set(
    sources.filter((s) => s.connected).map((s) => s.source),
  );
  const visibleFeed = feed.filter((i) => connected.has(i.source));
  const untriaged = visibleFeed.filter((i) => !i.triaged).length;

  const toggleSource = (id: string) =>
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, connected: !s.connected } : s)),
    );

  const addSource = (source: Source, identifier: string) => {
    const meta = SOURCE_META[source];
    const label = identifier ? `${meta.label} · ${identifier}` : meta.label;
    setSources((prev) => [
      ...prev,
      { id: crypto.randomUUID(), source, label, connected: true },
    ]);
    setModalOpen(false);
  };

  const deleteSource = (id: string) => {
    const index = sources.findIndex((s) => s.id === id);
    if (index < 0) return;
    const removed = sources[index];
    setSources((prev) => prev.filter((s) => s.id !== id));
    setSourceUndo({ source: removed, index });
    if (sourceUndoTimer.current) clearTimeout(sourceUndoTimer.current);
    sourceUndoTimer.current = setTimeout(() => setSourceUndo(null), 5000);
  };

  const undoSourceDelete = () => {
    if (!sourceUndo) return;
    setSources((prev) => {
      const next = [...prev];
      next.splice(Math.min(sourceUndo.index, next.length), 0, sourceUndo.source);
      return next;
    });
    setSourceUndo(null);
  };

  const createTodo = (item: FeedItem, text: string) => {
    const todo: Todo = {
      id: crypto.randomUUID(),
      text,
      done: false,
      sourceItemId: item.id,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [todo, ...prev]);
  };

  const toggleTodo = (id: string) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

  const editTodo = (id: string, text: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));

  const deleteTodo = (id: string) => {
    const index = todos.findIndex((t) => t.id === id);
    if (index < 0) return;
    const removed = todos[index];
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setUndo({ todo: removed, index });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  };

  const undoDelete = () => {
    if (!undo) return;
    setTodos((prev) => {
      const next = [...prev];
      next.splice(Math.min(undo.index, next.length), 0, undo.todo);
      return next;
    });
    setUndo(null);
  };

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <header className="surface-frosted sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold tracking-tight text-ink">Triage</h1>
            <span className="hidden text-xs text-faint sm:inline">
              흩어진 신호를 한 곳에서 분류·정리
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <SubscribeBar
              sources={sources}
              onToggle={toggleSource}
              onDelete={deleteSource}
              onAdd={() => setModalOpen(true)}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-4 py-4 sm:px-5 sm:py-5 lg:flex-1 lg:grid-cols-[1.55fr_1fr] lg:overflow-hidden">
        <section className="flex min-h-0 flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-ink">신호 피드</h2>
            <span className="text-xs text-faint">
              {untriaged > 0 ? `${untriaged}건 미분류` : "모두 분류됨"}
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-faint">
              <span className="size-1.5 rounded-full bg-ok" aria-hidden />
              자동 동기화
            </span>
          </div>

          <div className="scroll-thin min-h-0 max-h-[55vh] overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
            <FeedList items={visibleFeed} onCreateTodo={createTodo} />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-5 lg:overflow-hidden">
          <section className="surface flex min-h-[40vh] max-h-[60vh] flex-col rounded-xl p-5 lg:min-h-0 lg:max-h-none lg:flex-[1.2]">
            <TodoPanel
              todos={todos}
              onToggle={toggleTodo}
              onEdit={editTodo}
              onDelete={deleteTodo}
            />
          </section>

          <section className="surface flex min-h-[40vh] max-h-[60vh] flex-col rounded-xl p-5 lg:min-h-0 lg:max-h-none lg:flex-1">
            <InsightFeed items={insights} />
          </section>
        </aside>
      </main>

      {undo && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center">
          <div className="surface-dark pointer-events-auto flex items-center gap-3 rounded-xl px-5 py-2.5 text-sm text-ink rest-shadow">
            <span>할 일을 삭제했어요</span>
            <button
              type="button"
              onClick={undoDelete}
              className="font-medium text-accent-hover hover:underline"
            >
              실행취소
            </button>
          </div>
        </div>
      )}
      {sourceUndo && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center">
          <div className="surface-dark pointer-events-auto flex items-center gap-3 rounded-xl px-5 py-2.5 text-sm text-ink rest-shadow">
            <span>구독을 삭제했어요</span>
            <button
              type="button"
              onClick={undoSourceDelete}
              className="font-medium text-accent-hover hover:underline"
            >
              실행취소
            </button>
          </div>
        </div>
      )}

      <AddSourceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addSource}
      />
    </div>
  );
}
