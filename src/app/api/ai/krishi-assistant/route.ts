import { NextRequest, NextResponse } from "next/server";
import { processKrishiAssistantRequest } from "@/lib/sarvam/assistant";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userQuery, isVoice = false, languageCode, userId, confirmedAction } = body;

    if (!userQuery && !confirmedAction) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "userQuery or confirmedAction parameter required." } },
        { status: 400 }
      );
    }

    const response = await processKrishiAssistantRequest({
      userQuery: userQuery || "",
      isVoice,
      languageCode,
      userId,
      confirmedAction,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (err: any) {
    console.error("[API] Krishi Assistant error:", err);
    return NextResponse.json(
      {
        error: {
          code: err.error?.code || "ASSISTANT_ERROR",
          message: err.error?.message || "Failed to process Krishi AI Assistant query.",
          provider: "sarvam",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
