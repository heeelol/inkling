"use client";
import { useEffect, useMemo, useState } from "react";
import type { StoryState } from "@/lib/storyState";
import { renderCoverPng, dataUrlToFile } from "@/lib/cover";

export function StorybookExport({ state }: { state: StoryState }) {
  const [title, setTitle] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const scenes = useMemo(() => state.beats.map((b) => b.imageUrl ?? null), [state]);
  const subtitle = useMemo(
    () => `${state.beats.length} chapter${state.beats.length === 1 ? "" : "s"} · ${state.characters.length > 0 ? `featuring ${state.characters.slice(0, 3).join(", ")}` : "a legend of your own making"}`,
    [state]
  );
  const displayTitle = title ?? state.premise;

  // Ask the model for an epic saga title once.
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
      } catch { /* keep the premise */ }
    })();
    return () => { cancelled = true; };
  }, [state]);

  const share = async () => {
    setShareNote(null);
    const seedUrl = `${window.location.origin}/play?seed=${encodeURIComponent(state.premise)}`;
    const cover = await renderCoverPng({ title: displayTitle, subtitle, sceneUrl: scenes[0] ?? null });
    const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };

    if (cover) {
      const file = dataUrlToFile(cover, "inkling-saga.png");
      if (nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: displayTitle, text: `“${displayTitle}” — a saga forged in Inkling. Forge your own:`, url: seedUrl });
          return;
        } catch { /* cancelled — fall through */ }
      }
      const a = document.createElement("a");
      a.href = cover;
      a.download = "inkling-saga.png";
      a.click();
    }
    try {
      await navigator.clipboard.writeText(seedUrl);
      setShareNote("Cover saved · saga link copied to clipboard!");
    } catch {
      setShareNote("Cover saved to your downloads!");
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/" style={{ background: "var(--paper)", color: "var(--ink)", border: "2px solid rgba(212,169,78,0.5)", borderRadius: 14, padding: "12px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
          ⚔️ New saga
        </a>
        <button onClick={share} style={{ background: "var(--sky)", color: "var(--ink)", border: "none", borderRadius: 14, padding: "12px 22px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-soft)" }}>
          📤 Share the tale
        </button>
        <button onClick={() => window.print()} style={{ background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-soft)" }}>
          🖨️ Print / Save as PDF
        </button>
      </div>
      {shareNote && <p className="no-print" style={{ color: "var(--sunny)", fontWeight: 600, margin: 0 }}>{shareNote}</p>}

      {/* cover */}
      <div className="book-page" style={{ position: "relative", width: "min(680px, 94vw)", background: "var(--paper)", borderRadius: 20, boxShadow: "var(--shadow-lift), 0 0 0 8px #2b2018, 0 0 0 10px rgba(212,169,78,0.5)", padding: "56px 40px", textAlign: "center", overflow: "hidden" }}>
        {scenes[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scenes[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18 }} />
        )}
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: "#8a7455", margin: 0 }}>An Inkling Saga</p>
          <h1 className="font-display" style={{ fontSize: "clamp(34px, 6vw, 52px)", color: "var(--crayon)", marginTop: 12, marginBottom: 8, textTransform: "capitalize", lineHeight: 1.1 }}>{displayTitle}</h1>
          <p style={{ color: "#6d5c42", margin: 0 }}>{subtitle}</p>
        </div>
      </div>

      {state.beats.map((b, i) => (
        <div className="book-page" key={i} style={{ width: "min(680px, 94vw)", background: "var(--paper)", borderRadius: 18, boxShadow: "var(--shadow-soft)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {scenes[i] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scenes[i]!} alt="" style={{ width: "100%", borderRadius: 12, display: "block" }} />
          )}
          <p style={{ fontSize: 20, lineHeight: 1.6, color: "var(--ink)", fontFamily: "Georgia, serif", margin: 0 }}>{b.narration}</p>
          <div className="font-display" style={{ alignSelf: "flex-end", fontSize: 13, fontWeight: 700, color: "#8a7455" }}>— {i + 1} —</div>
        </div>
      ))}

      {/* chronicle: everything the saga remembers */}
      {state.events.length > 0 && (
        <div className="book-page" style={{ width: "min(680px, 94vw)", background: "var(--paper)", borderRadius: 18, boxShadow: "var(--shadow-soft)", padding: 28, color: "var(--ink)" }}>
          <h2 className="font-display" style={{ fontSize: 26, color: "var(--crayon)", margin: 0, textAlign: "center" }}>📜 The Chronicle</h2>
          <ul style={{ margin: "12px 0 0", paddingLeft: 22, lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
            {state.events.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <p className="no-print" style={{ color: "#8a7455", fontSize: 14 }}>Thus ends the tale ⚔️ forged with Inkling</p>
    </div>
  );
}
