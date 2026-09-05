# AI MANDI / KRISHISETU — END-TO-END INTEGRATION AUDIT

## 1. Executive Summary
This audit inspects all capabilities of the **KRISHISETU (AI MANDI)** codebase to evaluate frontend-to-backend wiring, state ownership, database schemas, authentication, third-party services, error handling, and testing completeness.

---

## 2. Capabilities Status & Integration Classification

| Domain / Capability | Current Status | Implemented Components | Gaps / Missing Connections | Priority |
|---|---|---|---|---|
| **Authentication & Identity Bridge** | IMPLEMENTED | Firebase Phone Auth client, Firebase Admin ID token verification, Supabase `users` sync | Auto-provisioning user role assignment in Supabase requires explicit transaction safety | P0 |
| **RBAC & Resource Ownership** | IMPLEMENTED | `withAuth()`, `withRole()`, `withOwnership()` in `src/lib/auth/middleware.ts` | Ensure all API endpoints wrap request handlers with ownership checks | P0 |
| **Database & Schema** | IMPLEMENTED | Supabase PostgreSQL migrations 001–010, RLS policies, foreign key constraints | Verify RLS policy enforcement on custom RPC functions | P0 |
| **Typed API Client** | IMPLEMENTED | `src/lib/api/client.ts` with error normalization & correlation IDs | Replace any remaining component-level ad-hoc `fetch()` calls | P0 |
| **Produce Listings & Inventory** | IMPLEMENTED | `POST /api/listings`, `GET /api/listings`, `src/lib/domain/pricing.ts` | Connect listing wizard step 4 preview directly to Supabase RPC | P0 |
| **Buyer Demand & Matching** | IMPLEMENTED | `POST /api/demands`, `POST /api/ai/smart-match`, DemandSense engine | Wire DemandSense price range fallback when historical data is sparse | P1 |
| **Orders & 12h Acceptance Window** | IMPLEMENTED | `POST /api/orders`, `PATCH /api/orders/[id]/status`, cron expiry job | Ensure server time is authoritative for 12h acceptance deadline | P0 |
| **Transporter Marketplace & SmartTransport** | IMPLEMENTED | `src/lib/domain/freshness.ts`, vehicle capacity validation | Hard vehicle capacity constraint filter before LLM ranking | P0 |
| **FreshRoute & Freshness Engine** | IMPLEMENTED | 3-state Freshness model (`SAFE`, `AT_RISK`, `EXPIRED`) | Confirm `AT_RISK` requires explicit farmer confirmation | P0 |
| **Firebase Realtime Database & Live Tracking** | IMPLEMENTED | `src/lib/firebase/rtdb.ts`, `useShipmentTracking()` hook | Stale GPS threshold (>5 mins) label display on map components | P1 |
| **Google Maps Platform** | IMPLEMENTED | `src/lib/google/maps.ts`, `<MapComponent />`, geocoding, route ETA | Referrer-restriction validation for client browser API key | P1 |
| **Browser & Google Geolocation** | IMPLEMENTED | `src/lib/location/geolocation.ts`, manual village/district fallback | Verify permission denial triggers clean manual selector UI | P1 |
| **Google Cloud Vision API** | IMPLEMENTED | `src/lib/google/vision.ts`, `POST /api/ai/vision/produce` | Non-authoritative suggestion review modal on listing creation | P1 |
| **Sarvam AI Suite** | IMPLEMENTED | STT (Saaras), TTS (Bulbul), Translate (Mayura), Language ID, Transliteration | Error fallback to text when TTS audio stream fails | P1 |
| **Krishi AI Assistant** | IMPLEMENTED | `src/lib/sarvam/assistant.ts`, `POST /api/ai/krishi-assistant` | Draft confirmation guardrail before database mutation execution | P0 |
| **Financial Ledger & SellSmart** | IMPLEMENTED | `src/lib/domain/pricing.ts`, 0% farmer transport deduction rule | Enforce `farmerRevenue = askingPrice * quantity` server-side | P0 |
| **Notifications & FCM** | IMPLEMENTED | `src/lib/firebase/fcm.ts`, `public/firebase-messaging-sw.js` | Deduplication of FCM push payloads per order event | P1 |
| **FPO Aggregation & Provenance** | IMPLEMENTED | Migration 008, member lot aggregation | Partial lot sale provenance attribution tracking | P1 |
| **Offline Sync / PWA** | PARTIALLY IMPLEMENTED | Service worker caching, local draft queue | Server-side conflict resolution when syncing offline drafts | P2 |
| **Automated Testing Matrix** | IMPLEMENTED | Domain, Supabase backend, Firebase, and Third-Party integration test suites | Run 100% clean test execution across all 4 suites | P0 |

---

## 3. Recommended Remediation Order
1. **Phase 1**: Confirm End-to-End Authentication & Supabase User Sync.
2. **Phase 2**: Enforce Database Transactional Concurrency & Idempotency.
3. **Phase 3**: Verify Domain Services & Financial Revenue Isolation.
4. **Phase 4**: Connect All Frontend UI Pages via Typed API Client (`src/lib/api/client.ts`).
5. **Phase 5**: Verify Third-Party AI & Maps Services Fallbacks (Google Vision, Maps, Sarvam AI, Geolocation).
6. **Phase 6**: Execute All Automated Test Suites & Validate Golden Path.
