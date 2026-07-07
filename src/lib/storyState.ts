import type { Placed } from "./inventory";

export type Choice = { id: string; label: string; requiresItem?: string | null };
export type Beat = { narration: string; choices: Choice[]; imagePrompt: string; imageUrl?: string };
export type StateDelta = { newCharacters?: string[]; newEvents?: string[]; action?: string };

export type StoryState = {
  premise: string;
  beats: Beat[];
  characters: string[];
  events: string[];   // permanent chronicle of what happened
  actions: string[];  // every choice the player made, in order
  bag: Placed[];      // spatial inventory
};

export function initialState(premise: string): StoryState {
  return { premise, beats: [], characters: [], events: [], actions: [], bag: [] };
}

export function applyDelta(state: StoryState, beat: Beat, delta: StateDelta): StoryState {
  const characters = Array.from(new Set([...state.characters, ...(delta.newCharacters ?? [])]));
  const events = [...state.events, ...(delta.newEvents ?? [])];
  const actions = delta.action ? [...state.actions, delta.action] : state.actions;
  return { ...state, beats: [...state.beats, beat], characters, events, actions };
}

export function summarize(state: StoryState): string {
  const recent = state.beats.slice(-3).map((b) => b.narration).join(" ");
  const chars = state.characters.join(", ") || "none yet";
  const events = state.events.slice(-10).join("; ") || "none yet";
  const inventory = state.bag.map((p) => `${p.item.name} (${p.item.w}x${p.item.h})`).join(", ") || "empty";
  const actions = state.actions.slice(-8).join(" → ") || "none yet";
  return [
    `PREMISE: ${state.premise}`,
    `CHARACTERS: ${chars}`,
    `CHRONICLE (permanent events): ${events}`,
    `INVENTORY (6x4 bag): ${inventory}`,
    `RECENT CHOICES: ${actions}`,
    `STORY SO FAR: ${recent || "(the saga begins)"}`,
  ].join("\n");
}
