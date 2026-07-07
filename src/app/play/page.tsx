"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useStory } from "@/hooks/useStory";
import { useSpeech } from "@/hooks/useSpeech";
import { useSoundscape } from "@/hooks/useSoundscape";
import { StorybookCanvas } from "@/components/StorybookCanvas";
import { StorybookExport } from "@/components/StorybookExport";
import { InventoryBag } from "@/components/InventoryBag";
import type { Hotspot } from "@/components/SceneHotspots";

function PlayInner() {
  const searchParams = useSearchParams();
  const {
    state, current, phase, loading, message, pending,
    start, takeTurn, moveItem, placePending, discardPending, dropItem, useItem,
  } = useStory();
  const { speak, stop, speaking, progress: speechProgress, spokenText } = useSpeech();
  const { soundOn, toggleSound, chime, sparkle } = useSoundscape(phase);
  const started = useRef(false);
  const lastNarrated = useRef<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [bagOpen, setBagOpen] = useState(false);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const seed = searchParams.get("seed");
    if (seed) start(seed);
  }, [searchParams, start]);

  // New page: chime, auto-narrate, sparkle when loot arrived.
  useEffect(() => {
    const narration = current?.narration;
    if (!narration || loading || lastNarrated.current === narration) return;
    lastNarrated.current = narration;
    chime();
    if (voiceOn) speak(narration);
    if (message?.startsWith("🎒")) sparkle();
  }, [current?.narration, loading, voiceOn, chime, speak, sparkle, message]);

  // Auto-open the bag when loot needs manual packing.
  useEffect(() => {
    if (pending.length > 0) setBagOpen(true);
  }, [pending.length]);

  const displayScene = current?.imageUrl ?? null;

  // Find poke-able characters in each fresh illustration (non-blocking).
  useEffect(() => {
    setHotspots([]);
    if (!displayScene?.startsWith("data:image")) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/hotspots", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ imageDataUrl: displayScene }),
        });
        const j = (await r.json()) as { hotspots?: Hotspot[] };
        if (!cancelled && j.hotspots) setHotspots(j.hotspots);
      } catch { /* not poke-able this page */ }
    })();
    return () => { cancelled = true; };
  }, [displayScene]);

  const toggleVoice = () => {
    setVoiceOn((v) => {
      if (v) stop();
      return !v;
    });
  };

  const handleAction = (action: string) => {
    if (loading) return;
    void takeTurn({ action });
  };

  const toggleBtnStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 12, background: "rgba(244,234,213,0.75)", color: "var(--ink)",
    border: "1px solid rgba(212,169,78,0.5)", fontSize: 19, cursor: "pointer", lineHeight: 1,
  };

  if (finished && state) return <StorybookExport state={state} />;

  const ownedItems = (state?.bag ?? []).map((p) => p.item.name.toLowerCase());

  return (
    <>
      <StorybookCanvas
        current={current}
        phase={phase}
        loading={loading}
        message={message}
        displayScene={displayScene}
        sparkleKey={current?.narration ?? null}
        characters={state?.characters ?? []}
        pageNumber={state?.beats.length ?? 0}
        hotspots={hotspots}
        ownedItems={ownedItems}
        onPoke={chime}
        onAction={handleAction}
        speak={speak}
        speaking={speaking}
        speechProgress={speechProgress}
        spokenText={spokenText}
      />

      <div className="no-print glass fixed-controls" style={{ position: "fixed", top: 16, left: 16, display: "flex", gap: 6, zIndex: 10, padding: 6, borderRadius: 16, boxShadow: "var(--shadow-soft)" }}>
        <a href="/" title="Home" aria-label="Home" style={{ ...toggleBtnStyle, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>🏰</a>
        <button onClick={toggleSound} title={soundOn ? "Music off" : "Music on"} aria-label="Toggle music" style={toggleBtnStyle}>
          {soundOn ? "🔊" : "🔇"}
        </button>
        <button onClick={toggleVoice} title={voiceOn ? "Narration off" : "Narration on"} aria-label="Toggle narration" style={toggleBtnStyle}>
          {voiceOn ? "🗣️" : "🤫"}
        </button>
      </div>

      {/* bag */}
      <motion.button
        className="no-print"
        onClick={() => setBagOpen((o) => !o)}
        whileTap={{ scale: 0.95 }}
        aria-label="Open bag"
        style={{
          position: "fixed", right: 16, bottom: 16, zIndex: 30, width: 56, height: 56, borderRadius: 18,
          background: "var(--crayon)", border: "2px solid rgba(212,169,78,0.7)", fontSize: 26, cursor: "pointer",
          boxShadow: "var(--shadow-lift)",
        }}
      >
        🎒
        {(pending.length > 0 || (state?.bag.length ?? 0) > 0) && (
          <span style={{
            position: "absolute", top: -6, right: -6, minWidth: 22, height: 22, borderRadius: 999, padding: "0 5px",
            background: pending.length > 0 ? "#b33939" : "var(--sunny)", color: pending.length > 0 ? "#fff" : "var(--ink)",
            fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {pending.length > 0 ? "!" : state?.bag.length}
          </span>
        )}
      </motion.button>
      <AnimatePresence>
        {bagOpen && state && (
          <InventoryBag
            bag={state.bag}
            pending={pending}
            disabled={loading}
            onMove={moveItem}
            onPlacePending={placePending}
            onDiscardPending={discardPending}
            onUse={useItem}
            onDrop={dropItem}
            onClose={() => setBagOpen(false)}
          />
        )}
      </AnimatePresence>

      {state && state.beats.length > 0 && (
        <motion.button
          className="no-print finish-btn"
          onClick={() => setFinished(true)}
          aria-label="Finish and bind my saga"
          title="Finish and bind my saga"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          style={{ position: "fixed", top: 16, right: 16, background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "11px 18px", fontWeight: 700, cursor: "pointer", zIndex: 10, boxShadow: "var(--shadow-soft)" }}
        >
          <span aria-hidden>📜</span>
          <span className="finish-label">&nbsp;Bind my saga</span>
        </motion.button>
      )}
    </>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Opening the tome…</div>}>
      <PlayInner />
    </Suspense>
  );
}
