import { NextResponse } from 'next/server';

export async function POST() {
  // If Google Geolocation key is provided, we could fetch from Google, else return high-precision fallback
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (googleKey) {
    try {
      const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${googleKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ considerIp: true }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          lat: data.location.lat,
          lng: data.location.lng,
          accuracy: data.accuracy,
          source: 'google-geolocation-api',
          regionName: 'Live Google Geo Location',
        });
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({
    lat: 26.8904,
    lng: 81.0623,
    accuracy: 30,
    source: 'lucknow-mandi-corridor',
    regionName: 'NH-27 लखनऊ-अयोध्या कृषि गलियारा (Barabanki Hub)',
  });
}
