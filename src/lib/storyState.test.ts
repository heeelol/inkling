import { describe, it, expect } from "vitest";
import { initialState, applyDelta, summarize } from "./storyState";

describe("storyState", () => {
  it("initialState seeds premise and empty history", () => {
    const s = initialState("a dragon who fears the dark");
    expect(s.premise).toBe("a dragon who fears the dark");
    expect(s.beats).toEqual([]);
    expect(s.drawnItems).toEqual([]);
  });

  it("applyDelta appends a beat and merges characters + drawn items", () => {
    const s0 = initialState("p");
    const s1 = applyDelta(
      s0,
      { narration: "Once...", choices: [{ id: "a", label: "Go" }], imagePrompt: "hills" },
      { newCharacters: ["Ember"], newDrawnItems: [{ label: "red boat", turn: 1 }] }
    );
    expect(s1.beats).toHaveLength(1);
    expect(s1.characters).toContain("Ember");
    expect(s1.drawnItems.map((d) => d.label)).toContain("red boat");
  });

  it("summarize includes premise, recent narration, characters, drawn items", () => {
    let s = initialState("space whales");
    s = applyDelta(s, { narration: "The whale sang.", choices: [], imagePrompt: "x" }, { newCharacters: ["Blu"] });
    const sum = summarize(s);
    expect(sum).toContain("space whales");
    expect(sum).toContain("Blu");
    expect(sum).toContain("whale sang");
  });
});
