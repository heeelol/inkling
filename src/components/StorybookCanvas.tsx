"use client";
import type { RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DrawingLayer, type DrawingLayerHandle } from "./DrawingLayer";
import { DrawingPlacer } from "./DrawingPlacer";
import { NarrationPanel } from "./NarrationPanel";
import { LoadingIndicator } from "./LoadingIndicator";
import { Sparkles } from "./Sparkles";
import type { Placement } from "@/lib/composite";
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
  drawDescription: string;
  placingDrawing: string | null;
  sparkleKey: string | number | null;
  characters: string[];
  pageNumber: number;
  reveal: boolean;
  onOpenDraw: () => void;
  onStartPlacement: () => void;
  onCancelDraw: () => void;
  onDrawDescriptionChange: (v: string) => void;
  onConfirmPlacement: (p: Placement) => void;
  onCancelPlacement: () => void;
  onAction: (action: string) => void;
  speak: (t: string) => void;
  speaking: boolean;
  speechProgress: number;
  spokenText: string | null;
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
  drawDescription,
  placingDrawing,
  sparkleKey,
  characters,
  pageNumber,
  reveal,
  onOpenDraw,
  onStartPlacement,
  onCancelDraw,
  onDrawDescriptionChange,
  onConfirmPlacement,
  onCancelPlacement,
  onAction,
  speak,
  speaking,
  speechProgress,
  spokenText,
}: Props) {
  return (
    <div className="book-stage">
      <motion.div
        className="book"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          background: "#fff", borderRadius: 20,
          boxShadow: "var(--shadow-lift), 0 0 0 8px #fff, 0 0 0 10px rgba(224,203,160,0.55)",
          overflow: "hidden",
        }}
      >
        {/* left page: the main visual */}
        <div className="book-left" style={{ background: "var(--cream)", overflow: "hidden" }}>
          <AnimatePresence>
            {displayScene && (
              <motion.div
                key={displayScene}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ position: "absolute", inset: 0, background: `center/cover no-repeat url(${displayScene})` }}
              />
            )}
          </AnimatePresence>
          {sparkleKey != null && <Sparkles trigger={sparkleKey} />}
          {phase === "illustrating" && <LoadingIndicator variant="badge" emoji="🖍️" label="painting" />}
          {hasStagedDrawing && !placingDrawing && (
            <div
              style={{
                position: "absolute", bottom: 10, left: 10, background: "var(--sky)",
                borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "var(--ink)", zIndex: 5,
              }}
            >
              ✨ we&apos;ll paint your idea into the next picture
            </div>
          )}
          {placingDrawing && (
            <DrawingPlacer
              drawingUrl={placingDrawing}
              onConfirm={onConfirmPlacement}
              onCancel={onCancelPlacement}
            />
          )}

          {/* "your drawing came to life" magic moment */}
          {reveal && <div className="shimmer-sweep" style={{ zIndex: 7 }} />}
          <AnimatePresence>
            {reveal && (
              <motion.div
                key="reveal-toast"
                className="no-print"
                initial={{ opacity: 0, y: -12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                style={{
                  position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 9,
                  background: "var(--crayon)", color: "#fff", padding: "8px 16px", borderRadius: 999,
                  fontWeight: 700, fontSize: 14, boxShadow: "var(--shadow-soft)", whiteSpace: "nowrap",
                }}
              >
                🪄 your drawing came to life!
              </motion.div>
            )}
          </AnimatePresence>

          {pageNumber > 0 && (
            <div
              className="font-display"
              style={{
                position: "absolute", bottom: 10, right: 12, zIndex: 5,
                minWidth: 26, height: 26, padding: "0 8px", borderRadius: 999,
                background: "rgba(255,253,245,0.9)", color: "var(--ink)", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }}
            >
              {pageNumber}
            </div>
          )}
        </div>

        {/* spine */}
        <div className="book-spine" style={{ width: 6, background: "linear-gradient(90deg,rgba(0,0,0,0.08),transparent 30%,transparent 70%,rgba(0,0,0,0.08)), linear-gradient(#e6d2a8,#f3e6c6)" }} />

        {/* right page: narration */}
        <div className="book-right" style={{ display: "flex", flexDirection: "column" }}>
          {characters.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "12px 16px 0", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#a08b6a" }}>✨ cast</span>
              {characters.slice(0, 5).map((c, i) => (
                <span key={c} className="no-print" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", background: [ "var(--sunny)", "var(--sky)", "var(--mint)", "var(--rose)", "var(--grape)" ][i % 5], padding: "3px 10px", borderRadius: 999 }}>
                  {c}
                </span>
              ))}
              {characters.length > 5 && <span style={{ fontSize: 12, color: "#a08b6a" }}>+{characters.length - 5}</span>}
            </div>
          )}
          <div style={{ flex: 1, position: "relative", overflowY: "auto", minHeight: 0 }} className="book-page">
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
                speechProgress={speechProgress}
                spokenText={spokenText}
              />
            </motion.div>
          </AnimatePresence>
          </div>
        </div>
      </motion.div>

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
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20,
              background: "var(--paper)",
              borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: "0 -12px 50px rgba(74,58,44,0.28)",
              borderTop: "1px solid rgba(224,203,160,0.6)",
              padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}
          >
            <div style={{ width: 44, height: 5, borderRadius: 999, background: "rgba(224,203,160,0.9)", marginBottom: 2 }} />
            <div className="font-display" style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)" }}>
              Draw something to add to your story ✏️
            </div>
            <div style={{ fontSize: 13, color: "#8a7860", marginTop: -6 }}>
              Tap 🎨 for colors, brushes &amp; sizes — then place it in the scene.
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
            <input
              value={drawDescription}
              onChange={(e) => onDrawDescriptionChange(e.target.value)}
              placeholder="Tell me what you drew (optional)…"
              maxLength={120}
              style={{ width: "min(360px, 78vw)", padding: "10px 14px", borderRadius: 12, border: "2px solid #e0cba0", fontSize: 15 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onCancelDraw}
                style={{ background: "#fff", color: "var(--ink)", border: "2px solid #e0cba0", borderRadius: 14, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={onStartPlacement}
                style={{ background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "10px 24px", fontWeight: 700, cursor: "pointer" }}
              >
                Place it →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
