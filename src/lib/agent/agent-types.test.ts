import { describe, it, expect } from "vitest";
import { isTagKind } from "./agent-types";

describe("isTagKind", () => {
  it("accepts Task and Info", () => {
    expect(isTagKind("Task")).toBe(true);
    expect(isTagKind("Info")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isTagKind("Urgent")).toBe(false);
    expect(isTagKind("")).toBe(false);
  });
});
