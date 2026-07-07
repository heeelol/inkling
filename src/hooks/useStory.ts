"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { StoryState, Beat, Choice, initialState, applyDelta, summarize } from "@/lib/storyState";
import { firstFit, canPlace, type Item, type Placed } from "@/lib/inventory";

const STORAGE_KEY = "inkling-saga"; // new key: old picture-book saves are incompatible

type Phase = "idle" | "thinking" | "illustrating";

type UIState = {
  state: StoryState | null;
  current: Beat | null;
  phase: Phase;
  loading: boolean;
  message: string | null;
  pending: Item[]; // found items that didn't fit the bag — place or discard
};

type StoryJson = {
  error?: string;
  message?: string;
  narration?: string;
  choices?: Choice[];
  imagePrompt?: string;
  newCharacters?: string[];
  newEvents?: string[];
  newItems?: { name: string; emoji: string; w: number; h: number }[];
  removeItems?: string[];
};

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

const stripForStorage = (s: StoryState): StoryState => ({
  ...s,
  beats: s.beats.map((b) => ({ ...b, imageUrl: undefined })),
});

let itemSeq = 0;
const newId = () => `it${Date.now().toString(36)}${itemSeq++}`;

export function useStory() {
  const [ui, setUi] = useState<UIState>({ state: null, current: null, phase: "idle", loading: false, message: null, pending: [] });
  const stateRef = useRef<StoryState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoryState;
        if (!Array.isArray(parsed.bag) || !Array.isArray(parsed.events)) return; // old/corrupt shape
        stateRef.current = parsed;
        const last = parsed.beats[parsed.beats.length - 1] ?? null;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage after mount is intentional
        setUi((u) => ({ ...u, state: parsed, current: last }));
      }
    } catch { /* ignore corrupt storage */ }
  }, []);

  const persist = useCallback((s: StoryState) => {
    stateRef.current = s;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stripForStorage(s))); } catch { /* quota */ }
  }, []);

  const takeTurn = useCallback(
    async ({ action }: { action: string }) => {
      const base = stateRef.current;
      if (!base) return;
      setUi((u) => ({ ...u, loading: true, phase: "thinking", message: null }));

      let story: StoryJson | undefined;
      try {
        const r = await postJson("/api/story", { summary: summarize(base), action });
        story = (await r.json()) as StoryJson;
      } catch {
        setUi((u) => ({ ...u, loading: false, phase: "idle", message: "The threads of fate tangled — try again." }));
        return;
      }
      if (story?.error === "redirect") {
        setUi((u) => ({ ...u, loading: false, phase: "idle", message: story?.message ?? "The fates refuse that path." }));
        return;
      }
      if (story?.error || !story?.narration) {
        setUi((u) => ({ ...u, loading: false, phase: "idle", message: "The threads of fate tangled — try again." }));
        return;
      }

      setUi((u) => ({ ...u, phase: "illustrating" }));
      const previousScene = base.beats[base.beats.length - 1]?.imageUrl ?? null;
      let imageDataUrl: string | null = null;
      for (let attempt = 0; attempt < 2 && !imageDataUrl; attempt++) {
        try {
          const r = await postJson("/api/illustrate", { prompt: story.imagePrompt, sceneDataUrl: previousScene });
          const j = (await r.json()) as { imageDataUrl?: string };
          imageDataUrl = j.imageDataUrl ?? null;
        } catch { imageDataUrl = null; }
      }

      // ---- inventory bookkeeping ----
      let bag: Placed[] = base.bag;
      // removals first (frees space for new finds)
      const toRemove = (story.removeItems ?? []).map((n) => n.toLowerCase());
      if (toRemove.length) bag = bag.filter((p) => !toRemove.includes(p.item.name.toLowerCase()));
      // grants: auto-place when possible, else queue for manual packing
      const overflow: Item[] = [];
      const foundNames: string[] = [];
      for (const raw of story.newItems ?? []) {
        const item: Item = { id: newId(), name: raw.name, emoji: raw.emoji, w: raw.w, h: raw.h };
        foundNames.push(`${raw.emoji} ${raw.name}`);
        const fit = firstFit(bag, item);
        if (fit) bag = [...bag, { item, ...fit }];
        else overflow.push(item);
      }

      const beat: Beat = {
        narration: story.narration,
        choices: story.choices ?? [],
        imagePrompt: story.imagePrompt ?? "",
        imageUrl: imageDataUrl ?? undefined,
      };
      const next = {
        ...applyDelta(base, beat, { newCharacters: story.newCharacters ?? [], newEvents: story.newEvents ?? [], action }),
        bag,
      };
      persist(next);
      setUi((u) => ({
        state: next, current: beat, phase: "idle", loading: false,
        message: foundNames.length ? `🎒 Found: ${foundNames.join(", ")}${overflow.length ? " — your bag is too full!" : ""}` : null,
        pending: [...u.pending, ...overflow],
      }));
    },
    [persist]
  );

  const start = useCallback(
    async (premise: string) => {
      const s = initialState(premise);
      persist(s);
      setUi({ state: s, current: null, phase: "thinking", loading: true, message: null, pending: [] });
      await takeTurn({ action: "Begin the adventure" });
    },
    [persist, takeTurn]
  );

  // ---- bag manipulation (all validated by the pure inventory lib) ----
  const mutateBag = useCallback((fn: (bag: Placed[]) => Placed[]) => {
    const base = stateRef.current;
    if (!base) return;
    const next = { ...base, bag: fn(base.bag) };
    persist(next);
    setUi((u) => ({ ...u, state: next }));
  }, [persist]);

  const moveItem = useCallback((id: string, x: number, y: number, rot: boolean): boolean => {
    const base = stateRef.current;
    const placed = base?.bag.find((p) => p.item.id === id);
    if (!base || !placed || !canPlace(base.bag, placed.item, x, y, rot, id)) return false;
    mutateBag((bag) => bag.map((p) => (p.item.id === id ? { ...p, x, y, rot } : p)));
    return true;
  }, [mutateBag]);

  const placePending = useCallback((id: string, x: number, y: number, rot: boolean): boolean => {
    const base = stateRef.current;
    let ok = false;
    setUi((u) => {
      const item = u.pending.find((i) => i.id === id);
      if (!base || !item || !canPlace(base.bag, item, x, y, rot)) return u;
      ok = true;
      const next = { ...base, bag: [...base.bag, { item, x, y, rot }] };
      persist(next);
      return { ...u, state: next, pending: u.pending.filter((i) => i.id !== id) };
    });
    return ok;
  }, [persist]);

  const discardPending = useCallback((id: string) => {
    setUi((u) => ({ ...u, pending: u.pending.filter((i) => i.id !== id) }));
  }, []);

  const dropItem = useCallback((id: string) => {
    mutateBag((bag) => bag.filter((p) => p.item.id !== id));
  }, [mutateBag]);

  const useItem = useCallback((name: string) => {
    // The Game Master decides consumption via removeItems.
    void takeTurn({ action: `Use the ${name}` });
  }, [takeTurn]);

  return {
    state: ui.state, current: ui.current, phase: ui.phase, loading: ui.loading,
    message: ui.message, pending: ui.pending,
    start, takeTurn, moveItem, placePending, discardPending, dropItem, useItem,
  };
}
