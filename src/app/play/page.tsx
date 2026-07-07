"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useStory } from "@/hooks/useStory";
import { useSpeech } from "@/hooks/useSpeech";
import { useSoundscape } from "@/hooks/useSoundscape";
import { StorybookCanvas } from "@/components/StorybookCanvas";
import { StorybookExport } from "@/components/StorybookExport";
import type { DrawingLayerHandle } from "@/components/DrawingLayer";
import type { Hotspot } from "@/components/SceneHotspots";
import { compositeScene, type Placement } from "@/lib/composite";

const SCENE = 1024;

function PlayInner() {
  const searchParams = useSearchParams();
  const { state, current, phase, loading, message, start, takeTurn } = useStory();
  const { speak, stop, speaking, progress: speechProgress, spokenText } = useSpeech();
  const { soundOn, toggleSound, chime, sparkle } = useSoundscape(phase);
  const drawingRef = useRef<DrawingLayerHandle>(null);
  const started = useRef(false);
  const lastNarrated = useRef<string | null>(null);
  const pendingReveal = useRef(false);
  const [finished, setFinished] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawDescription, setDrawDescription] = useState("");
  const [placingDrawing, setPlacingDrawing] = useState<string | null>(null);
  const [stagedDrawing, setStagedDrawing] = useState<string | null>(null);
  const [stagedPlacement, setStagedPlacement] = useState<Placement | null>(null);
  const [stagedDescription, setStagedDescription] = useState<string | null>(null);
  const [sceneOverride, setSceneOverride] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const seed = searchParams.get("seed");
    if (seed) start(seed);
  }, [searchParams, start]);

  // When a fresh page arrives, ring a soft chime and (if voice is on) read it aloud.
  useEffect(() => {
    const narration = current?.narration;
    if (!narration || loading || lastNarrated.current === narration) return;
    lastNarrated.current = narration;
    chime();
    if (voiceOn) speak(narration);
    if (pendingReveal.current) {
      pendingReveal.current = false;
      sparkle();
      setReveal(true);
      window.setTimeout(() => setReveal(false), 1900);
    }
  }, [current?.narration, loading, voiceOn, chime, speak, sparkle]);

  const displayScene = sceneOverride ?? current?.sceneUrl ?? current?.imageUrl ?? null;

  // Find poke-able characters in each fresh illustration (non-blocking).
  useEffect(() => {
    const scene = current?.sceneUrl ?? current?.imageUrl;
    setHotspots([]);
    if (!scene || !scene.startsWith("data:image")) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/hotspots", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ imageDataUrl: scene }),
        });
        const j = (await r.json()) as { hotspots?: Hotspot[] };
        if (!cancelled && j.hotspots) setHotspots(j.hotspots);
      } catch {
        /* picture just isn't poke-able this page */
      }
    })();
    return () => { cancelled = true; };
  }, [current?.sceneUrl, current?.imageUrl]);

  const toggleVoice = () => {
    setVoiceOn((v) => {
      if (v) stop();
      return !v;
    });
  };

  const toggleBtnStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.7)", color: "var(--ink)",
    border: "1px solid rgba(224,203,160,0.6)", fontSize: 19, cursor: "pointer", lineHeight: 1,
  };

  const cancelDraw = () => {
    drawingRef.current?.clear();
    setDrawDescription("");
    setDrawerOpen(false);
  };

  // Leave the drawer and pick the drawing up as a movable sticker on the scene.
  const startPlacement = () => {
    const png = drawingRef.current?.exportPng() ?? null;
    if (!png) {
      setDrawDescription("");
      setDrawerOpen(false);
      return;
    }
    setPlacingDrawing(png);
    setDrawerOpen(false);
  };

  const cancelPlacement = () => {
    setPlacingDrawing(null);
    setDrawDescription("");
    drawingRef.current?.clear();
  };

  // Stamp the sticker into the visible scene at the chosen spot/size, and stage
  // it (with its placement + description) for the next chosen action.
  const confirmPlacement = async (placement: Placement) => {
    const png = placingDrawing;
    if (!png) return;
    const base = sceneOverride ?? current?.sceneUrl ?? current?.imageUrl ?? null;
    try {
      const merged = await compositeScene(base, png, SCENE, SCENE, placement);
      setSceneOverride(merged);
    } catch {
      /* keep the previous scene if compositing fails; drawing is still staged */
    }
    setStagedDrawing(png);
    setStagedPlacement(placement);
    setStagedDescription(drawDescription.trim() || null);
    setPlacingDrawing(null);
    setDrawDescription("");
    drawingRef.current?.clear();
    sparkle();
  };

  const handleAction = async (action: string) => {
    if (loading) return;
    pendingReveal.current = stagedDrawing !== null;
    await takeTurn({
      action,
      drawingPng: stagedDrawing,
      drawingDescription: stagedDescription,
      placement: stagedPlacement,
    });
    setStagedDrawing(null);
    setStagedPlacement(null);
    setStagedDescription(null);
    setSceneOverride(null);
    drawingRef.current?.clear();
  };

  if (finished && state) return <StorybookExport state={state} />;

  return (
    <>
      <StorybookCanvas
        current={current}
        phase={phase}
        loading={loading}
        message={message}
        displayScene={displayScene}
        hasStagedDrawing={stagedDrawing !== null}
        drawingRef={drawingRef}
        drawerOpen={drawerOpen}
        drawDescription={drawDescription}
        placingDrawing={placingDrawing}
        sparkleKey={current?.narration ?? null}
        characters={state?.characters ?? []}
        pageNumber={state?.beats.length ?? 0}
        reveal={reveal}
        hotspots={sceneOverride ? [] : hotspots}
        onPoke={chime}
        onOpenDraw={() => setDrawerOpen(true)}
        onStartPlacement={startPlacement}
        onCancelDraw={cancelDraw}
        onDrawDescriptionChange={setDrawDescription}
        onConfirmPlacement={confirmPlacement}
        onCancelPlacement={cancelPlacement}
        onAction={handleAction}
        speak={speak}
        speaking={speaking}
        speechProgress={speechProgress}
        spokenText={spokenText}
      />
      <div className="no-print glass fixed-controls" style={{ position: "fixed", top: 16, left: 16, display: "flex", gap: 6, zIndex: 10, padding: 6, borderRadius: 16, boxShadow: "var(--shadow-soft)" }}>
        <a href="/" title="Home" aria-label="Home" style={{ ...toggleBtnStyle, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>🏠</a>
        <button onClick={toggleSound} title={soundOn ? "Turn music off" : "Turn music on"} aria-label="Toggle music" style={toggleBtnStyle}>
          {soundOn ? "🔊" : "🔇"}
        </button>
        <button onClick={toggleVoice} title={voiceOn ? "Turn narration off" : "Turn narration on"} aria-label="Toggle narration" style={toggleBtnStyle}>
          {voiceOn ? "🗣️" : "🤫"}
        </button>
      </div>
      {state && state.beats.length > 0 && (
        <motion.button
          className="no-print finish-btn"
          onClick={() => setFinished(true)}
          aria-label="Finish and make my book"
          title="Finish and make my book"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          style={{ position: "fixed", top: 16, right: 16, background: "var(--crayon)", color: "#fff", border: "none", borderRadius: 14, padding: "11px 18px", fontWeight: 700, cursor: "pointer", zIndex: 10, boxShadow: "var(--shadow-soft)" }}
        >
          <span aria-hidden>📖</span>
          <span className="finish-label">&nbsp;Finish &amp; make my book</span>
        </motion.button>
      )}
    </>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Opening your book…</div>}>
      <PlayInner />
    </Suspense>
  );
}
