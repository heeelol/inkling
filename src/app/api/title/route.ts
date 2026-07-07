import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export const runtime = "nodejs";

const SYSTEM =
  "You name a children's picture book. Given the premise and a few lines of the story, " +
  "reply with ONE short, whimsical, warm title in Title Case — 2 to 6 words. " +
  "No quotation marks, no trailing punctuation, no subtitle. Reply with only the title.";

export async function POST(req: NextRequest) {
  try {
    const { premise, excerpt } = await req.json();
    if (typeof premise !== "string" || !premise.trim()) {
      return NextResponse.json({ error: "premise required" }, { status: 400 });
    }
    const completion = await openai.chat.completions.create({
      model: MODELS.story,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `PREMISE: ${premise}\n\nSTORY: ${typeof excerpt === "string" ? excerpt.slice(0, 600) : ""}` },
      ],
      max_tokens: 24,
    });
    const raw = completion.choices[0].message.content?.trim() ?? "";
    const title = raw.replace(/^["'“”]|["'“”.]+$/g, "").trim();
    return NextResponse.json({ title: title || null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ title: null });
  }
}
