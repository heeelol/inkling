"use client";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStory } from "@/hooks/useStory";
import { useSpeech } from "@/hooks/useSpeech";
import { StorybookCanvas } from "@/components/StorybookCanvas";
import type { DrawingLayerHandle } from "@/components/DrawingLayer";

function PlayInner() {
  const searchParams = useSearchParams();
  const { current, phase, loading, message, start, takeTurn } = useStory();
  const { speak, speaking } = useSpeech();
  const drawingRef = useRef<DrawingLayerHandle>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const seed = searchParams.get("seed");
    if (seed) start(seed);
  }, [searchParams, start]);

  const handleAction = async (action: string) => {
    if (loading) return;
    const png = drawingRef.current?.exportPng() ?? null;
    await takeTurn({ action, drawingPng: png });
    drawingRef.current?.clear();
  };

  return (
    <StorybookCanvas
      current={current}
      phase={phase}
      loading={loading}
      message={message}
      drawingRef={drawingRef}
      onAction={handleAction}
      speak={speak}
      speaking={speaking}
    />
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Opening your book…</div>}>
      <PlayInner />
    </Suspense>
  );
}
