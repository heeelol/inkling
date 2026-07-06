"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { StoryState, Beat, initialState, applyDelta, summarize } from "@/lib/storyState";
import { compositeScene } from "@/lib/composite";

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
    async ({ action, drawingPng }: { action: string; drawingPng?: string | null }) => {
      const base = stateRef.current;
      if (!base) return;
      setUi((u) => ({ ...u, loading: true, phase: "thinking", message: null }));

      let drawingDescription: string | undefined;
      if (drawingPng) {
        try {
          const r = await postJson("/api/interpret-drawing", { imageDataUrl: drawingPng });
          const j = (await r.json()) as { description?: string };
          drawingDescription = j.description;
        } catch {
          drawingDescription = "your drawing";
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
      let imageDataUrl: string | null = null;
      try {
        const r = await postJson("/api/illustrate", { prompt: story.imagePrompt });
        const j = (await r.json()) as { imageDataUrl?: string };
        imageDataUrl = j.imageDataUrl ?? null;
      } catch {
        imageDataUrl = null;
      }

      let sceneUrl: string | undefined;
      try {
        sceneUrl = await compositeScene(imageDataUrl, drawingPng ?? null, SCENE_W, SCENE_H);
      } catch {
        sceneUrl = imageDataUrl ?? undefined;
      }

      const turn = base.beats.length + 1;
      const beat: Beat = {
        narration: story.narration,
        choices: story.choices ?? [],
        imagePrompt: story.imagePrompt ?? "",
        imageUrl: imageDataUrl ?? undefined,
        drawingUrl: drawingPng ?? undefined,
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
