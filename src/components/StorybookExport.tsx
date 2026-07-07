"use client";
import { useEffect, useState } from "react";
import type { StoryState } from "@/lib/storyState";
import { compositeScene } from "@/lib/composite";

const W = 1024;
const H = 1024;

export function StorybookExport({ state }: { state: StoryState }) {
  const [scenes, setScenes] = useState<(string | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls = await Promise.all(
        state.beats.map(async (b) => {
          try {
            if (!b.imageUrl && !b.drawingUrl) return null;
            return await compositeScene(b.imageUrl ?? null, b.drawingUrl ?? null, W, H, b.drawingPlacement);
          } catch {
            return b.imageUrl ?? null;
          }
        })
      );
      if (!cancelled) setScenes(urls);
    })();
    return () => {
      cancelled = true;
    };
  }, [state]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <button
        className="no-print"
        onClick={() => window.print()}
        style={{ background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 17, fontWeight: 700, cursor: "pointer" }}
      >
        🖨️ Print / Save as PDF
      </button>

      <div className="book-page" style={{ width: "min(680px, 94vw)", background: "#fff", borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.12)", padding: 40, textAlign: "center" }}>
        <p style={{ fontSize: 15, letterSpacing: 2, textTransform: "uppercase", color: "#a08b6a", margin: 0 }}>An Inkling Story</p>
        <h1 style={{ fontSize: 40, color: "var(--crayon)", fontFamily: "Georgia, serif", marginTop: 12, textTransform: "capitalize" }}>{state.premise}</h1>
      </div>

      {state.beats.map((b, i) => (
        <div className="book-page" key={i} style={{ width: "min(680px, 94vw)", background: "#fff", borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.12)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {scenes[i] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scenes[i] as string} alt="" style={{ width: "100%", borderRadius: 12, display: "block" }} />
          )}
          <p style={{ fontSize: 20, lineHeight: 1.6, color: "var(--ink)", fontFamily: "Georgia, serif", margin: 0 }}>{b.narration}</p>
        </div>
      ))}
    </div>
  );
}
