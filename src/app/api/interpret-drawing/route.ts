import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { VISION_SYSTEM } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();
    if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image")) {
      return NextResponse.json({ error: "imageDataUrl required" }, { status: 400 });
    }
    const completion = await openai.chat.completions.create({
      model: MODELS.vision,
      messages: [
        { role: "system", content: VISION_SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "What did the child draw?" },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });
    const description = completion.choices[0].message.content?.trim() ?? "a mysterious drawing";
    return NextResponse.json({ description });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ description: "your drawing" });
  }
}
