import { NextRequest, NextResponse } from "next/server";
import { calculateHaversineDistance } from "@/lib/google/maps";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const originLat = parseFloat(searchParams.get("originLat") || "0");
    const originLng = parseFloat(searchParams.get("originLng") || "0");
    const destLat = parseFloat(searchParams.get("destLat") || "0");
    const destLng = parseFloat(searchParams.get("destLng") || "0");

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "originLat, originLng, destLat, destLng are required." } },
        { status: 400 }
      );
    }

    const distanceKm = calculateHaversineDistance(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng }
    );

    return NextResponse.json({
      success: true,
      data: {
        distanceKm: Math.round(distanceKm * 100) / 100,
        type: "STRAIGHT_LINE_APPROXIMATION",
        notes: "Haversine straight-line distance. Road distance may differ.",
      },
    });
  } catch (err: any) {
    console.error("[API] Distance calculation error:", err);
    return NextResponse.json(
      {
        error: {
          code: "DISTANCE_ERROR",
          message: err.message || "Failed to calculate straight-line distance.",
          provider: "native_math",
          retryable: false,
        },
      },
      { status: 500 }
    );
  }
}
