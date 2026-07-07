import type { Placement } from "./composite";

export type Choice = { id: string; label: string };
export type DrawnItem = { label: string; turn: number };
export type Beat = {
  narration: string; choices: Choice[]; imagePrompt: string;
  imageUrl?: string; drawingUrl?: string; drawingPlacement?: Placement;
};
export type StateDelta = { newCharacters?: string[]; newDrawnItems?: DrawnItem[] };

export type StoryState = {
  premise: string;
  beats: Beat[];
  characters: string[];
  drawnItems: DrawnItem[];
};

export function initialState(premise: string): StoryState {
  return { premise, beats: [], characters: [], drawnItems: [] };
}

export function applyDelta(state: StoryState, beat: Beat, delta: StateDelta): StoryState {
  const characters = Array.from(new Set([...state.characters, ...(delta.newCharacters ?? [])]));
  const drawnItems = [...state.drawnItems, ...(delta.newDrawnItems ?? [])];
  return { ...state, beats: [...state.beats, beat], characters, drawnItems };
}

export function summarize(state: StoryState): string {
  const recent = state.beats.slice(-3).map((b) => b.narration).join(" ");
  const chars = state.characters.join(", ") || "none yet";
  const drawn = state.drawnItems.map((d) => d.label).join(", ") || "none yet";
  return [
    `PREMISE: ${state.premise}`,
    `CHARACTERS: ${chars}`,
    `THINGS THE CHILD HAS DRAWN INTO THE STORY: ${drawn}`,
    `STORY SO FAR: ${recent || "(just beginning)"}`,
  ].join("\n");
}
