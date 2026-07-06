import { describe, it, expect, vi } from "vitest";

vi.mock("./openai", () => ({
  MODELS: { moderation: "omni-moderation-latest" },
  openai: { moderations: { create: vi.fn() } },
}));

import { moderate, assertSafe, SafetyError } from "./moderation";
import { openai } from "./openai";

describe("moderate", () => {
  it("returns ok when not flagged", async () => {
    (openai.moderations.create as any).mockResolvedValue({ results: [{ flagged: false, categories: {} }] });
    expect(await moderate("a happy dragon")).toEqual({ ok: true });
  });

  it("returns not-ok with reason when flagged", async () => {
    (openai.moderations.create as any).mockResolvedValue({
      results: [{ flagged: true, categories: { violence: true } }],
    });
    const r = await moderate("something violent");
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("violence");
  });

  it("assertSafe throws SafetyError when flagged", async () => {
    (openai.moderations.create as any).mockResolvedValue({
      results: [{ flagged: true, categories: { violence: true } }],
    });
    await expect(assertSafe("bad")).rejects.toBeInstanceOf(SafetyError);
  });
});
