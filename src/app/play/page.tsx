"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStory } from "@/hooks/useStory";
import { useSpeech } from "@/hooks/useSpeech";
import { useSoundscape } from "@/hooks/useSoundscape";
import { StorybookCanvas } from "@/components/StorybookCanvas";
import { StorybookExport } from "@/components/StorybookExport";
import type { DrawingLayerHandle } from "@/components/DrawingLayer";
import { compositeScene, type Placement } from "@/lib/composite";

const SCENE = 1024;

function PlayInner() {
  const searchParams = useSearchParams();
  const { state, current, phase, loading, message, start, takeTurn } = useStory();
  const { speak, stop, speaking } = useSpeech();
  const { soundOn, toggleSound, chime, sparkle } = useSoundscape(phase);
  const drawingRef = useRef<DrawingLayerHandle>(null);
  const started = useRef(false);
  const lastNarrated = useRef<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawDescription, setDrawDescription] = useState("");
  const [placingDrawing, setPlacingDrawing] = useState<string | null>(null);
  const [stagedDrawing, setStagedDrawing] = useState<string | null>(null);
  const [stagedPlacement, setStagedPlacement] = useState<Placement | null>(null);
  const [stagedDescription, setStagedDescription] = useState<string | null>(null);
  const [sceneOverride, setSceneOverride] = useState<string | null>(null);

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
  }, [current?.narration, loading, voiceOn, chime, speak]);

  const displayScene = sceneOverride ?? current?.sceneUrl ?? current?.imageUrl ?? null;

  const toggleVoice = () => {
    setVoiceOn((v) => {
      if (v) stop();
      return !v;
    });
  };

  const toggleBtnStyle: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 12, background: "#fff", color: "var(--ink)",
    border: "3px solid var(--sunny)", fontSize: 18, cursor: "pointer", lineHeight: 1,
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
        onOpenDraw={() => setDrawerOpen(true)}
        onStartPlacement={startPlacement}
        onCancelDraw={cancelDraw}
        onDrawDescriptionChange={setDrawDescription}
        onConfirmPlacement={confirmPlacement}
        onCancelPlacement={cancelPlacement}
        onAction={handleAction}
        speak={speak}
        speaking={speaking}
      />
      <div className="no-print" style={{ position: "fixed", top: 16, left: 16, display: "flex", gap: 8, zIndex: 10 }}>
        <button onClick={toggleSound} title={soundOn ? "Turn music off" : "Turn music on"} aria-label="Toggle music" style={toggleBtnStyle}>
          {soundOn ? "🔊" : "🔇"}
        </button>
        <button onClick={toggleVoice} title={voiceOn ? "Turn narration off" : "Turn narration on"} aria-label="Toggle narration" style={toggleBtnStyle}>
          {voiceOn ? "🗣️" : "🤫"}
        </button>
      </div>
      {state && state.beats.length > 0 && (
        <button
          className="no-print"
          onClick={() => setFinished(true)}
          style={{ position: "fixed", top: 16, right: 16, background: "#fff", color: "var(--ink)", border: "3px solid var(--sunny)", borderRadius: 14, padding: "10px 16px", fontWeight: 700, cursor: "pointer", zIndex: 10 }}
        >
          📖 Finish &amp; make my book
        </button>
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
