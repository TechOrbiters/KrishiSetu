import { NextResponse } from "next/server";

export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const firebaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY
  );

  const osmTileConfigured = Boolean(
    process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  );
  const osrmConfigured = Boolean(
    process.env.OSRM_BASE_URL || "https://router.project-osrm.org"
  );
  const googleVisionConfigured = Boolean(process.env.GOOGLE_VISION_API_KEY);
  const sarvamConfigured = Boolean(process.env.SARVAM_API_KEY);

  const providers = {
    supabase: {
      status: supabaseConfigured ? "HEALTHY" : "NOT_CONFIGURED",
      role: "PostgreSQL Database & Storage",
    },
    firebase: {
      status: firebaseConfigured ? "HEALTHY" : "NOT_CONFIGURED",
      role: "Phone Auth, Realtime DB, Push Notifications",
    },
    openstreetmap: {
      status: osmTileConfigured ? "HEALTHY" : "NOT_CONFIGURED",
      role: "Leaflet Map Tiles & Attribution",
      clientSafe: true,
    },
    osrm_routing: {
      status: osrmConfigured ? "HEALTHY" : "NOT_CONFIGURED",
      role: "Road Route & Travel Duration Engine",
      clientSafe: true,
    },
    browser_geolocation: {
      status: "HEALTHY",
      role: "Native Browser Device Positioning",
      clientSafe: true,
    },
    google_vision: {
      status: googleVisionConfigured ? "HEALTHY" : "NOT_CONFIGURED",
      role: "Assistive Produce Photo Analysis",
      clientSafe: false,
    },
    sarvam_ai: {
      status: sarvamConfigured ? "HEALTHY" : "NOT_CONFIGURED",
      role: "Speech-to-Text, Text-to-Speech, Translation, Krishi AI Assistant",
      clientSafe: false,
    },
  };

  const allHealthy =
    supabaseConfigured &&
    firebaseConfigured &&
    osmTileConfigured &&
    osrmConfigured &&
    googleVisionConfigured &&
    sarvamConfigured;

  return NextResponse.json({
    status: allHealthy ? "HEALTHY" : "DEGRADED",
    timestamp: new Date().toISOString(),
    providers,
  });
}
