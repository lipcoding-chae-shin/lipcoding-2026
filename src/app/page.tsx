"use client";

import { useEffect, useRef, useState } from "react";
import type {
  FeedItem,
  FeedResponse,
  SubscribedSource,
  Todo,
} from "@/lib/types";
import SubscribeBar from "@/components/SubscribeBar";
import FeedList from "@/components/FeedList";
import TodoPanel from "@/components/TodoPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { SOURCES } from "@/components/mock";

export default function Page() {
  const [sources, setSources] = useState<SubscribedSource[]>(SOURCES);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [undo, setUndo] = useState<{ todo: Todo; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/feed", { cache: "no-store" });
        if (!res.ok) throw new Error(`피드를 불러오지 못했어요 (HTTP ${res.status})`);
        const data: FeedResponse = await res.json();
        if (!cancelled) {
          setFeed(data.items);
          setFeedError(null);
        }
      } catch (err) {
        if (!cancelled) setFeedError((err as Error).message);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);


  const connected = new Set(
    sources.filter((s) => s.connected).map((s) => s.source),
  );
  const visibleFeed = feed.filter((i) => connected.has(i.source));
  const untriaged = visibleFeed.filter((i) => !i.triaged).length;

  const toggleSource = (source: SubscribedSource["source"]) =>
    setSources((prev) =>
      prev.map((s) =>
        s.source === source ? { ...s, connected: !s.connected } : s,
      ),
    );

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
            <SubscribeBar sources={sources} onToggle={toggleSource} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-4 py-4 sm:px-5 sm:py-5 lg:flex-1 lg:grid-cols-[1.55fr_1fr] lg:overflow-hidden">
        <section className="flex min-h-0 flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-ink">신호 피드</h2>
            <span className="text-xs text-faint">
              {feedLoading
                ? "불러오는 중…"
                : untriaged > 0
                  ? `${untriaged}건 미분류`
                  : "모두 분류됨"}
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-faint">
              <span className="size-1.5 rounded-full bg-ok" aria-hidden />
              자동 동기화
            </span>
          </div>

          <div className="scroll-thin min-h-0 pr-1 lg:flex-1 lg:overflow-y-auto">
            {feedError ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-line py-16 text-center">
                <p className="text-sm text-muted">{feedError}</p>
                <p className="mt-1 text-xs text-faint">
                  잠시 후 다시 시도해 주세요.
                </p>
              </div>
            ) : feedLoading ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-line py-16 text-center">
                <p className="text-sm text-muted">신호를 불러오는 중…</p>
              </div>
            ) : (
              <FeedList items={visibleFeed} onCreateTodo={createTodo} />
            )}
          </div>
        </section>

        <aside className="surface flex min-h-[45vh] flex-col rounded-xl p-5 lg:min-h-0">
          <TodoPanel
            todos={todos}
            onToggle={toggleTodo}
            onEdit={editTodo}
            onDelete={deleteTodo}
          />
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
    </div>
  );
}
