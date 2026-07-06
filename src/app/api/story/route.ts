import { NextRequest, NextResponse } from "next/server";
import { zodResponseFormat } from "openai/helpers/zod";
import { openai, MODELS } from "@/lib/openai";
import { assertSafe, SafetyError } from "@/lib/moderation";
import { StoryResponseSchema } from "@/lib/storySchema";
import { STORY_SYSTEM, buildStoryUserPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { summary, action, drawingDescription } = await req.json();
    if (typeof action !== "string") return NextResponse.json({ error: "action required" }, { status: 400 });

    await assertSafe(`${action} ${drawingDescription ?? ""}`);

    const completion = await openai.chat.completions.parse({
      model: MODELS.story,
      messages: [
        { role: "system", content: STORY_SYSTEM },
        { role: "user", content: buildStoryUserPrompt(summary ?? "", action, drawingDescription) },
      ],
      response_format: zodResponseFormat(StoryResponseSchema, "story"),
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) return NextResponse.json({ error: "no story" }, { status: 500 });

    await assertSafe(parsed.narration);
    return NextResponse.json(parsed);
  } catch (err) {
    if (err instanceof SafetyError) {
      return NextResponse.json({ error: "redirect", message: "Let's imagine something friendlier!" });
    }
    console.error(err);
    return NextResponse.json({ error: "The story got sleepy — try again." }, { status: 500 });
  }
}
