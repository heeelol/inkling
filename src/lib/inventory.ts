// Spatial grid inventory ("bag") — pure logic, unit-tested.
// Items occupy w×h cells; players rearrange/rotate them to min-max limited space.

export type Item = { id: string; name: string; emoji: string; w: number; h: number };
export type Placed = { item: Item; x: number; y: number; rot: boolean };

export const BAG_COLS = 6;
export const BAG_ROWS = 4;

export const dims = (item: Item, rot: boolean) =>
  rot ? { w: item.h, h: item.w } : { w: item.w, h: item.h };

function occupied(bag: Placed[], ignoreId?: string): Set<string> {
  const set = new Set<string>();
  for (const p of bag) {
    if (p.item.id === ignoreId) continue;
    const d = dims(p.item, p.rot);
    for (let dx = 0; dx < d.w; dx++)
      for (let dy = 0; dy < d.h; dy++) set.add(`${p.x + dx},${p.y + dy}`);
  }
  return set;
}

export function canPlace(
  bag: Placed[], item: Item, x: number, y: number, rot: boolean,
  ignoreId?: string, cols = BAG_COLS, rows = BAG_ROWS
): boolean {
  const d = dims(item, rot);
  if (x < 0 || y < 0 || x + d.w > cols || y + d.h > rows) return false;
  const occ = occupied(bag, ignoreId);
  for (let dx = 0; dx < d.w; dx++)
    for (let dy = 0; dy < d.h; dy++) if (occ.has(`${x + dx},${y + dy}`)) return false;
  return true;
}

/** First free position scanning rows, trying unrotated then rotated. */
export function firstFit(
  bag: Placed[], item: Item, cols = BAG_COLS, rows = BAG_ROWS
): { x: number; y: number; rot: boolean } | null {
  for (const rot of [false, true]) {
    if (rot && item.w === item.h) break;
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        if (canPlace(bag, item, x, y, rot, undefined, cols, rows)) return { x, y, rot };
  }
  return null;
}

export const usedCells = (bag: Placed[]) => bag.reduce((n, p) => n + p.item.w * p.item.h, 0);
