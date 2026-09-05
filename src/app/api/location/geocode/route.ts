import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/google/maps";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Address query parameter is required." } },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[API] Geocoding error:", err);
    return NextResponse.json(
      {
        error: {
          code: "GEOCODE_ERROR",
          message: err.message || "Failed to geocode address.",
          provider: "google_maps",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
