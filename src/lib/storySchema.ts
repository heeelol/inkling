import { z } from "zod";

export const StoryResponseSchema = z.object({
  narration: z.string(),
  choices: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      // exact inventory item name this choice needs, or null
      requiresItem: z.string().nullable(),
    })
  ),
  imagePrompt: z.string(),
  newCharacters: z.array(z.string()),
  // short past-tense facts worth remembering forever ("You swore an oath to Ser Alric")
  newEvents: z.array(z.string()),
  // items granted this beat; w/h are bag grid cells (1-3)
  newItems: z.array(
    z.object({
      name: z.string(),
      emoji: z.string(),
      w: z.number().int().min(1).max(3),
      h: z.number().int().min(1).max(3),
    })
  ),
  // names of inventory items consumed, lost, or destroyed this beat
  removeItems: z.array(z.string()),
});

export type StoryResponse = z.infer<typeof StoryResponseSchema>;
