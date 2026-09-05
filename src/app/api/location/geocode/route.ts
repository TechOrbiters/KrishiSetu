import { NextRequest, NextResponse } from "next/server";
import { getManualLocationFallback } from "@/lib/location/geolocation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address") || "";

    if (!address) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Address query parameter is required." } },
        { status: 400 }
      );
    }

    const pos = getManualLocationFallback(address);

    return NextResponse.json({
      success: true,
      provider: "local_dictionary",
      data: {
        formattedAddress: address,
        location: { lat: pos.latitude, lng: pos.longitude },
        isFallback: true,
      },
    });
  } catch (err: any) {
    console.error("[API] Geocoding error:", err);
    return NextResponse.json(
      {
        error: {
          code: "GEOCODE_ERROR",
          message: err.message || "Failed to resolve address.",
          provider: "local_dictionary",
          retryable: false,
        },
      },
      { status: 500 }
    );
  }
}
