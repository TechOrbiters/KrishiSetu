import { NextRequest, NextResponse } from "next/server";
import { calculateHaversineDistance } from "@/lib/maps/routing";
import { validateCoordinates } from "@/lib/maps/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const originLat = parseFloat(searchParams.get("originLat") || "NaN");
    const originLng = parseFloat(searchParams.get("originLng") || "NaN");
    const destLat = parseFloat(searchParams.get("destLat") || "NaN");
    const destLng = parseFloat(searchParams.get("destLng") || "NaN");

    if (!validateCoordinates(originLat, originLng) || !validateCoordinates(destLat, destLng)) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Valid originLat, originLng, destLat, destLng are required." } },
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
          provider: "haversine",
          retryable: false,
        },
      },
      { status: 500 }
    );
  }
}
