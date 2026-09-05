# AI MANDI — Third-Party Integration Audit & Architecture Blueprint

**Audit Timestamp**: September 5, 2026

## 1. Executive Summary & Service Responsibility Matrix
This audit establishes the strict responsibility boundaries for all third-party services in **AI MANDI (Kisan Setu)**:

- **Firebase**: Phone Authentication, Firebase UID identity, Realtime shipment/transporter GPS state stream (`/shipments`), FCM push notifications.
- **Supabase**: PostgreSQL 15 structured business data, Supabase Storage (`produce-photos`, `profile-images`, `documents`).
- **Google Cloud Vision API**: Produce photo visual assistance (crop detection, condition, visual damage cues). *Server-only, non-authoritative*.
- **Google Maps Platform**: Browser-facing interactive maps, route visualization, distance/ETA estimation. *Client-restricted browser key*.
- **Browser Geolocation API**: Device position retrieval (`navigator.geolocation.getCurrentPosition`) upon user permission.
- **Google Geolocation API**: Fallback network-based location estimation when browser position is unavailable.
- **Sarvam AI**: Indic Speech-to-Text (Saaras), Text-to-Speech (Bulbul), Translation, Language Identification, Transliteration, and Krishi AI Assistant. *Server-only*.
- **Next.js API Routes**: Integration orchestration, rate limiting, error normalization, and business rule enforcement.

---

## 2. Credential Security Classification

| Credential Name | Scope | Variable Name | Exposed to Client? | Security Restrictions |
| :--- | :--- | :--- | :--- | :--- |
| **Google Maps JS API Key** | CLIENT SAFE | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | YES (Browser) | HTTP Referrer + API Restriction |
| **Google Vision API Key** | SERVER ONLY | `GOOGLE_VISION_API_KEY` | **NO** | Kept in server environment |
| **Google Geolocation API Key**| SERVER ONLY | `GOOGLE_GEOLOCATION_API_KEY` | **NO** | Kept in server environment |
| **Sarvam AI API Key** | SERVER ONLY | `SARVAM_API_KEY` | **NO** | Kept in server environment |
| **Supabase Service Key** | SERVER ONLY | `SUPABASE_SERVICE_ROLE_KEY` | **NO** | Server API routes only |
| **Firebase Admin Secrets** | SERVER ONLY | `FIREBASE_PRIVATE_KEY` | **NO** | Server API routes only |

---

## 3. Provider Abstraction & Fallback Strategy
All external provider calls pass through normalized interfaces. If an external service fails or exceeds rate limits:
- **Vision Failure**: System alerts farmer ("AI photo assistance unavailable") and enables manual crop dropdown selection.
- **Maps / Route Failure**: System falls back to Haversine straight-line estimation clearly labeled as "Approximate ETA".
- **Sarvam STT / TTS Failure**: System falls back to text input / text output without blocking marketplace functionality.
- **Geolocation Permission Denied**: System defaults to manual Village/District/State selector.
