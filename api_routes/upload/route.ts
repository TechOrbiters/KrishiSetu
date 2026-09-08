import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = "produce-photos";

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Supabase service client is not initialized on server." },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "कृपया एक मान्य फोटो फ़ाइल चुनें (Please provide a valid image file)." },
        { status: 400 }
      );
    }

    // MIME type validation
    const fileType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json(
        {
          success: false,
          error: "अमान्य फ़ाइल प्रकार। केवल JPG, JPEG, PNG, या WEBP फोटो समर्थित हैं (Only JPG, JPEG, PNG, or WEBP supported).",
        },
        { status: 400 }
      );
    }

    // Size limit validation (5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "फ़ाइल का आकार 5MB से कम होना चाहिए (File size must be under 5MB).",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine extension safely
    const originalName = file.name || "photo.jpg";
    let ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      ext = fileType.includes("png") ? "png" : fileType.includes("webp") ? "webp" : "jpg";
    }

    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const fileName = `produce-${Date.now()}-${randomSuffix}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: fileType,
        upsert: true,
      });

    if (uploadError || !uploadData) {
      console.error("[Upload API] Supabase storage upload failed:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: uploadError?.message || "फोटो अपलोड करने में विफल (Failed to upload photo).",
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path || fileName);

    const publicUrl = publicUrlData?.publicUrl || "";

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: uploadData.path || fileName,
      bucket: BUCKET_NAME,
      size: file.size,
      mimeType: fileType,
    });
  } catch (err: any) {
    console.error("[Upload API] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "सर्वर त्रुटि: फोटो अपलोड नहीं हो सका।",
      },
      { status: 500 }
    );
  }
}
