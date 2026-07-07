"use client";
import { useEffect, useMemo, useState } from "react";
import type { StoryState } from "@/lib/storyState";
import { compositeScene } from "@/lib/composite";
import { renderCoverPng, dataUrlToFile } from "@/lib/cover";

const W = 1024;
const H = 1024;

export function StorybookExport({ state }: { state: StoryState }) {
  const [scenes, setScenes] = useState<(string | null)[]>([]);
  const [title, setTitle] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const subtitle = useMemo(
    () => `${state.beats.length} page${state.beats.length === 1 ? "" : "s"} · ${state.characters.length > 0 ? `featuring ${state.characters.slice(0, 3).join(", ")}` : "a tale you drew yourself"}`,
    [state]
  );
  const displayTitle = title ?? state.premise;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls = await Promise.all(
        state.beats.map(async (b) => {
          try {
            if (!b.imageUrl && !b.drawingUrl) return null;
            // Skip the overlay when the AI already painted the sketch into the page.
            const overlay = b.drawingIntegrated ? null : b.drawingUrl ?? null;
            return await compositeScene(b.imageUrl ?? null, overlay, W, H, b.drawingPlacement);
          } catch {
            return b.imageUrl ?? null;
          }
        })
      );
      if (!cancelled) setScenes(urls);
    })();
    return () => { cancelled = true; };
  }, [state]);

  // Ask the model for a whimsical book title once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const excerpt = state.beats.slice(0, 3).map((b) => b.narration).join(" ");
        const res = await fetch("/api/title", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ premise: state.premise, excerpt }),
        });
        const j = (await res.json()) as { title?: string | null };
        if (!cancelled && j.title) setTitle(j.title);
      } catch {
        /* keep the premise as the title */
      }
    })();
    return () => { cancelled = true; };
  }, [state]);

  const share = async () => {
    setShareNote(null);
    const seedUrl = `${window.location.origin}/play?seed=${encodeURIComponent(state.premise)}`;
    const cover = await renderCoverPng({ title: displayTitle, subtitle, sceneUrl: scenes[0] ?? null });
    const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };

    // Best: native share sheet with the cover image.
    if (cover) {
      const file = dataUrlToFile(cover, "inkling-cover.png");
      if (nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: displayTitle, text: `“${displayTitle}” — a story we drew with Inkling. Make your own:`, url: seedUrl });
          return;
        } catch {
          /* user cancelled or share failed — fall through to download */
        }
      }
    }
    // Fallback: download the cover + copy a link to start the same story.
    if (cover) {
      const a = document.createElement("a");
      a.href = cover;
      a.download = "inkling-cover.png";
      a.click();
    }
    try {
      await navigator.clipboard.writeText(seedUrl);
      setShareNote("Cover saved · story link copied to clipboard!");
    } catch {
      setShareNote("Cover saved to your downloads!");
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/" style={{ background: "#fff", color: "var(--ink)", border: "2px solid #e0cba0", borderRadius: 14, padding: "12px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
          ✨ New story
        </a>
        <button
          onClick={share}
          style={{ background: "var(--sky)", color: "var(--ink)", border: "none", borderRadius: 14, padding: "12px 22px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-soft)" }}
        >
          📤 Share our book
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-soft)" }}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>
      {shareNote && <p className="no-print" style={{ color: "var(--crayon)", fontWeight: 600, margin: 0 }}>{shareNote}</p>}

      {/* cover */}
      <div className="book-page" style={{ position: "relative", width: "min(680px, 94vw)", background: "#fff", borderRadius: 20, boxShadow: "var(--shadow-lift), 0 0 0 8px #fff, 0 0 0 10px rgba(224,203,160,0.55)", padding: "56px 40px", textAlign: "center", overflow: "hidden" }}>
        {scenes[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scenes[0] as string} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.16 }} />
        )}
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: "#a08b6a", margin: 0 }}>An Inkling Story</p>
          <h1 className="font-display" style={{ fontSize: "clamp(34px, 6vw, 52px)", color: "var(--crayon)", marginTop: 12, marginBottom: 8, textTransform: "capitalize", lineHeight: 1.05 }}>{displayTitle}</h1>
          <p style={{ color: "#8a7860", margin: 0 }}>{subtitle}</p>
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

      {/* sketchbook: the child's raw drawings next to the pages they became */}
      {state.beats.some((b) => b.drawingUrl) && (
        <div className="book-page" style={{ width: "min(680px, 94vw)", background: "#fff", borderRadius: 18, boxShadow: "var(--shadow-soft)", padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ textAlign: "center" }}>
            <h2 className="font-display" style={{ fontSize: 28, color: "var(--crayon)", margin: 0 }}>✏️ The Sketchbook</h2>
            <p style={{ color: "#8a7860", margin: "4px 0 0", fontSize: 14 }}>Every masterpiece starts with a doodle — here&apos;s what you drew, and what it became.</p>
          </div>
          {state.beats.map((b, i) =>
            b.drawingUrl ? (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.drawingUrl} alt={`sketch for page ${i + 1}`} style={{ width: "38%", aspectRatio: "1", objectFit: "contain", borderRadius: 12, background: "var(--cream)", border: "2px dashed #e0cba0" }} />
                <span style={{ fontSize: 26 }} aria-hidden>➜</span>
                {scenes[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scenes[i] as string} alt={`page ${i + 1}`} style={{ width: "38%", borderRadius: 12 }} />
                ) : (
                  <div style={{ width: "38%", aspectRatio: "1", borderRadius: 12, background: "var(--cream)" }} />
                )}
                <span className="font-display" style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#a08b6a", whiteSpace: "nowrap" }}>page {i + 1}</span>
              </div>
            ) : null
          )}
        </div>
      )}

      <p className="no-print" style={{ color: "#a08b6a", fontSize: 14 }}>The End ✨ made with Inkling</p>
    </div>
  );
}
