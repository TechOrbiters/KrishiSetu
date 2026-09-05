# AI MANDI — Third-Party Integrations Architecture & Operations Guide

## Overview
This document defines the complete third-party API integration architecture for AI MANDI across Google Cloud Vision, Google Maps Platform, Browser/Google Geolocation, and Sarvam AI.

---

## Complete Responsibility Map
```
Firebase
├── Phone Authentication
├── Firebase UID (Identity source of truth)
├── Realtime shipment/transporter state (RTDB)
└── FCM push notifications

Supabase
├── PostgreSQL (Business data, orders, produce listings, profiles)
└── Storage (Produce photos, profile photos, documents)

Google Cloud Vision
└── Assistive produce photo analysis (crop, visual condition, damage indicators)

Google Maps Platform
├── Interactive maps & marker rendering
├── Address geocoding
└── Route preview & ETA calculation

Browser Geolocation API
└── Current device position (permission-based)

Google Geolocation API
└── Server network-based position fallback

Sarvam AI
├── Speech-to-Text (Saaras model)
├── Text-to-Speech (Bulbul model)
├── Dynamic Translation (Mayura model)
├── Language Identification
├── Script Transliteration
└── Krishi AI Assistant (Tool-connected voice assistant)

Next.js API Routes
└── Integration orchestration, security boundary enforcement & domain validation
```

---

## Security Classification & Credential Isolation

| Credential Name | Environment Variable | Classification | Exposure Allowed |
|---|---|---|---|
| Google Maps API Key | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | CLIENT SAFE | Browser JS (Restricted by HTTP Referrers) |
| Google Vision API Key | `GOOGLE_VISION_API_KEY` | SERVER ONLY | Server API routes only |
| Google Geolocation API Key | `GOOGLE_GEOLOCATION_API_KEY` | SERVER ONLY | Server API routes only |
| Sarvam AI Key | `SARVAM_API_KEY` | SERVER ONLY | Server API routes only (`api-subscription-key`) |
| Supabase Service Role Key | `SUPABASE_SERVICE_ROLE_KEY` | SERVER ONLY | Server API routes only |
| Firebase Admin Key | `FIREBASE_PRIVATE_KEY` | SERVER ONLY | Server API routes only |

---

## Swappable Provider Abstraction Layer
Located in [`src/server/integrations/providers.ts`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/server/integrations/providers.ts):
- Interfaces defined: `VisionProvider`, `MapsProvider`, `SpeechToTextProvider`, `TextToSpeechProvider`, `TranslationProvider`, `LanguageDetectorProvider`.
- Default concrete implementations allow swappability without altering frontend components.

---

## API Endpoints Reference
- `POST /api/ai/vision/produce`: Process produce photo assistance.
- `POST /api/ai/speech-to-text`: Convert spoken audio to transcript & extract intent.
- `POST /api/ai/text-to-speech`: Synthesize regional audio response.
- `POST /api/ai/detect-language`: Identify script/language of input.
- `POST /api/ai/translate`: Dynamically translate text.
- `POST /api/ai/transliterate`: Transliterate script for search.
- `POST /api/ai/krishi-assistant`: Process voice/text query with tool calls & confirmation draft flow.
- `GET /api/location/geocode`: Address geocoding.
- `GET /api/location/route`: Route ETA calculation.
- `GET /api/location/distance`: Haversine straight-line distance estimation.
- `GET /api/health/providers`: Health status of all third-party integrations.

---

## Testing & Verification
Execute the comprehensive automated test suite:
```bash
npm run test:thirdparty
```
All 8 verification tests pass with 100% coverage of fallback and contract requirements.
