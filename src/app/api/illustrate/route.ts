import { NextRequest, NextResponse } from "next/server";
import { toFile, type Uploadable } from "openai";
import { openai, MODELS } from "@/lib/openai";
import { CRAYON_STYLE_PRESET, buildDrawingIntegration, buildContinuity } from "@/lib/prompts";
import { assertSafe, SafetyError } from "@/lib/moderation";

export const runtime = "nodejs";

function dataUrlToBuffer(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(",");
  return Buffer.from(dataUrl.slice(comma + 1), "base64");
}

const isImageDataUrl = (v: unknown): v is string =>
  typeof v === "string" && v.startsWith("data:image");

export async function POST(req: NextRequest) {
  try {
    const { prompt, drawingDataUrl, drawingDescription, sceneDataUrl } = await req.json();
    if (typeof prompt !== "string") return NextResponse.json({ error: "prompt required" }, { status: 400 });
    await assertSafe(prompt);
    if (typeof drawingDescription === "string") await assertSafe(drawingDescription);

    const hasDrawing = isImageDataUrl(drawingDataUrl);
    const hasScene = isImageDataUrl(sceneDataUrl);

    let b64: string | undefined;
    if (hasDrawing || hasScene) {
      // Reference-guided edit: previous page (for consistent characters/setting)
      // and/or the child's sketch (to paint their idea into the scene).
      const images: Uploadable[] = [];
      if (hasScene) images.push(await toFile(dataUrlToBuffer(sceneDataUrl), "scene.png", { type: "image/png" }));
      if (hasDrawing) images.push(await toFile(dataUrlToBuffer(drawingDataUrl), "drawing.png", { type: "image/png" }));

      const parts = [prompt + "."];
      if (hasScene) parts.push(buildContinuity());
      if (hasDrawing) parts.push(buildDrawingIntegration(drawingDescription));
      parts.push(CRAYON_STYLE_PRESET);

      const result = await openai.images.edit({
        model: MODELS.image,
        image: images,
        prompt: parts.join(" "),
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
