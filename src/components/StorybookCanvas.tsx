"use client";
import type { RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DrawingLayer, type DrawingLayerHandle } from "./DrawingLayer";
import { NarrationPanel } from "./NarrationPanel";
import type { Beat } from "@/lib/storyState";

type Props = {
  current: (Beat & { sceneUrl?: string }) | null;
  phase: "idle" | "thinking" | "illustrating";
  loading: boolean;
  message: string | null;
  drawingRef: RefObject<DrawingLayerHandle | null>;
  onAction: (action: string) => void;
  speak: (t: string) => void;
  speaking: boolean;
};

const SCENE = 1024;

export function StorybookCanvas({ current, phase, loading, message, drawingRef, onAction, speak, speaking }: Props) {
  const sceneBg = current?.sceneUrl ?? current?.imageUrl ?? null;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--cream)" }}>
      <div
        style={{
          display: "flex", width: "min(1100px, 96vw)", background: "#fff", borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden",
        }}
      >
        {/* left page: scene + drawing (square) */}
        <div
          style={{
            flex: 1, aspectRatio: "1 / 1", position: "relative",
            background: sceneBg ? `center/cover no-repeat url(${sceneBg})` : "var(--cream)",
          }}
        >
          <DrawingLayer ref={drawingRef} width={SCENE} height={SCENE} />
          {phase === "illustrating" && (
            <div
              style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", background: "rgba(255,253,245,0.5)", pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>🖍️ painting…</span>
            </div>
          )}
        </div>

        {/* spine */}
        <div style={{ width: 3, background: "linear-gradient(#e0cba0,#f3e6c6)" }} />

        {/* right page: narration (square) */}
        <div style={{ flex: 1, aspectRatio: "1 / 1", position: "relative", overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current?.narration ?? "start"}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
              style={{ height: "100%" }}
            >
              <NarrationPanel
                current={current}
                phase={phase}
                loading={loading}
                message={message}
                onAction={onAction}
                speak={speak}
                speaking={speaking}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
