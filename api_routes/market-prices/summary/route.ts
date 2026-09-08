import { NextResponse } from "next/server";
import { activeMarketService } from "@/server/services/marketService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cards = await activeMarketService.getSummaryCards();
    return NextResponse.json({
      success: true,
      data: cards,
    });
  } catch (err: any) {
    console.error("[API] GET /api/market-prices/summary error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SUMMARY_ERROR",
          message: err.message || "Failed to fetch market price summary.",
        },
      },
      { status: 500 }
    );
  }
}
