import { describe, it, expect } from "vitest";
import { StoryResponseSchema } from "./storySchema";

const base = {
  narration: "The wraith recoils from the torchlight.",
  choices: [{ id: "a", label: "Strike now", requiresItem: "Moon-Blade" }],
  imagePrompt: "a wraith recoiling in a torchlit crypt",
  newCharacters: ["The Wraith of Morr"],
  newEvents: ["You cornered the wraith"],
  newItems: [{ name: "Wraith Ash", emoji: "🫙", w: 1, h: 1 }],
  removeItems: ["Torch"],
};

describe("StoryResponseSchema", () => {
  it("accepts a well-formed response with items and events", () => {
    const r = StoryResponseSchema.parse(base);
    expect(r.choices[0].requiresItem).toBe("Moon-Blade");
    expect(r.newItems[0].w).toBe(1);
  });

  it("accepts null requiresItem", () => {
    const r = StoryResponseSchema.parse({ ...base, choices: [{ id: "b", label: "Flee", requiresItem: null }] });
    expect(r.choices[0].requiresItem).toBeNull();
  });

  it("rejects oversized items and missing narration", () => {
    expect(() => StoryResponseSchema.parse({ ...base, newItems: [{ name: "x", emoji: "x", w: 4, h: 1 }] })).toThrow();
    const { narration: _omit, ...rest } = base;
    expect(() => StoryResponseSchema.parse(rest)).toThrow();
  });
});
