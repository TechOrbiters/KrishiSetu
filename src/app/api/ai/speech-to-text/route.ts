import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/sarvam/stt";

export async function POST(req: NextRequest) {
  try {
    let audioData: Buffer | string = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: { code: "MISSING_FILE", message: "Audio file is required." } },
          { status: 400 }
        );
      }
      audioData = Buffer.from(await file.arrayBuffer());
    } else {
      const body = await req.json();
      audioData = body.audioBase64 || body.audioUrl || "";
    }

    if (!audioData) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Audio data or file required." } },
        { status: 400 }
      );
    }

    const result = await transcribeAudio(audioData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API] Speech-to-Text error:", err);
    return NextResponse.json(
      {
        error: {
          code: err.error?.code || "STT_ERROR",
          message: err.error?.message || "Failed to convert speech to text.",
          provider: "sarvam",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
