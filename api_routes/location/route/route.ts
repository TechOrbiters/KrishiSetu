import { NextRequest, NextResponse } from "next/server";
import { calculateRoute } from "@/lib/maps/routing";
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
        {
          error: {
            code: "BAD_REQUEST",
            message: "Valid originLat, originLng, destLat, destLng coordinates are required.",
          },
        },
        { status: 400 }
      );
    }

    const routeInfo = await calculateRoute(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng }
    );

    return NextResponse.json({
      success: true,
      provider: routeInfo.provider,
      data: routeInfo,
    });
  } catch (err: any) {
    console.error("[API] Route ETA error:", err);
    return NextResponse.json(
      {
        error: {
          code: "ROUTE_ERROR",
          message: err.message || "Failed to calculate route.",
          provider: "osrm",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
