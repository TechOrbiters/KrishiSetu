import { NextRequest, NextResponse } from "next/server";
import { calculateRouteEta } from "@/lib/google/maps";

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

    const routeInfo = await calculateRouteEta(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng }
    );

    return NextResponse.json({
      success: true,
      data: routeInfo,
    });
  } catch (err: any) {
    console.error("[API] Route ETA error:", err);
    return NextResponse.json(
      {
        error: {
          code: "ROUTE_ERROR",
          message: err.message || "Failed to calculate route ETA.",
          provider: "google_maps",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
