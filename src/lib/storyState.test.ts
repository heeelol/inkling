import { describe, it, expect } from "vitest";
import { initialState, applyDelta, summarize, type Beat } from "./storyState";

const beat = (n: string): Beat => ({ narration: n, choices: [], imagePrompt: "" });

describe("storyState", () => {
  it("initialState starts empty", () => {
    const s = initialState("a knight's oath");
    expect(s.beats).toHaveLength(0);
    expect(s.bag).toHaveLength(0);
    expect(s.events).toHaveLength(0);
  });

  it("applyDelta accumulates and dedupes characters, keeps events and actions", () => {
    let s = initialState("p");
    s = applyDelta(s, beat("one"), { newCharacters: ["Alric"], newEvents: ["Met Alric"], action: "Enter the keep" });
    s = applyDelta(s, beat("two"), { newCharacters: ["Alric", "Mora"], action: "Bow" });
    expect(s.characters).toEqual(["Alric", "Mora"]);
    expect(s.events).toEqual(["Met Alric"]);
    expect(s.actions).toEqual(["Enter the keep", "Bow"]);
    expect(s.beats).toHaveLength(2);
  });

  it("summarize includes inventory, chronicle, and recent choices", () => {
    let s = initialState("the last blade");
    s = applyDelta(s, beat("You find a sword."), { newEvents: ["Found the moon-blade"], action: "Search the crypt" });
    s = { ...s, bag: [{ item: { id: "1", name: "Moon-Blade", emoji: "🗡️", w: 1, h: 3 }, x: 0, y: 0, rot: false }] };
    const sum = summarize(s);
    expect(sum).toContain("Moon-Blade (1x3)");
    expect(sum).toContain("Found the moon-blade");
    expect(sum).toContain("Search the crypt");
  });
});
