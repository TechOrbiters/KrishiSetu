import { NextResponse } from 'next/server';

export async function GET() {
  const hasSarvam = Boolean(process.env.SARVAM_API_KEY);
  const hasGoogleMaps = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY);
  const hasWeather = Boolean(process.env.OPENWEATHER_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json({
    sarvam: hasSarvam,
    googleMaps: hasGoogleMaps,
    weather: hasWeather,
    gemini: hasGemini,
    platform: 'KrishiSetu',
    status: 'HEALTHY',
  });
}
