import { describe, it, expect } from "vitest";
import { createCollector, createTriageTools } from "./tools";

// The SDK tool object exposes the handler we configured. We call it directly
// to test our collector logic without a live model.
type ToolLike = { name: string; handler: (args: any) => Promise<unknown> };

function byName(tools: unknown[], name: string): ToolLike {
  const t = (tools as ToolLike[]).find((x) => x.name === name);
  if (!t) throw new Error(`tool ${name} not found`);
  return t;
}

describe("triage tools", () => {
  it("summarize_item + tag_item merge into one result", async () => {
    const c = createCollector();
    const tools = createTriageTools(c);
    await byName(tools, "summarize_item").handler({ itemId: "x1", summary: "S" });
    await byName(tools, "tag_item").handler({ itemId: "x1", tag: "Task" });
    expect(c.results.get("x1")).toEqual({ itemId: "x1", summary: "S", tag: "Task" });
  });

  it("create_todo appends a todo", async () => {
    const c = createCollector();
    const tools = createTriageTools(c);
    await byName(tools, "create_todo").handler({ itemId: "x1", title: "Do it" });
    expect(c.todos).toEqual([
      { id: "todo-x1", itemId: "x1", title: "Do it", done: false },
    ]);
  });

  it("tag_item rejects invalid tags", async () => {
    const c = createCollector();
    const tools = createTriageTools(c);
    await expect(
      byName(tools, "tag_item").handler({ itemId: "x1", tag: "Nope" })
    ).rejects.toThrow();
  });
});
