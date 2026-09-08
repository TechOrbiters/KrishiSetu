import { NextRequest, NextResponse } from "next/server";
import { detectLanguage } from "@/lib/sarvam/language";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Text parameter is required." } },
        { status: 400 }
      );
    }

    const result = await detectLanguage(text);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API] Language detection error:", err);
    return NextResponse.json(
      {
        error: {
          code: err.error?.code || "LANG_DETECT_ERROR",
          message: err.error?.message || "Failed to detect language.",
          provider: "sarvam",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
