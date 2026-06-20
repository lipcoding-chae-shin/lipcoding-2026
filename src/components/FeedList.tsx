"use client";

import type { FeedItem } from "@/lib/types";
import FeedItemCard from "./FeedItemCard";

interface Props {
  items: FeedItem[];
  onCreateTodo: (item: FeedItem, text: string) => void;
}

export default function FeedList({ items, onCreateTodo }: Props) {
  if (items.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-line py-16 text-center">
        <p className="text-sm text-muted">표시할 신호가 없어요.</p>
        <p className="mt-1 text-xs text-faint">
          소스를 연결하면 여기에 모입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <FeedItemCard key={item.id} item={item} onCreateTodo={onCreateTodo} />
      ))}
    </div>
  );
}
