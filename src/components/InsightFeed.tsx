"use client";

import type { InsightItem } from "./insights";
import InsightCard from "./InsightCard";

interface Props {
  items: InsightItem[];
}

export default function InsightFeed({ items }: Props) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink">인사이트 피드</h2>
        <span className="text-xs text-faint">연동된 SNS</span>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 grid flex-1 place-items-center rounded-xl border border-dashed border-line text-center">
          <div className="px-6 py-8">
            <p className="text-sm text-muted">표시할 인사이트가 없어요.</p>
            <p className="mt-1 text-xs text-faint">
              SNS를 연동하면 여기에 모입니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="scroll-thin mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {items.map((item) => (
            <InsightCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
