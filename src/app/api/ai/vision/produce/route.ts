import { NextRequest, NextResponse } from "next/server";
import { analyzeProduceImage } from "@/lib/google/vision";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    let imageSource = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: { code: "MISSING_FILE", message: "No image file provided." } },
          { status: 400 }
        );
      }

      // Check max size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: { code: "FILE_TOO_LARGE", message: "File exceeds 5MB size limit." } },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      imageSource = `data:${file.type};base64,${buffer.toString("base64")}`;

      // Optionally upload file to Supabase Storage produce-photos bucket
      if (supabaseAdmin) {
        const filename = `vision-upload-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
        await supabaseAdmin.storage
          .from("produce-photos")
          .upload(filename, buffer, { contentType: file.type, upsert: true });
      }
    } else {
      const body = await req.json();
      imageSource = body.imageUrl || body.imageBase64 || "";
    }

    if (!imageSource) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Image base64 or URL required." } },
        { status: 400 }
      );
    }

    const result = await analyzeProduceImage(imageSource);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API] Vision route error:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err?.message || "Failed to process produce vision request.",
          provider: "google_vision",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
