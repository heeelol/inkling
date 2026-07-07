"use client";
import { useState } from "react";
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
};

const choiceStyle: React.CSSProperties = {
  background: "var(--sunny)", color: "var(--ink)", border: "3px solid #fff",
  borderRadius: 16, padding: "12px 18px", fontSize: 17, fontWeight: 700, cursor: "pointer",
  boxShadow: "0 3px 0 rgba(0,0,0,0.08)", textAlign: "left",
};

export function NarrationPanel({ current, phase, loading, message, onAction, onDraw, speak, speaking }: Props) {
  const [text, setText] = useState("");
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
            <p style={{ fontSize: 22, lineHeight: 1.6, color: "var(--ink)", fontFamily: "Georgia, serif", margin: 0 }}>
              {current.narration}
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
                {current.choices.map((c) => (
                  <button key={c.id} onClick={() => onAction(c.label)} style={choiceStyle}>
                    {c.label}
                  </button>
                ))}
                <button onClick={onDraw} style={{ ...choiceStyle, background: "var(--sky)" }}>
                  ✏️ Draw something
                </button>
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
