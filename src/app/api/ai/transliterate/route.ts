import { NextRequest, NextResponse } from "next/server";
import { transliterateText } from "@/lib/sarvam/transliterate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, sourceLanguageCode = "en-IN", targetLanguageCode = "hi-IN" } = body;

    if (!input) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Input text is required." } },
        { status: 400 }
      );
    }

    const result = await transliterateText({ input, sourceLanguageCode, targetLanguageCode });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API] Transliteration error:", err);
    return NextResponse.json(
      {
        error: {
          code: err.error?.code || "TRANSLITERATION_ERROR",
          message: err.error?.message || "Failed to transliterate text.",
          provider: "sarvam",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
