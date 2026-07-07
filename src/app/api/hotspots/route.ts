import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export const runtime = "nodejs";

const SYSTEM =
  "You find the main characters/objects in a children's storybook illustration so a child can poke them. " +
  'Reply ONLY with JSON: {"hotspots":[{"label":"the dragon 🐉","x":0.1,"y":0.2,"w":0.3,"h":0.4}]}. ' +
  "x,y = top-left, w,h = size, all fractions of the image (0..1). " +
  "Max 4 hotspots, only clearly visible distinct things, tight boxes, playful 1-3 word labels with a fitting emoji.";

type Hotspot = { label: string; x: number; y: number; w: number; h: number };

const clamp01 = (v: unknown) => (typeof v === "number" && isFinite(v) ? Math.min(1, Math.max(0, v)) : null);

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();
    if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image")) {
      return NextResponse.json({ hotspots: [] });
    }
    const completion = await openai.chat.completions.create({
      model: MODELS.vision,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Find the poke-able things in this picture." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });
    const raw = JSON.parse(completion.choices[0].message.content ?? "{}") as { hotspots?: unknown[] };
    const hotspots: Hotspot[] = (Array.isArray(raw.hotspots) ? raw.hotspots : [])
      .map((h) => {
        const o = h as Record<string, unknown>;
        const x = clamp01(o.x), y = clamp01(o.y), w = clamp01(o.w), hh = clamp01(o.h);
        if (typeof o.label !== "string" || x === null || y === null || !w || !hh) return null;
        return { label: o.label.slice(0, 40), x, y, w, h: hh };
      })
      .filter((h): h is Hotspot => h !== null)
      .slice(0, 4);
    return NextResponse.json({ hotspots });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ hotspots: [] });
  }
}
