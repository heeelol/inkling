import { z } from "zod";

export const StoryResponseSchema = z.object({
  narration: z.string(),
  choices: z.array(z.object({ id: z.string(), label: z.string() })),
  imagePrompt: z.string(),
  newCharacters: z.array(z.string()),
  newDrawnItems: z.array(z.object({ label: z.string() })),
});

export type StoryResponse = z.infer<typeof StoryResponseSchema>;
