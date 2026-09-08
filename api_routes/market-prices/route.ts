import { NextRequest, NextResponse } from "next/server";
import { activeMarketService } from "@/server/services/marketService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || undefined;
    const district = searchParams.get("district") || undefined;
    const market = searchParams.get("market") || undefined;
    const commodity = searchParams.get("commodity") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await activeMarketService.getMarketPrices({
      state,
      district,
      market,
      commodity,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        prices: result.prices,
        pagination: result.pagination,
        meta: {
          source: "Government of India OGD / AGMARKNET",
          lastUpdated: result.lastUpdated,
          isFallback: result.isFallback,
        },
      },
    });
  } catch (err: any) {
    console.error("[API] GET /api/market-prices error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MARKET_DATA_ERROR",
          message: err.message || "Failed to fetch market prices.",
        },
      },
      { status: 500 }
    );
  }
}
