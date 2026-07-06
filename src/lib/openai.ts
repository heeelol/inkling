import OpenAI from "openai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const MODELS = {
  story: process.env.OPENAI_STORY_MODEL ?? "gpt-4o",
  vision: process.env.OPENAI_VISION_MODEL ?? "gpt-4o",
  image: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
  tts: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
  moderation: process.env.OPENAI_MODERATION_MODEL ?? "omni-moderation-latest",
} as const;
