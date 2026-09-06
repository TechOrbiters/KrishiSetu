import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/sarvam/stt";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SARVAM_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SARVAM_API_KEY_MISSING",
            message: "Sarvam AI API key is not configured on the server.",
            provider: "sarvam",
            retryable: false,
          },
        },
        { status: 500 }
      );
    }

    let audioData: Buffer | string = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file || file.size === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MISSING_OR_EMPTY_FILE",
              message: "Valid non-empty audio file is required.",
              provider: "sarvam",
              retryable: false,
            },
          },
          { status: 400 }
        );
      }
      audioData = Buffer.from(await file.arrayBuffer());
    } else {
      const body = await req.json();
      audioData = body.audioBase64 || body.audioUrl || "";
    }

    if (!audioData || (Buffer.isBuffer(audioData) && audioData.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Audio data or file required.",
            provider: "sarvam",
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const result = await transcribeAudio(audioData);

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      languageCode: result.languageCode,
      provider: "sarvam",
      extractedIntent: result.extractedIntent,
      confidence: result.confidence,
      data: result,
    });
  } catch (err: any) {
    console.error("[API] Speech-to-Text error:", err);
    const statusCode =
      err.error?.code === "SARVAM_TIMEOUT"
        ? 504
        : err.error?.code?.startsWith("SARVAM_HTTP_")
        ? parseInt(err.error.code.replace("SARVAM_HTTP_", ""), 10) || 500
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.error?.code || "STT_ERROR",
          message: err.error?.message || "Failed to convert speech to text.",
          provider: "sarvam",
          retryable: err.error?.retryable ?? true,
        },
      },
      { status: statusCode }
    );
  }
}

