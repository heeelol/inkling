"use client";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { getStroke } from "perfect-freehand";

export type DrawingLayerHandle = {
  exportPng: () => string | null;
  clear: () => void;
};

const PALETTE = ["#e8590c", "#ff8787", "#ffe066", "#69db7c", "#74c0fc", "#b197fc", "#4a3a2c"];

const SIZES = [
  { label: "thin", value: 8 },
  { label: "medium", value: 16 },
  { label: "thick", value: 30 },
  { label: "jumbo", value: 48 },
];

type BrushKey = "crayon" | "marker" | "pencil";
const BRUSHES: Record<BrushKey, { emoji: string; name: string; thinning: number; smoothing: number; streamline: number; alpha: number }> = {
  crayon: { emoji: "🖍️", name: "Crayon", thinning: 0.55, smoothing: 0.55, streamline: 0.45, alpha: 1 },
  marker: { emoji: "🖊️", name: "Marker", thinning: 0.05, smoothing: 0.62, streamline: 0.55, alpha: 1 },
  pencil: { emoji: "✏️", name: "Pencil", thinning: 0.85, smoothing: 0.4, streamline: 0.3, alpha: 0.8 },
};

const UNDO_LIMIT = 10;

type Props = { width: number; height: number };

export const DrawingLayer = forwardRef<DrawingLayerHandle, Props>(function DrawingLayer(
  { width, height },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(PALETTE[0]);
  const [erasing, setErasing] = useState(false);
  const [size, setSize] = useState(SIZES[1].value);
  const [brush, setBrush] = useState<BrushKey>("crayon");
  const [canUndo, setCanUndo] = useState(false);

  const colorRef = useRef(color);
  const erasingRef = useRef(erasing);
  const sizeRef = useRef(size);
  const brushRef = useRef(brush);
  colorRef.current = color;
  erasingRef.current = erasing;
  sizeRef.current = size;
  brushRef.current = brush;

  const drawing = useRef(false);
  const points = useRef<number[][]>([]);
  const hasDrawn = useRef(false);
  // Committed pixels before the in-progress stroke — used to redraw a clean
  // stroke each frame (so translucent brushes don't darken) and to power undo.
  const baseSnapshot = useRef<ImageData | null>(null);
  const undoStack = useRef<ImageData[]>([]);

  function getCtx() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function pointerPos(e: React.PointerEvent): number[] {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY, e.pressure || 0.5];
  }

  function renderStroke() {
    const ctx = getCtx();
    if (!ctx) return;
    const b = BRUSHES[brushRef.current];
    // Translucent brushes must repaint from the pre-stroke snapshot each frame,
    // or the overlapping fills stack up and darken. Opaque brushes/eraser don't.
    if (!erasingRef.current && b.alpha < 1 && baseSnapshot.current) {
      ctx.putImageData(baseSnapshot.current, 0, 0);
    }
    const stroke = getStroke(points.current, {
      size: sizeRef.current, thinning: b.thinning, smoothing: b.smoothing, streamline: b.streamline,
    });
    if (!stroke.length) return;
    ctx.globalCompositeOperation = erasingRef.current ? "destination-out" : "source-over";
    ctx.globalAlpha = erasingRef.current ? 1 : b.alpha;
    ctx.fillStyle = colorRef.current;
    ctx.beginPath();
    stroke.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function pushUndo() {
    const ctx = getCtx();
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, width, height);
    baseSnapshot.current = snap;
    undoStack.current.push(snap);
    if (undoStack.current.length > UNDO_LIMIT) undoStack.current.shift();
    setCanUndo(true);
  }

  function hasInk(img: ImageData): boolean {
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return true;
    return false;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!canvasRef.current) return;
    drawing.current = true;
    canvasRef.current.setPointerCapture(e.pointerId);
    pushUndo();
    points.current = [pointerPos(e)];
    renderStroke();
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current) return;
    points.current.push(pointerPos(e));
    renderStroke();
  }
  function onPointerUp() {
    if (drawing.current) hasDrawn.current = true;
    drawing.current = false;
    points.current = [];
    baseSnapshot.current = null;
  }

  function undo() {
    const ctx = getCtx();
    if (!ctx) return;
    const prev = undoStack.current.pop();
    if (prev) {
      ctx.putImageData(prev, 0, 0);
      hasDrawn.current = hasInk(prev);
    } else {
      ctx.clearRect(0, 0, width, height);
      hasDrawn.current = false;
    }
    setCanUndo(undoStack.current.length > 0);
  }

  function clearCanvas(record: boolean) {
    const ctx = getCtx();
    if (!ctx) return;
    if (record && hasDrawn.current) pushUndo();
    ctx.clearRect(0, 0, width, height);
    hasDrawn.current = false;
  }

  useImperativeHandle(ref, () => ({
    exportPng: () => {
      if (!hasDrawn.current || !canvasRef.current) return null;
      return canvasRef.current.toDataURL("image/png");
    },
    clear: () => {
      clearCanvas(false);
      undoStack.current = [];
      baseSnapshot.current = null;
      setCanUndo(false);
    },
  }));

  const toolBtn = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    minWidth: 30, height: 30, padding: "0 6px", borderRadius: 10, fontSize: 15, lineHeight: 1,
    background: active ? "var(--sunny)" : "#fff", cursor: "pointer",
    border: active ? "2px solid #4a3a2c" : "2px solid #e0cba0",
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "none", width: "100%", height: "100%", cursor: "crosshair", display: "block" }}
      />

      <div
        style={{
          position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
          background: "rgba(255,255,255,0.88)", padding: "8px 10px", borderRadius: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)", maxWidth: "94%",
        }}
      >
        {/* colors + eraser */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setErasing(false); }}
              aria-label={`color ${c}`}
              style={{
                width: 22, height: 22, borderRadius: "50%", background: c,
                border: color === c && !erasing ? "3px solid #4a3a2c" : "2px solid #fff", cursor: "pointer",
              }}
            />
          ))}
          <button onClick={() => setErasing(true)} aria-label="eraser" title="Eraser" style={toolBtn(erasing)}>🩹</button>
        </div>

        {/* brushes + sizes + undo/clear */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          {(Object.keys(BRUSHES) as BrushKey[]).map((k) => (
            <button
              key={k}
              onClick={() => { setBrush(k); setErasing(false); }}
              aria-label={BRUSHES[k].name}
              title={BRUSHES[k].name}
              style={toolBtn(brush === k && !erasing)}
            >{BRUSHES[k].emoji}</button>
          ))}
          <span style={{ width: 1, height: 22, background: "#e0cba0" }} />
          {SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSize(s.value)}
              aria-label={`${s.label} brush`}
              title={s.label}
              style={toolBtn(size === s.value)}
            >
              <span style={{ width: Math.min(s.value / 2.6, 16), height: Math.min(s.value / 2.6, 16), minWidth: 4, minHeight: 4, borderRadius: "50%", background: "#4a3a2c", display: "block" }} />
            </button>
          ))}
          <span style={{ width: 1, height: 22, background: "#e0cba0" }} />
          <button onClick={undo} disabled={!canUndo} aria-label="undo" title="Undo"
            style={{ ...toolBtn(false), opacity: canUndo ? 1 : 0.4, cursor: canUndo ? "pointer" : "default" }}>↩️</button>
          <button onClick={() => clearCanvas(true)} aria-label="clear" title="Start over" style={toolBtn(false)}>🗑️</button>
        </div>
      </div>
    </div>
  );
});
