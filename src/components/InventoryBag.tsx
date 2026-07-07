"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { canPlace, dims, usedCells, BAG_COLS, BAG_ROWS, type Item, type Placed } from "@/lib/inventory";

type Props = {
  bag: Placed[];
  pending: Item[];
  disabled: boolean; // mid-turn
  onMove: (id: string, x: number, y: number, rot: boolean) => boolean;
  onPlacePending: (id: string, x: number, y: number, rot: boolean) => boolean;
  onDiscardPending: (id: string) => void;
  onUse: (name: string) => void;
  onDrop: (id: string) => void;
  onClose: () => void;
};

type Sel = { source: "bag" | "pending"; item: Item; rot: boolean } | null;

const CELL = 52;
const GAP = 3;
const px = (cells: number) => cells * CELL + (cells - 1) * GAP;

/**
 * Spatial bag: pick up an item (from the bag or the "found" pile), rotate it,
 * and click a highlighted cell to stow it. Limited 6×4 space forces real
 * packing decisions; "Use" hands the item to the Game Master.
 */
export function InventoryBag({ bag, pending, disabled, onMove, onPlacePending, onDiscardPending, onUse, onDrop, onClose }: Props) {
  const [sel, setSel] = useState<Sel>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  const selValid = (x: number, y: number) =>
    sel !== null && canPlace(bag, sel.item, x, y, sel.rot, sel.source === "bag" ? sel.item.id : undefined);

  const clickCell = (x: number, y: number) => {
    if (!sel || !selValid(x, y)) return;
    const ok = sel.source === "bag" ? onMove(sel.item.id, x, y, sel.rot) : onPlacePending(sel.item.id, x, y, sel.rot);
    if (ok) setSel(null);
  };

  const ghost = sel && hover && selValid(hover.x, hover.y) ? { ...hover, d: dims(sel.item, sel.rot) } : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="glass no-print"
      style={{
        position: "fixed", right: 16, bottom: 80, zIndex: 30, borderRadius: 18,
        padding: 14, boxShadow: "var(--shadow-lift)", display: "flex", flexDirection: "column", gap: 10,
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="font-display" style={{ fontWeight: 700, color: "var(--ink)", fontSize: 17 }}>🎒 Your bag</span>
        <span style={{ fontSize: 12, color: "#8a7860" }}>{usedCells(bag)}/{BAG_COLS * BAG_ROWS} cells</span>
        <button onClick={onClose} aria-label="close bag" style={{ marginLeft: "auto", border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "var(--ink)" }}>✕</button>
      </div>

      {/* grid */}
      <div
        style={{ position: "relative", width: px(BAG_COLS), height: px(BAG_ROWS) }}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: BAG_ROWS }, (_, y) =>
          Array.from({ length: BAG_COLS }, (_, x) => (
            <div
              key={`${x},${y}`}
              onMouseEnter={() => setHover({ x, y })}
              onClick={() => clickCell(x, y)}
              style={{
                position: "absolute", left: x * (CELL + GAP), top: y * (CELL + GAP), width: CELL, height: CELL,
                borderRadius: 8, boxSizing: "border-box",
                background: sel && selValid(x, y) ? "rgba(212,169,78,0.28)" : "rgba(74,58,44,0.10)",
                border: "1px solid rgba(74,58,44,0.15)",
                cursor: sel ? (selValid(x, y) ? "copy" : "not-allowed") : "default",
              }}
            />
          ))
        )}

        {/* placement ghost */}
        {ghost && (
          <div style={{
            position: "absolute", left: ghost.x * (CELL + GAP), top: ghost.y * (CELL + GAP),
            width: px(ghost.d.w), height: px(ghost.d.h), borderRadius: 10, pointerEvents: "none",
            border: "2px dashed var(--sunny)", background: "rgba(212,169,78,0.18)", zIndex: 3,
          }} />
        )}

        {/* items */}
        {bag.map((p) => {
          const d = dims(p.item, p.rot);
          const selected = sel?.source === "bag" && sel.item.id === p.item.id;
          return (
            <button
              key={p.item.id}
              title={`${p.item.name} (${p.item.w}×${p.item.h})`}
              onClick={() => setSel(selected ? null : { source: "bag", item: p.item, rot: p.rot })}
              style={{
                position: "absolute", left: p.x * (CELL + GAP), top: p.y * (CELL + GAP),
                width: px(d.w), height: px(d.h), borderRadius: 10, zIndex: 2, cursor: "grab",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0,
                background: selected ? "var(--sunny)" : "var(--paper)",
                border: selected ? "2px solid var(--crayon)" : "2px solid rgba(74,58,44,0.35)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.25)", opacity: selected ? 0.95 : 1,
              }}
            >
              <span style={{ fontSize: Math.min(d.w, d.h) > 1 ? 30 : 20, lineHeight: 1 }}>{p.item.emoji}</span>
              {d.w >= 2 && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink)", maxWidth: px(d.w) - 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.item.name}</span>}
            </button>
          );
        })}
      </div>

      {/* selected item actions */}
      {sel && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{sel.item.emoji} {sel.item.name}</span>
          <button onClick={() => setSel({ ...sel, rot: !sel.rot })} style={btn()}>🔄 Rotate</button>
          {sel.source === "bag" && (
            <button disabled={disabled} onClick={() => { onUse(sel.item.name); setSel(null); onClose(); }} style={btn(disabled)}>✨ Use</button>
          )}
          <button
            onClick={() => { if (sel.source === "bag") onDrop(sel.item.id); else onDiscardPending(sel.item.id); setSel(null); }}
            style={btn()}
          >🗑️ Drop</button>
          <span style={{ fontSize: 11, color: "#8a7860" }}>click a highlighted cell to stow</span>
        </div>
      )}

      {/* found items waiting to be packed */}
      {pending.length > 0 && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid rgba(74,58,44,0.15)", paddingTop: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--crayon)" }}>Found — pack or drop:</span>
          {pending.map((it) => (
            <button
              key={it.id}
              onClick={() => setSel(sel?.item.id === it.id ? null : { source: "pending", item: it, rot: false })}
              title={`${it.name} (${it.w}×${it.h})`}
              style={{ ...btn(), border: sel?.item.id === it.id ? "2px solid var(--crayon)" : undefined }}
            >
              {it.emoji} {it.name} <span style={{ opacity: 0.6 }}>{it.w}×{it.h}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const btn = (disabled = false): React.CSSProperties => ({
  border: "1px solid rgba(74,58,44,0.3)", background: "var(--paper)", color: "var(--ink)",
  borderRadius: 10, padding: "5px 10px", fontSize: 12, fontWeight: 700,
  cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
});
