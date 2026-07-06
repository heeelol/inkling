import { describe, it, expect, vi } from "vitest";

vi.mock("./openai", () => ({
  MODELS: { moderation: "omni-moderation-latest" },
  openai: { moderations: { create: vi.fn() } },
}));

import { moderate, assertSafe, SafetyError } from "./moderation";
import { openai } from "./openai";

describe("moderate", () => {
  it("returns ok when all category scores are below the threshold", async () => {
    vi.mocked(openai.moderations.create).mockResolvedValue({
      results: [{ flagged: false, category_scores: { violence: 0.001 } }],
    } as never);
    expect(await moderate("a happy dragon")).toEqual({ ok: true });
  });

  it("returns not-ok with reason when a category score exceeds the threshold", async () => {
    vi.mocked(openai.moderations.create).mockResolvedValue({
      results: [{ flagged: true, category_scores: { violence: 0.92 } }],
    } as never);
    const r = await moderate("something violent");
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("violence");
  });

  it("allows benign text even when OpenAI's flagged boolean is a false positive (low score)", async () => {
    vi.mocked(openai.moderations.create).mockResolvedValue({
      results: [{ flagged: true, category_scores: { violence: 0.12 } }],
    } as never);
    expect(await moderate("Start the story")).toEqual({ ok: true });
  });

  it("assertSafe throws SafetyError when a score exceeds the threshold", async () => {
    vi.mocked(openai.moderations.create).mockResolvedValue({
      results: [{ flagged: true, category_scores: { violence: 0.92 } }],
    } as never);
    await expect(assertSafe("bad")).rejects.toBeInstanceOf(SafetyError);
  });
});
