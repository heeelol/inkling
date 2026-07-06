import { openai, MODELS } from "./openai";

export class SafetyError extends Error {}

export async function moderate(text: string): Promise<{ ok: boolean; reason?: string }> {
  if (!text.trim()) return { ok: true };
  const res = await openai.moderations.create({ model: MODELS.moderation, input: text });
  const result = res.results[0];
  if (!result?.flagged) return { ok: true };
  const reason = Object.entries(result.categories)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");
  return { ok: false, reason };
}

export async function assertSafe(text: string): Promise<void> {
  const { ok, reason } = await moderate(text);
  if (!ok) throw new SafetyError(reason ?? "content flagged");
}
