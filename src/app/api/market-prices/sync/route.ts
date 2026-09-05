import { NextRequest, NextResponse } from "next/server";
import { activeMarketService } from "@/server/services/marketService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const state = body.state || "Uttar Pradesh";
    const limit = body.limit || 100;

    const result = await activeMarketService.syncFromDataGov({ state, limit });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SYNC_FAILED",
            message: result.error || "Sync from data.gov.in failed.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${result.fetched} market price records from data.gov.in AGMARKNET.`,
      storedCount: result.stored,
    });
  } catch (err: any) {
    console.error("[API] POST /api/market-prices/sync error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to trigger market price sync.",
        },
      },
      { status: 500 }
    );
  }
}
