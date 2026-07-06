import { describe, it, expect, vi } from "vitest";

vi.mock("./openai", () => ({
  MODELS: { moderation: "omni-moderation-latest" },
  openai: { moderations: { create: vi.fn() } },
}));

import { moderate, assertSafe, SafetyError } from "./moderation";
import { openai } from "./openai";

describe("moderate", () => {
  it("returns ok when not flagged", async () => {
    vi.mocked(openai.moderations.create).mockResolvedValue({ results: [{ flagged: false, categories: {} }] } as never);
    expect(await moderate("a happy dragon")).toEqual({ ok: true });
  });

  it("returns not-ok with reason when flagged", async () => {
    vi.mocked(openai.moderations.create).mockResolvedValue({
      results: [{ flagged: true, categories: { violence: true } }],
    } as never);
    const r = await moderate("something violent");
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("violence");
  });

  it("assertSafe throws SafetyError when flagged", async () => {
    vi.mocked(openai.moderations.create).mockResolvedValue({
      results: [{ flagged: true, categories: { violence: true } }],
    } as never);
    await expect(assertSafe("bad")).rejects.toBeInstanceOf(SafetyError);
  });
});
