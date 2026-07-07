"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { LoadingIndicator } from "./LoadingIndicator";
import type { Beat } from "@/lib/storyState";

type Props = {
  current: (Beat & { sceneUrl?: string }) | null;
  phase: "idle" | "thinking" | "illustrating";
  loading: boolean;
  message: string | null;
  onAction: (action: string) => void;
  onDraw: () => void;
  speak: (t: string) => void;
  speaking: boolean;
  speechProgress: number;
  spokenText: string | null;
};

// Karaoke-style narration: which word is being read right now, based on how far
// through the audio we are (weighted by word length).
function KaraokeText({ text, progress }: { text: string; progress: number }) {
  const tokens = text.split(/(\s+)/);
  const totalChars = text.replace(/\s+/g, "").length || 1;
  const target = progress * totalChars;
  let seen = 0;
  let active = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (/^\s+$/.test(tokens[i])) continue;
    seen += tokens[i].length;
    if (seen >= target) { active = i; break; }
  }
  return (
    <span>
      {tokens.map((tk, i) => {
        if (/^\s+$/.test(tk)) return <span key={i}>{tk}</span>;
        const isActive = i === active;
        const isPast = active !== -1 && i < active;
        return (
          <span
            key={i}
            style={{
              background: isActive ? "var(--sunny)" : "transparent",
              borderRadius: 6, padding: isActive ? "0 3px" : 0,
              color: isPast ? "var(--ink)" : isActive ? "var(--ink)" : "#8a7860",
              transition: "background 0.12s, color 0.12s",
            }}
          >
            {tk}
          </span>
        );
      })}
    </span>
  );
}

const choiceStyle: React.CSSProperties = {
  background: "var(--sunny)", color: "var(--ink)", border: "3px solid #fff",
  borderRadius: 16, padding: "12px 18px", fontSize: 17, fontWeight: 700, cursor: "pointer",
  boxShadow: "0 3px 0 rgba(0,0,0,0.08)", textAlign: "left",
};

export function NarrationPanel({ current, phase, loading, message, onAction, onDraw, speak, speaking, speechProgress, spokenText }: Props) {
  const [text, setText] = useState("");
  const karaoke = speaking && spokenText === current?.narration;
  const submitText = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    onAction(t);
  };

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", height: "100%", gap: 16, boxSizing: "border-box" }}>
      {!current && loading && <p style={{ fontSize: 22, fontFamily: "Georgia, serif" }}>✨ Once upon a time…</p>}

      {!current && !loading && message && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ color: "var(--crayon)", fontWeight: 700, fontSize: 20, margin: 0 }}>{message}</p>
          <p style={{ color: "#a08b6a", margin: 0 }}>Try beginning a different story.</p>
        </div>
      )}

      {current && (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <p style={{ fontSize: 22, lineHeight: 1.7, color: "var(--ink)", fontFamily: "Georgia, serif", margin: 0 }}>
              {karaoke ? <KaraokeText text={current.narration} progress={speechProgress} /> : current.narration}
            </p>
            <button
              onClick={() => speak(current.narration)}
              aria-label="Read aloud"
              title="Read aloud"
              style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
            >
              {speaking ? "⏸️" : "🔊"}
            </button>
          </div>

          {message && <p style={{ color: "var(--crayon)", fontWeight: 600, margin: 0 }}>{message}</p>}

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? (
              phase === "illustrating"
                ? <LoadingIndicator emoji="🖍️" label="painting your scene" />
                : <LoadingIndicator emoji="✨" label="thinking" />
            ) : (
              <>
                {current.choices.map((c, i) => (
                  <motion.button
                    key={c.id}
                    onClick={() => onAction(c.label)}
                    style={choiceStyle}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.28 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {c.label}
                  </motion.button>
                ))}
                <motion.button
                  onClick={onDraw}
                  style={{ ...choiceStyle, background: "var(--sky)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: current.choices.length * 0.08, duration: 0.28 }}
                  whileTap={{ scale: 0.97 }}
                >
                  ✏️ Draw something
                </motion.button>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitText()}
                    placeholder="or do something else…"
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "2px solid #e0cba0", fontSize: 16 }}
                  />
                  <button onClick={submitText} style={{ ...choiceStyle, padding: "10px 16px" }}>Go</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
