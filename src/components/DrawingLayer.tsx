"use client";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { getStroke } from "perfect-freehand";

export type DrawingLayerHandle = {
  exportPng: () => string | null;
  clear: () => void;
};

const PALETTE = ["#e8590c", "#ff8787", "#ffe066", "#74c0fc", "#4a3a2c"];

type Props = { width: number; height: number };

export const DrawingLayer = forwardRef<DrawingLayerHandle, Props>(function DrawingLayer(
  { width, height },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(PALETTE[0]);
  const [erasing, setErasing] = useState(false);
  const colorRef = useRef(color);
  const erasingRef = useRef(erasing);
  colorRef.current = color;
  erasingRef.current = erasing;

  const drawing = useRef(false);
  const points = useRef<number[][]>([]);
  const hasDrawn = useRef(false);

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
    const stroke = getStroke(points.current, { size: 16, thinning: 0.6, smoothing: 0.6, streamline: 0.5 });
    if (!stroke.length) return;
    ctx.globalCompositeOperation = erasingRef.current ? "destination-out" : "source-over";
    ctx.fillStyle = colorRef.current;
    ctx.beginPath();
    stroke.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }

  function onPointerDown(e: React.PointerEvent) {
    drawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
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
  }

  useImperativeHandle(ref, () => ({
    exportPng: () => {
      if (!hasDrawn.current || !canvasRef.current) return null;
      return canvasRef.current.toDataURL("image/png");
    },
    clear: () => {
      const ctx = getCtx();
      if (ctx) ctx.clearRect(0, 0, width, height);
      hasDrawn.current = false;
    },
  }));

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
          display: "flex", gap: 8, alignItems: "center",
          background: "rgba(255,255,255,0.8)", padding: "6px 10px", borderRadius: 999,
        }}
      >
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => { setColor(c); setErasing(false); }}
            aria-label={`crayon ${c}`}
            style={{
              width: 22, height: 22, borderRadius: "50%", background: c,
              border: color === c && !erasing ? "3px solid #4a3a2c" : "2px solid #fff", cursor: "pointer",
            }}
          />
        ))}
        <button
          onClick={() => setErasing(true)}
          aria-label="eraser"
          style={{
            fontSize: 16, lineHeight: 1, padding: "2px 6px", borderRadius: 8,
            border: erasing ? "3px solid #4a3a2c" : "2px solid #fff",
            background: "#fff", cursor: "pointer",
          }}
        >🩹</button>
      </div>
    </div>
  );
});
