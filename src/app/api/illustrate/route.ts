import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { CRAYON_STYLE_PRESET } from "@/lib/prompts";
import { assertSafe, SafetyError } from "@/lib/moderation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (typeof prompt !== "string") return NextResponse.json({ error: "prompt required" }, { status: 400 });
    await assertSafe(prompt);

    const result = await openai.images.generate({
      model: MODELS.image,
      prompt: `${prompt}. ${CRAYON_STYLE_PRESET}`,
      size: "1024x1024",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "no image" }, { status: 500 });
    return NextResponse.json({ imageDataUrl: `data:image/png;base64,${b64}` });
  } catch (err) {
    if (err instanceof SafetyError) return NextResponse.json({ error: "unsafe" }, { status: 200 });
    console.error(err);
    return NextResponse.json({ error: "illustration failed" }, { status: 500 });
  }
}
