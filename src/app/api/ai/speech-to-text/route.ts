import { NextRequest, NextResponse } from "next/server";
import { parseMandiIntent } from "@/lib/mandiIntent";

export const dynamic = process.env.STATIC_EXPORT === "true" ? "auto" : "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "/api/ai/speech-to-text" });
}

/**
 * POST /api/ai/speech-to-text
 * Server-side proxy for Sarvam AI Speech-to-Text (Saaras v3).
 *
 * Requirements met:
 * 1. Client sends recorded audio WebM Blob without API key.
 * 2. Server reads process.env.SARVAM_API_KEY (never exposed to client).
 * 3. Sends multipart/form-data with file, model="saaras:v3", mode="transcribe", language_code="hi-IN".
 * 4. Logs server-side only: status, error.code, error.message, requestId, durationMs (NO API KEY).
 * 5. Returns stable client contract: { success: true, transcript, languageCode, provider, extractedIntent }.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      console.error("[STT API] Server Configuration Error: SARVAM_API_KEY environment variable is not configured.");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SARVAM_API_KEY_MISSING",
            message: "Sarvam AI API key is not configured on the server.",
          },
        },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let audioBlob: Blob | null = null;
    let languageCode = "hi-IN";
    let model = "saaras:v3";
    let mode = "transcribe";
    let inputFilename = "recording.webm";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const langParam = formData.get("language_code");
      const modelParam = formData.get("model");
      const modeParam = formData.get("mode");

      if (langParam && typeof langParam === "string" && langParam.trim()) {
        languageCode = langParam.trim();
      }
      if (modelParam && typeof modelParam === "string" && modelParam.trim()) {
        model = modelParam.trim();
      }
      if (modeParam && typeof modeParam === "string" && modeParam.trim()) {
        mode = modeParam.trim();
      }

      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const fileObj = file as File;
        if (fileObj.size > 0) {
          audioBlob = fileObj;
          if (fileObj.name) {
            inputFilename = fileObj.name;
          }
        }
      }
    } else {
      // Direct binary/stream fallback
      const arrayBuffer = await req.arrayBuffer();
      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        audioBlob = new Blob([arrayBuffer], { type: "audio/webm" });
      }
    }

    // Diagnostics for 400 Bad Request
    if (!audioBlob || audioBlob.size === 0) {
      console.warn("[STT API] 400 Validation Error: Missing or empty audio file.");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_OR_EMPTY_FILE",
            message: "Audio recording is empty or missing. Please speak into the microphone.",
          },
        },
        { status: 400 }
      );
    }

    // Determine correct filename matching container type
    const mimeType = audioBlob.type || "audio/webm";
    let uploadFilename = inputFilename;
    if (mimeType.includes("webm") && !uploadFilename.endsWith(".webm")) {
      uploadFilename = "recording.webm";
    } else if (mimeType.includes("wav") && !uploadFilename.endsWith(".wav")) {
      uploadFilename = "recording.wav";
    } else if (mimeType.includes("ogg") && !uploadFilename.endsWith(".ogg") && !uploadFilename.endsWith(".opus")) {
      uploadFilename = "recording.ogg";
    } else if (mimeType.includes("mp4") && !uploadFilename.endsWith(".mp4") && !uploadFilename.endsWith(".m4a")) {
      uploadFilename = "recording.m4a";
    }

    // Construct server-side FormData for Sarvam
    const sarvamFormData = new FormData();
    sarvamFormData.append("file", audioBlob, uploadFilename);
    sarvamFormData.append("model", model);
    sarvamFormData.append("mode", mode);
    sarvamFormData.append("language_code", languageCode);

    // Call Sarvam REST API (do NOT manually set Content-Type; let fetch generate boundary)
    const sarvamRes = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
      },
      body: sarvamFormData,
    });

    const duration = Date.now() - startTime;

    if (!sarvamRes.ok) {
      const errText = await sarvamRes.text();
      let errJson: any = null;
      try {
        errJson = JSON.parse(errText);
      } catch (e) {}

      const requestId = errJson?.request_id || sarvamRes.headers.get("x-request-id") || undefined;
      const errorCode = errJson?.error?.code || `SARVAM_HTTP_${sarvamRes.status}`;
      const errorMessage = errJson?.error?.message || errText || "Voice transcription failed at Sarvam AI.";

      // Server-side logging only — NEVER log the API key
      console.error("[STT API] Sarvam API Error Response:", {
        status: sarvamRes.status,
        statusText: sarvamRes.statusText,
        errorCode,
        errorMessage,
        requestId,
        durationMs: duration,
        fileSize: audioBlob.size,
        mimeType,
        uploadFilename,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            diagnostics: {
              status: sarvamRes.status,
              fileSize: audioBlob.size,
              mimeType,
            },
          },
        },
        { status: sarvamRes.status }
      );
    }

    const data = await sarvamRes.json();
    const transcript = (data.transcript || data.transcription || "").trim();
    const extractedIntent = parseMandiIntent(transcript);

    return NextResponse.json({
      success: true,
      transcript,
      languageCode: data.language_code || languageCode,
      provider: "sarvam",
      extractedIntent,
      requestId: data.request_id,
      durationMs: duration,
    });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error("[STT API] Unexpected Server Error:", {
      message: err?.message || String(err),
      durationMs: duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SARVAM_STT_FAILED",
          message: "Internal server error during speech transcription.",
        },
      },
      { status: 500 }
    );
  }
}
