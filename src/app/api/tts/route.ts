import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }
    const speech = await openai.audio.speech.create({
      model: MODELS.tts,
      voice: "alloy",
      input: text.slice(0, 1200),
    });
    const buf = Buffer.from(await speech.arrayBuffer());
    return new NextResponse(buf, { headers: { "Content-Type": "audio/mpeg" } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "tts failed" }, { status: 500 });
  }
}
