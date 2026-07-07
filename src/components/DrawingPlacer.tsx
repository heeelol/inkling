"use client";
import { useRef, useState } from "react";
import { DEFAULT_PLACEMENT, type Placement } from "@/lib/composite";

type Props = {
  drawingUrl: string;
  onConfirm: (p: Placement) => void;
  onCancel: () => void;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const MIN_SCALE = 0.15;
const MAX_SCALE = 1.3;

type Drag = { mode: "move" | "resize"; startFx: number; startFy: number; orig: Placement };

/**
 * Overlays the scene with the child's fresh drawing as a movable "sticker".
 * Drag it around to shift it, drag the corner handle (or the ➖/➕ buttons) to
 * resize it, then confirm to stamp it into the picture at that spot.
 */
export function DrawingPlacer({ drawingUrl, onConfirm, onCancel }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState<Placement>(DEFAULT_PLACEMENT);
  const drag = useRef<Drag | null>(null);

  function frac(e: React.PointerEvent) {
    const rect = areaRef.current!.getBoundingClientRect();
    return { fx: (e.clientX - rect.left) / rect.width, fy: (e.clientY - rect.top) / rect.height };
  }

  function beginMove(e: React.PointerEvent) {
    const { fx, fy } = frac(e);
    drag.current = { mode: "move", startFx: fx, startFy: fy, orig: p };
    areaRef.current?.setPointerCapture(e.pointerId);
  }
  function beginResize(e: React.PointerEvent) {
    e.stopPropagation();
    const { fx, fy } = frac(e);
    drag.current = { mode: "resize", startFx: fx, startFy: fy, orig: p };
    areaRef.current?.setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const { fx, fy } = frac(e);
    const { mode, startFx, startFy, orig } = drag.current;
    if (mode === "move") {
      setP({ ...orig, x: clamp(orig.x + (fx - startFx), 0, 1), y: clamp(orig.y + (fy - startFy), 0, 1) });
    } else {
      const half = Math.max(Math.abs(fx - orig.x), Math.abs(fy - orig.y));
      setP({ ...orig, scale: clamp(half * 2, MIN_SCALE, MAX_SCALE) });
    }
  }
  function endDrag(e: React.PointerEvent) {
    drag.current = null;
    areaRef.current?.releasePointerCapture(e.pointerId);
  }

  const bump = (d: number) => setP((cur) => ({ ...cur, scale: clamp(cur.scale + d, MIN_SCALE, MAX_SCALE) }));

  const boxStyle: React.CSSProperties = {
    position: "absolute",
    left: `${(p.x - p.scale / 2) * 100}%`,
    top: `${(p.y - p.scale / 2) * 100}%`,
    width: `${p.scale * 100}%`,
    height: `${p.scale * 100}%`,
    border: "2px dashed var(--crayon)",
    borderRadius: 10,
    boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
    touchAction: "none",
    cursor: "grab",
  };

  return (
    <div
      ref={areaRef}
      className="no-print"
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ position: "absolute", inset: 0, zIndex: 6, background: "rgba(74,58,44,0.06)", touchAction: "none" }}
    >
      <div style={boxStyle} onPointerDown={beginMove}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={drawingUrl}
          alt="your drawing"
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none" }}
        />
        {/* corner resize handle */}
        <div
          onPointerDown={beginResize}
          aria-label="resize drawing"
          style={{
            position: "absolute", right: -11, bottom: -11, width: 24, height: 24, borderRadius: "50%",
            background: "var(--crayon)", border: "2px solid #fff", cursor: "nwse-resize",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff",
          }}
        >
          ↔
        </div>
      </div>

      {/* toolbar */}
      <div
        style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 8, alignItems: "center", background: "rgba(255,253,245,0.95)",
          padding: "8px 12px", borderRadius: 999, boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginRight: 2 }}>Drag to move ✋</span>
        <button onClick={() => bump(-0.12)} aria-label="make smaller"
          style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #e0cba0", background: "#fff", fontWeight: 800, fontSize: 18, cursor: "pointer", color: "var(--ink)" }}>−</button>
        <button onClick={() => bump(0.12)} aria-label="make bigger"
          style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #e0cba0", background: "#fff", fontWeight: 800, fontSize: 18, cursor: "pointer", color: "var(--ink)" }}>+</button>
        <button onClick={onCancel}
          style={{ background: "#fff", color: "var(--ink)", border: "2px solid #e0cba0", borderRadius: 14, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => onConfirm(p)}
          style={{ background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>✨ Add to picture</button>
      </div>
    </div>
  );
}
