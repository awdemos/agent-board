import { describe, expect, test } from "bun:test"
import type { AgentBoardBoard, AgentBoardCard } from "./api"
import { applyBoardOrder, insertArrayItemBefore, normalizeColumnOrder, orderFromBoard } from "./board-order"

function card(id: string): AgentBoardCard {
  return {
    column: "open",
    issue: { id, title: id, raw: {} },
    artifacts: [],
    events: [],
  }
}

function board(): AgentBoardBoard {
  return {
    project: { id: "project-1", worktree: "/tmp/project", enabled: true, time: { created: 1, updated: 1 } },
    generatedAt: 1,
    graph: { dependencies: [], positions: [] },
    columns: [
      { id: "open", title: "Open", cards: [card("A"), card("B"), card("C")] },
      { id: "running", title: "Running", cards: [card("D")] },
      { id: "needs_review", title: "Needs Review", cards: [] },
      { id: "closed", title: "Closed", cards: [] },
    ],
  }
}

describe("agentboard board order", () => {
  test("normalizes invalid and duplicate columns", () => {
    expect(normalizeColumnOrder(["running", "open", "running", "unknown" as never])).toEqual([
      "running",
      "open",
      "needs_review",
      "closed",
    ])
  })

  test("applies saved column and card order while preserving unknown cards", () => {
    const ordered = applyBoardOrder(board(), {
      columns: ["running", "open", "closed", "blocked", "needs_review"],
      cards: { open: ["C", "A"] },
    })

    expect(ordered.columns.map((column) => column.id)).toEqual([
      "running",
      "open",
      "closed",
      "needs_review",
    ])
    expect(ordered.columns.find((column) => column.id === "open")?.cards.map((item) => item.issue.id)).toEqual([
      "C",
      "A",
      "B",
    ])
  })

  test("captures order from current board", () => {
    const order = orderFromBoard(board(), ["open", "running"])

    expect(order.columns).toEqual(["open", "running", "needs_review", "closed"])
    expect(order.cards.open).toEqual(["A", "B", "C"])
    expect(order.cards.running).toEqual(["D"])
  })

  test("moves array items before another item or to the end", () => {
    expect(insertArrayItemBefore(["A", "B", "C"], "C", "A")).toEqual(["C", "A", "B"])
    expect(insertArrayItemBefore(["A", "B", "C"], "A")).toEqual(["B", "C", "A"])
    expect(insertArrayItemBefore(["A", "B", "C"], "B", "B")).toEqual(["A", "B", "C"])
  })
})
