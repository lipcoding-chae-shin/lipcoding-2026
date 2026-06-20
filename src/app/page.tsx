"use client";

import { useRef, useState } from "react";
import type { FeedItem, SubscribedSource, TraceEvent, Todo } from "@/lib/types";
import SubscribeBar from "@/components/SubscribeBar";
import FeedList from "@/components/FeedList";
import TodoPanel from "@/components/TodoPanel";
import StreamingTrace from "@/components/StreamingTrace";
import { SOURCES, getRawFeed, runTriageStream } from "@/components/mock";

export default function Page() {
  const [sources, setSources] = useState<SubscribedSource[]>(SOURCES);
  const [feed, setFeed] = useState<FeedItem[]>(getRawFeed);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [undo, setUndo] = useState<{ todo: Todo; index: number } | null>(null);
  const cancelRef = useRef<{ cancelled: boolean } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


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

  const pushTrace = (e: TraceEvent) => setTrace((prev) => [...prev, e]);
  const applyItem = (item: FeedItem) =>
    setFeed((prev) => prev.map((i) => (i.id === item.id ? item : i)));

  const runTriage = async () => {
    if (running) return;
    const signal = { cancelled: false };
    cancelRef.current = signal;
    setRunning(true);
    setTrace([]);
    await runTriageStream(
      feed.filter((i) => connected.has(i.source)),
      pushTrace,
      applyItem,
      signal,
    );
    if (!signal.cancelled) setRunning(false);
  };

  const stopTriage = () => {
    if (cancelRef.current) cancelRef.current.cancelled = true;
    setRunning(false);
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
    pushTrace({
      id: crypto.randomUUID(),
      itemId: item.id,
      kind: "todo",
      text: `할 일 생성: "${text.slice(0, 30)}"`,
      at: new Date().toISOString(),
    });
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
    <div className="flex h-dvh flex-col">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold tracking-tight text-ink">Triage</h1>
            <span className="hidden text-xs text-faint sm:inline">
              흩어진 신호를 한 곳에서 분류·정리
            </span>
          </div>
          <div className="ml-auto">
            <SubscribeBar sources={sources} onToggle={toggleSource} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-5 overflow-hidden px-5 py-5 lg:grid-cols-[1.55fr_1fr]">
        <section className="flex min-h-0 flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-ink">신호 피드</h2>
            <span className="text-xs text-faint">
              {untriaged > 0 ? `${untriaged}건 미분류` : "모두 분류됨"}
            </span>
            <div className="ml-auto">
              {running ? (
                <button
                  type="button"
                  onClick={stopTriage}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-muted hover:text-ink"
                >
                  중지
                </button>
              ) : (
                <button
                  type="button"
                  onClick={runTriage}
                  disabled={untriaged === 0}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink transition hover:opacity-90 disabled:opacity-40"
                >
                  AI 트리아지 실행
                </button>
              )}
            </div>
          </div>

          <StreamingTrace events={trace} running={running} />

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pr-1">
            <FeedList items={visibleFeed} onCreateTodo={createTodo} />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col rounded-2xl border border-line bg-surface-2 p-4">
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
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg">
            <span>할 일을 삭제했어요</span>
            <button
              type="button"
              onClick={undoDelete}
              className="font-semibold text-emerald-300 hover:underline"
            >
              실행취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
