import { NextResponse } from "next/server";

export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const firebaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY
  );

  const googleMapsConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const googleVisionConfigured = Boolean(process.env.GOOGLE_VISION_API_KEY);
  const googleGeolocationConfigured = Boolean(process.env.GOOGLE_GEOLOCATION_API_KEY);
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
    google_maps: {
      status: googleMapsConfigured ? "HEALTHY" : "NOT_CONFIGURED",
      role: "Interactive Maps & Client Location Services",
      clientSafe: true,
    },
    google_vision: {
      status: googleVisionConfigured ? "HEALTHY" : "NOT_CONFIGURED",
      role: "Assistive Produce Photo Analysis",
      clientSafe: false,
    },
    google_geolocation: {
      status: googleGeolocationConfigured ? "HEALTHY" : "NOT_CONFIGURED",
      role: "Network Geolocation Fallback",
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
    googleMapsConfigured &&
    googleVisionConfigured &&
    sarvamConfigured;

  return NextResponse.json({
    status: allHealthy ? "HEALTHY" : "DEGRADED",
    timestamp: new Date().toISOString(),
    providers,
  });
}
