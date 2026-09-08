import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentWeather } from "@/lib/weather/openweather";

/**
 * GET /api/weather
 * Query Params:
 *  - lat: Latitude (optional, default: 26.9038 - Barabanki)
 *  - lon: Longitude (optional, default: 81.1852 - Barabanki)
 *  - city: City name (optional, default: "Barabanki")
 *
 * Securely calls OpenWeather API server-side using OPENWEATHER_API_KEY.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const cityParam = searchParams.get("city") || "Barabanki";

    const lat = latParam ? parseFloat(latParam) : 26.9038;
    const lon = lonParam ? parseFloat(lonParam) : 81.1852;

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { success: false, error: "Invalid coordinates provided" },
        { status: 400 }
      );
    }

    const weatherData = await fetchCurrentWeather(lat, lon, cityParam);

    return NextResponse.json(
      {
        success: true,
        data: weatherData,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error: any) {
    console.error("[API Weather] Error fetching weather:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch weather data",
      },
      { status: 500 }
    );
  }
}
