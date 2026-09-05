import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/sarvam/translate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, sourceLanguageCode = "auto", targetLanguageCode } = body;

    if (!input || !targetLanguageCode) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Input text and targetLanguageCode required." } },
        { status: 400 }
      );
    }

    const result = await translateText({ input, sourceLanguageCode, targetLanguageCode });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API] Translation error:", err);
    return NextResponse.json(
      {
        error: {
          code: err.error?.code || "TRANSLATION_ERROR",
          message: err.error?.message || "Failed to translate text.",
          provider: "sarvam",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
