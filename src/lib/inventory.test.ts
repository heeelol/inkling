import { describe, it, expect } from "vitest";
import { canPlace, firstFit, usedCells, dims, BAG_COLS, BAG_ROWS, type Item, type Placed } from "./inventory";

const item = (id: string, w: number, h: number): Item => ({ id, name: id, emoji: "x", w, h });

describe("inventory grid", () => {
  it("rejects out-of-bounds placement", () => {
    expect(canPlace([], item("sword", 1, 3), 0, BAG_ROWS - 2, false)).toBe(false);
    expect(canPlace([], item("shield", 2, 2), BAG_COLS - 1, 0, false)).toBe(false);
    expect(canPlace([], item("potion", 1, 1), -1, 0, false)).toBe(false);
  });

  it("rejects overlapping placement, allows adjacent", () => {
    const bag: Placed[] = [{ item: item("shield", 2, 2), x: 0, y: 0, rot: false }];
    expect(canPlace(bag, item("potion", 1, 1), 1, 1, false)).toBe(false);
    expect(canPlace(bag, item("potion", 1, 1), 2, 0, false)).toBe(true);
  });

  it("ignores the item itself when moving it", () => {
    const bag: Placed[] = [{ item: item("shield", 2, 2), x: 0, y: 0, rot: false }];
    expect(canPlace(bag, bag[0].item, 1, 0, false, "shield")).toBe(true);
  });

  it("rotation swaps footprint and lets a tall item fit a wide gap", () => {
    expect(dims(item("sword", 1, 3), true)).toEqual({ w: 3, h: 1 });
    // Occupy all but the last row: only a 1-row strip remains.
    const bag: Placed[] = [
      { item: item("a", 3, 3), x: 0, y: 0, rot: false },
      { item: item("b", 3, 3), x: 3, y: 0, rot: false },
    ];
    expect(canPlace(bag, item("sword", 1, 3), 0, 3, false)).toBe(false);
    const fit = firstFit(bag, item("sword", 1, 3));
    expect(fit).toEqual({ x: 0, y: 3, rot: true });
  });

  it("firstFit packs greedily and returns null when full", () => {
    const bag: Placed[] = [];
    // 24 cells / 2x2 items → exactly 6 fit.
    for (let i = 0; i < 6; i++) {
      const fit = firstFit(bag, item(`s${i}`, 2, 2));
      expect(fit).not.toBeNull();
      bag.push({ item: item(`s${i}`, 2, 2), ...fit! });
    }
    expect(usedCells(bag)).toBe(BAG_COLS * BAG_ROWS);
    expect(firstFit(bag, item("late", 1, 1))).toBeNull();
  });
});
