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
    <div style={{ minHeight: "100vh", padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div className="no-print" style={{ display: "flex", gap: 10 }}>
        <a href="/" style={{ background: "#fff", color: "var(--ink)", border: "2px solid #e0cba0", borderRadius: 14, padding: "12px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
          ✨ New story
        </a>
        <button
          onClick={() => window.print()}
          style={{ background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-soft)" }}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* cover */}
      <div className="book-page" style={{ position: "relative", width: "min(680px, 94vw)", background: "#fff", borderRadius: 20, boxShadow: "var(--shadow-lift), 0 0 0 8px #fff, 0 0 0 10px rgba(224,203,160,0.55)", padding: "56px 40px", textAlign: "center", overflow: "hidden" }}>
        {scenes[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scenes[0] as string} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.16 }} />
        )}
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: "#a08b6a", margin: 0 }}>An Inkling Story</p>
          <h1 className="font-display" style={{ fontSize: "clamp(34px, 6vw, 52px)", color: "var(--crayon)", marginTop: 12, marginBottom: 8, textTransform: "capitalize", lineHeight: 1.05 }}>{state.premise}</h1>
          <p style={{ color: "#8a7860", margin: 0 }}>{state.beats.length} pages · {state.characters.length > 0 ? `featuring ${state.characters.slice(0, 3).join(", ")}` : "a tale you drew yourself"}</p>
        </div>
      </div>

      {state.beats.map((b, i) => (
        <div className="book-page" key={i} style={{ width: "min(680px, 94vw)", background: "#fff", borderRadius: 18, boxShadow: "var(--shadow-soft)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {scenes[i] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scenes[i] as string} alt="" style={{ width: "100%", borderRadius: 12, display: "block" }} />
          )}
          <p style={{ fontSize: 20, lineHeight: 1.6, color: "var(--ink)", fontFamily: "Georgia, serif", margin: 0 }}>{b.narration}</p>
          <div className="font-display" style={{ alignSelf: "flex-end", fontSize: 13, fontWeight: 700, color: "#a08b6a" }}>— {i + 1} —</div>
        </div>
      ))}

      <p className="no-print" style={{ color: "#a08b6a", fontSize: 14 }}>The End ✨ made with Inkling</p>
    </div>
  );
}
