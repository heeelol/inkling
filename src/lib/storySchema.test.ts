import { describe, it, expect } from "vitest";
import { StoryResponseSchema } from "./storySchema";

describe("StoryResponseSchema", () => {
  it("accepts a well-formed response", () => {
    const r = StoryResponseSchema.parse({
      narration: "The dragon peeked out.",
      choices: [{ id: "a", label: "Light a candle" }],
      imagePrompt: "a small dragon in a dark cave",
      newCharacters: ["Ember"],
      newDrawnItems: [],
    });
    expect(r.choices[0].label).toBe("Light a candle");
  });

  it("rejects missing narration", () => {
    expect(() => StoryResponseSchema.parse({ choices: [], imagePrompt: "x", newCharacters: [], newDrawnItems: [] })).toThrow();
  });
});
