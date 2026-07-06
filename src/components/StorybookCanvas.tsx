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
  displayScene: string | null;
  hasStagedDrawing: boolean;
  drawingRef: RefObject<DrawingLayerHandle | null>;
  drawerOpen: boolean;
  onOpenDraw: () => void;
  onIntegrate: () => void;
  onCancelDraw: () => void;
  onAction: (action: string) => void;
  speak: (t: string) => void;
  speaking: boolean;
};

const SCENE = 1024;

export function StorybookCanvas({
  current,
  phase,
  loading,
  message,
  displayScene,
  hasStagedDrawing,
  drawingRef,
  drawerOpen,
  onOpenDraw,
  onIntegrate,
  onCancelDraw,
  onAction,
  speak,
  speaking,
}: Props) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--cream)" }}>
      <div
        style={{
          display: "flex", width: "min(1100px, 96vw)", background: "#fff", borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden",
        }}
      >
        {/* left page: the main visual (view only) */}
        <div
          style={{
            flex: 1, aspectRatio: "1 / 1", position: "relative",
            background: displayScene ? `center/cover no-repeat url(${displayScene})` : "var(--cream)",
          }}
        >
          {phase === "illustrating" && (
            <div
              style={{
                position: "absolute", top: 10, left: 10, background: "rgba(255,253,245,0.92)",
                borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 700, color: "var(--ink)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }}
            >
              🖍️ painting…
            </div>
          )}
          {hasStagedDrawing && (
            <div
              style={{
                position: "absolute", bottom: 10, left: 10, background: "var(--sky)",
                borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "var(--ink)",
              }}
            >
              ✏️ your drawing is in the scene
            </div>
          )}
        </div>

        {/* spine */}
        <div style={{ width: 3, background: "linear-gradient(#e0cba0,#f3e6c6)" }} />

        {/* right page: narration */}
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
                onDraw={onOpenDraw}
                speak={speak}
                speaking={speaking}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* drawing drawer (slides up from the bottom) */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="drawer"
            className="no-print"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20, background: "#fff",
              borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: "0 -12px 40px rgba(0,0,0,0.25)",
              padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              Draw something to add to your picture ✏️
            </div>
            <div
              className="book-page"
              style={{
                position: "relative", width: "min(360px, 78vw)", aspectRatio: "1 / 1",
                background: "var(--cream)", borderRadius: 14, border: "2px dashed #e0cba0", overflow: "hidden",
              }}
            >
              <DrawingLayer ref={drawingRef} width={SCENE} height={SCENE} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onCancelDraw}
                style={{ background: "#fff", color: "var(--ink)", border: "2px solid #e0cba0", borderRadius: 14, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={onIntegrate}
                style={{ background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "10px 24px", fontWeight: 700, cursor: "pointer" }}
              >
                ✨ Add to picture
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
