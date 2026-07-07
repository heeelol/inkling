"use client";
import { AnimatePresence, motion } from "motion/react";
import { NarrationPanel } from "./NarrationPanel";
import { LoadingIndicator } from "./LoadingIndicator";
import { Sparkles } from "./Sparkles";
import { SceneHotspots, type Hotspot } from "./SceneHotspots";
import type { Beat } from "@/lib/storyState";

type Props = {
  current: Beat | null;
  phase: "idle" | "thinking" | "illustrating";
  loading: boolean;
  message: string | null;
  displayScene: string | null;
  sparkleKey: string | number | null;
  characters: string[];
  pageNumber: number;
  hotspots: Hotspot[];
  ownedItems: string[];
  onPoke?: () => void;
  onAction: (action: string) => void;
  speak: (t: string) => void;
  speaking: boolean;
  speechProgress: number;
  spokenText: string | null;
};

export function StorybookCanvas({
  current, phase, loading, message, displayScene, sparkleKey,
  characters, pageNumber, hotspots, ownedItems, onPoke, onAction,
  speak, speaking, speechProgress, spokenText,
}: Props) {
  return (
    <div className="book-stage">
      <motion.div
        className="book"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          background: "var(--paper)", borderRadius: 20,
          boxShadow: "var(--shadow-lift), 0 0 0 8px #2b2018, 0 0 0 10px rgba(212,169,78,0.5)",
          overflow: "hidden",
        }}
      >
        {/* left page: the scene */}
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
          {displayScene && phase === "idle" && hotspots.length > 0 && (
            <SceneHotspots sceneUrl={displayScene} hotspots={hotspots} onPoke={onPoke} />
          )}
          {sparkleKey != null && <Sparkles trigger={sparkleKey} />}
          {phase === "illustrating" && <LoadingIndicator variant="badge" emoji="🎨" label="conjuring" />}
          {pageNumber > 0 && (
            <div
              className="font-display"
              style={{
                position: "absolute", bottom: 10, right: 12, zIndex: 5,
                minWidth: 26, height: 26, padding: "0 8px", borderRadius: 999,
                background: "rgba(244,234,213,0.9)", color: "var(--ink)", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }}
            >
              {pageNumber}
            </div>
          )}
        </div>

        {/* spine */}
        <div className="book-spine" style={{ width: 6, background: "linear-gradient(90deg,rgba(0,0,0,0.25),transparent 30%,transparent 70%,rgba(0,0,0,0.25)), linear-gradient(#8a6d3b,#b39257)" }} />

        {/* right page: narration */}
        <div className="book-right" style={{ display: "flex", flexDirection: "column" }}>
          {characters.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "12px 16px 0", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#a08b6a" }}>⚔️ cast</span>
              {characters.slice(0, 5).map((c) => (
                <span key={c} className="no-print" style={{ fontSize: 12, fontWeight: 600, color: "var(--paper)", background: "rgba(74,58,44,0.85)", padding: "3px 10px", borderRadius: 999 }}>
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
                  ownedItems={ownedItems}
                  onAction={onAction}
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
    </div>
  );
}
