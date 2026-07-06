import { openai, MODELS } from "./openai";

export class SafetyError extends Error {}

// OpenAI's raw `flagged` boolean false-positives on wholly benign text
// (e.g. it flags the literal phrase "Start the story"), which would hard-block
// the whole experience. Gate on category confidence scores instead: block only
// when a category is above this threshold. Genuinely harmful content scores well
// above it, so kid-safety is preserved while false positives pass through.
const BLOCK_THRESHOLD = 0.5;

export async function moderate(text: string): Promise<{ ok: boolean; reason?: string }> {
  if (!text.trim()) return { ok: true };
  const res = await openai.moderations.create({ model: MODELS.moderation, input: text });
  const result = res.results[0];
  if (!result) return { ok: true };
  const offending = Object.entries(result.category_scores ?? {})
    .filter(([, score]) => typeof score === "number" && score >= BLOCK_THRESHOLD)
    .map(([category]) => category);
  if (offending.length === 0) return { ok: true };
  return { ok: false, reason: offending.join(", ") };
}

export async function assertSafe(text: string): Promise<void> {
  const { ok, reason } = await moderate(text);
  if (!ok) throw new SafetyError(reason ?? "content flagged");
}
