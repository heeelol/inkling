"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { StoryState, Beat, initialState, applyDelta, summarize } from "@/lib/storyState";
import { compositeScene, type Placement } from "@/lib/composite";

const STORAGE_KEY = "inkling";
const SCENE_W = 1024;
const SCENE_H = 1024;

type Phase = "idle" | "thinking" | "illustrating";
type CurrentBeat = Beat & { sceneUrl?: string };

type UIState = {
  state: StoryState | null;
  current: CurrentBeat | null;
  phase: Phase;
  loading: boolean;
  message: string | null;
};

// Shape of the JSON envelope returned by /api/story. Fields are optional/unknown
// because the endpoint can also return an error/redirect payload.
type StoryJson = {
  error?: string;
  message?: string;
  narration?: string;
  choices?: Beat["choices"];
  imagePrompt?: string;
  newCharacters?: string[];
  newDrawnItems?: { label: string }[];
};

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function stripForStorage(s: StoryState): StoryState {
  return { ...s, beats: s.beats.map((b) => ({ ...b, imageUrl: undefined, drawingUrl: undefined })) };
}

export function useStory() {
  const [ui, setUi] = useState<UIState>({
    state: null, current: null, phase: "idle", loading: false, message: null,
  });
  const stateRef = useRef<StoryState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoryState;
        stateRef.current = parsed;
        const last = parsed.beats[parsed.beats.length - 1] ?? null;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage after mount is intentional
        setUi((u) => ({ ...u, state: parsed, current: last }));
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const persist = useCallback((s: StoryState) => {
    stateRef.current = s;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripForStorage(s)));
    } catch {
      /* quota / unavailable — session still works in memory */
    }
  }, []);

  const takeTurn = useCallback(
    async ({
      action,
      drawingPng,
      drawingDescription: providedDescription,
      placement,
    }: {
      action: string;
      drawingPng?: string | null;
      drawingDescription?: string | null;
      placement?: Placement | null;
    }) => {
      const base = stateRef.current;
      if (!base) return;
      setUi((u) => ({ ...u, loading: true, phase: "thinking", message: null }));

      let drawingDescription: string | undefined;
      if (drawingPng) {
        // Prefer the child's own words; only ask the vision model when they
        // didn't describe the drawing themselves.
        if (providedDescription) {
          drawingDescription = providedDescription;
        } else {
          try {
            const r = await postJson("/api/interpret-drawing", { imageDataUrl: drawingPng });
            const j = (await r.json()) as { description?: string };
            drawingDescription = j.description;
          } catch {
            drawingDescription = "your drawing";
          }
        }
      }

      let story: StoryJson | undefined;
      try {
        const r = await postJson("/api/story", { summary: summarize(base), action, drawingDescription });
        story = (await r.json()) as StoryJson;
      } catch {
        setUi((u) => ({ ...u, loading: false, phase: "idle", message: "The story got sleepy — try again." }));
        return;
      }
      if (story?.error === "redirect") {
        setUi((u) => ({ ...u, loading: false, phase: "idle", message: story?.message ?? "Let's imagine something friendlier!" }));
        return;
      }
      if (story?.error || !story?.narration) {
        setUi((u) => ({ ...u, loading: false, phase: "idle", message: "The story got sleepy — try again." }));
        return;
      }

      setUi((u) => ({ ...u, phase: "illustrating" }));

      // If the child drew something, hand the sketch (placed where they put it)
      // to the image model as a reference so it repaints their idea into the
      // scene — rather than stamping the raw doodle on top of a polished picture.
      let drawingReference: string | null = null;
      if (drawingPng) {
        try {
          drawingReference = await compositeScene(null, drawingPng, SCENE_W, SCENE_H, placement);
        } catch {
          drawingReference = drawingPng;
        }
      }

      // Hand the previous page to the model so characters/setting stay consistent.
      const previousScene = base.beats[base.beats.length - 1]?.imageUrl ?? null;

      let imageDataUrl: string | null = null;
      try {
        const r = await postJson("/api/illustrate", {
          prompt: story.imagePrompt,
          drawingDataUrl: drawingReference,
          drawingDescription,
          sceneDataUrl: previousScene,
        });
        const j = (await r.json()) as { imageDataUrl?: string };
        imageDataUrl = j.imageDataUrl ?? null;
      } catch {
        imageDataUrl = null;
      }

      // The AI scene already contains the drawing. Only fall back to pasting the
      // raw sketch if illustration failed, so the child's idea isn't lost.
      const integrated = imageDataUrl !== null && drawingPng !== undefined && drawingPng !== null;
      let sceneUrl: string | undefined;
      if (imageDataUrl) {
        sceneUrl = imageDataUrl;
      } else if (drawingPng) {
        try {
          sceneUrl = await compositeScene(null, drawingPng, SCENE_W, SCENE_H, placement);
        } catch {
          sceneUrl = undefined;
        }
      }

      const turn = base.beats.length + 1;
      const beat: Beat = {
        narration: story.narration,
        choices: story.choices ?? [],
        imagePrompt: story.imagePrompt ?? "",
        imageUrl: imageDataUrl ?? undefined,
        drawingUrl: integrated ? undefined : (drawingPng ?? undefined),
        drawingPlacement: integrated ? undefined : (placement ?? undefined),
      };
      const delta = {
        newCharacters: story.newCharacters ?? [],
        newDrawnItems: (story.newDrawnItems ?? []).map((d) => ({ label: d.label, turn })),
      };
      const next = applyDelta(base, beat, delta);
      persist(next);
      setUi({ state: next, current: { ...beat, sceneUrl }, phase: "idle", loading: false, message: null });
    },
    [persist]
  );

  const start = useCallback(
    async (premise: string) => {
      const s = initialState(premise);
      persist(s);
      setUi({ state: s, current: null, phase: "thinking", loading: true, message: null });
      await takeTurn({ action: "Begin the adventure" });
    },
    [persist, takeTurn]
  );

  return {
    state: ui.state,
    current: ui.current,
    phase: ui.phase,
    loading: ui.loading,
    message: ui.message,
    start,
    takeTurn,
  };
}
