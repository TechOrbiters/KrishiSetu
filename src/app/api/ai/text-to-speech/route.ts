import { NextRequest, NextResponse } from "next/server";
import { generateSpeech } from "@/lib/sarvam/tts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, targetLanguageCode = "hi-IN", speaker = "meera" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Text parameter is required." } },
        { status: 400 }
      );
    }

    const result = await generateSpeech({ text, targetLanguageCode, speaker });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API] Text-to-Speech error:", err);
    return NextResponse.json(
      {
        error: {
          code: err.error?.code || "TTS_ERROR",
          message: err.error?.message || "Failed to convert text to speech.",
          provider: "sarvam",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
