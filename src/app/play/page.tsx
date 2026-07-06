"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStory } from "@/hooks/useStory";
import { useSpeech } from "@/hooks/useSpeech";
import { StorybookCanvas } from "@/components/StorybookCanvas";
import { StorybookExport } from "@/components/StorybookExport";
import type { DrawingLayerHandle } from "@/components/DrawingLayer";
import { compositeScene } from "@/lib/composite";

const SCENE = 1024;

function PlayInner() {
  const searchParams = useSearchParams();
  const { state, current, phase, loading, message, start, takeTurn } = useStory();
  const { speak, speaking } = useSpeech();
  const drawingRef = useRef<DrawingLayerHandle>(null);
  const started = useRef(false);
  const [finished, setFinished] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stagedDrawing, setStagedDrawing] = useState<string | null>(null);
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
    setDrawerOpen(false);
  };

  // Composite the current sketch onto the visible scene now (no story turn),
  // and stage it so the next chosen action sends it to the story.
  const integrate = async () => {
    const png = drawingRef.current?.exportPng() ?? null;
    if (!png) {
      setDrawerOpen(false);
      return;
    }
    const base = sceneOverride ?? current?.sceneUrl ?? current?.imageUrl ?? null;
    try {
      const merged = await compositeScene(base, png, SCENE, SCENE);
      setSceneOverride(merged);
    } catch {
      /* keep the previous scene if compositing fails; drawing is still staged */
    }
    setStagedDrawing(png);
    drawingRef.current?.clear();
    setDrawerOpen(false);
  };

  const handleAction = async (action: string) => {
    if (loading) return;
    await takeTurn({ action, drawingPng: stagedDrawing });
    setStagedDrawing(null);
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
        onOpenDraw={() => setDrawerOpen(true)}
        onIntegrate={integrate}
        onCancelDraw={cancelDraw}
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
