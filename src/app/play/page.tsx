"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStory } from "@/hooks/useStory";
import { useSpeech } from "@/hooks/useSpeech";
import { StorybookCanvas } from "@/components/StorybookCanvas";
import { StorybookExport } from "@/components/StorybookExport";
import type { DrawingLayerHandle } from "@/components/DrawingLayer";
import { compositeScene, type Placement } from "@/lib/composite";

const SCENE = 1024;

function PlayInner() {
  const searchParams = useSearchParams();
  const { state, current, phase, loading, message, start, takeTurn } = useStory();
  const { speak, speaking } = useSpeech();
  const drawingRef = useRef<DrawingLayerHandle>(null);
  const started = useRef(false);
  const [finished, setFinished] = useState(false);
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

  const displayScene = sceneOverride ?? current?.sceneUrl ?? current?.imageUrl ?? null;

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
