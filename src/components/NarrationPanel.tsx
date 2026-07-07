"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { LoadingIndicator } from "./LoadingIndicator";
import { activeTokenIndex, tokenize, isSpace } from "@/lib/karaoke";
import type { Beat } from "@/lib/storyState";

type Props = {
  current: Beat | null;
  phase: "idle" | "thinking" | "illustrating";
  loading: boolean;
  message: string | null;
  ownedItems: string[]; // lower-cased names in the bag
  onAction: (action: string) => void;
  speak: (t: string) => void;
  speaking: boolean;
  speechProgress: number;
  spokenText: string | null;
};

// Karaoke-style narration: which word is being read right now (lib/karaoke).
function KaraokeText({ text, progress }: { text: string; progress: number }) {
  const tokens = tokenize(text);
  const active = activeTokenIndex(text, progress);
  return (
    <span>
      {tokens.map((tk, i) => {
        if (isSpace(tk)) return <span key={i}>{tk}</span>;
        const isActive = i === active;
        const isPast = active !== -1 && i < active;
        return (
          <span
            key={i}
            style={{
              background: isActive ? "var(--sunny)" : "transparent",
              borderRadius: 6, padding: isActive ? "0 3px" : 0,
              color: isPast || isActive ? "var(--ink)" : "#8a7860",
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
  background: "var(--paper)", color: "var(--ink)", border: "2px solid rgba(74,58,44,0.35)",
  borderRadius: 14, padding: "12px 18px", fontSize: 16.5, fontWeight: 700, cursor: "pointer",
  boxShadow: "0 3px 0 rgba(0,0,0,0.15)", textAlign: "left",
};

export function NarrationPanel({ current, phase, loading, message, ownedItems, onAction, speak, speaking, speechProgress, spokenText }: Props) {
  const [text, setText] = useState("");
  const karaoke = speaking && spokenText === current?.narration;
  const owns = (name?: string | null) => !name || ownedItems.includes(name.toLowerCase());

  const submitText = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    onAction(t);
  };

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", height: "100%", gap: 16, boxSizing: "border-box" }}>
      {!current && loading && <p className="font-display" style={{ fontSize: 22 }}>🕯️ Your saga begins…</p>}

      {!current && !loading && message && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ color: "var(--crayon)", fontWeight: 700, fontSize: 20, margin: 0 }}>{message}</p>
          <p style={{ color: "#a08b6a", margin: 0 }}>Try a different path.</p>
        </div>
      )}

      {current && (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <p style={{ fontSize: 21, lineHeight: 1.7, color: "var(--ink)", fontFamily: "Georgia, serif", margin: 0 }}>
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
                ? <LoadingIndicator emoji="🎨" label="conjuring the scene" />
                : <LoadingIndicator emoji="🕯️" label="the fates weave" />
            ) : (
              <>
                {current.choices.map((c, i) => {
                  const locked = !owns(c.requiresItem);
                  return (
                    <motion.button
                      key={c.id}
                      onClick={() => !locked && onAction(c.label)}
                      disabled={locked}
                      title={locked ? `Requires: ${c.requiresItem}` : undefined}
                      style={{ ...choiceStyle, opacity: locked ? 0.55 : 1, cursor: locked ? "not-allowed" : "pointer" }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: locked ? 0.55 : 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.28 }}
                      whileTap={locked ? undefined : { scale: 0.97 }}
                    >
                      {c.label}
                      {c.requiresItem && (
                        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: locked ? "var(--crayon)" : "#5f8a5f" }}>
                          {locked ? `🔒 needs ${c.requiresItem}` : `✓ ${c.requiresItem}`}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitText()}
                    placeholder="…or forge your own path"
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "2px solid rgba(74,58,44,0.35)", fontSize: 16, background: "var(--paper)", color: "var(--ink)" }}
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
