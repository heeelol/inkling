import { NextRequest, NextResponse } from "next/server";
import { toFile } from "openai";
import { openai, MODELS } from "@/lib/openai";
import { CRAYON_STYLE_PRESET, buildDrawingIntegration } from "@/lib/prompts";
import { assertSafe, SafetyError } from "@/lib/moderation";

export const runtime = "nodejs";

function dataUrlToBuffer(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(",");
  return Buffer.from(dataUrl.slice(comma + 1), "base64");
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, drawingDataUrl, drawingDescription } = await req.json();
    if (typeof prompt !== "string") return NextResponse.json({ error: "prompt required" }, { status: 400 });
    await assertSafe(prompt);
    if (typeof drawingDescription === "string") await assertSafe(drawingDescription);

    const hasDrawing = typeof drawingDataUrl === "string" && drawingDataUrl.startsWith("data:image");

    let b64: string | undefined;
    if (hasDrawing) {
      // The child drew something — use it as a reference so the model paints
      // their idea into the scene in crayon style, instead of a pasted doodle.
      const image = await toFile(dataUrlToBuffer(drawingDataUrl), "drawing.png", { type: "image/png" });
      const result = await openai.images.edit({
        model: MODELS.image,
        image,
        prompt: `${prompt}. ${buildDrawingIntegration(drawingDescription)} ${CRAYON_STYLE_PRESET}`,
        size: "1024x1024",
      });
      b64 = result.data?.[0]?.b64_json;
    } else {
      const result = await openai.images.generate({
        model: MODELS.image,
        prompt: `${prompt}. ${CRAYON_STYLE_PRESET}`,
        size: "1024x1024",
      });
      b64 = result.data?.[0]?.b64_json;
    }

    if (!b64) return NextResponse.json({ error: "no image" }, { status: 500 });
    return NextResponse.json({ imageDataUrl: `data:image/png;base64,${b64}` });
  } catch (err) {
    if (err instanceof SafetyError) return NextResponse.json({ error: "unsafe" }, { status: 200 });
    console.error(err);
    return NextResponse.json({ error: "illustration failed" }, { status: 500 });
  }
}
