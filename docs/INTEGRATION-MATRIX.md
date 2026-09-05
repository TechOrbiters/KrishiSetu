# KRISHISETU / AI MANDI — FEATURE INTEGRATION MATRIX

This matrix maps every application feature from UI route to backend API, domain service, database tables, external providers, authentication requirements, realtime events, and test coverage.

---

## Complete Feature Integration Matrix

| Feature | UI Route | UI Action | API Endpoint | Domain Service | DB Table(s) | External Provider | Auth & Role | Realtime / Event | Automated Tests |
|---|---|---|---|---|---|---|---|---|---|
| **User Login & Phone Auth** | `/auth/farmer` | Submit Phone & OTP | `POST /api/auth/sync` | `verifyFirebaseIdToken()` | `users`, `farmer_profiles` | Firebase Auth | Phone OTP | — | `firebase-integration.test.ts` |
| **Produce Listing Creation** | `/farmer/listings/new` | Wizard Submit | `POST /api/listings` | `createProduceListing()` | `produce_listings`, `freshness_windows` | — | `FARMER_FPO` (Owner) | `LISTING_CREATED` | `supabase-backend.test.ts` |
| **Produce Photo Assist** | `/farmer/listings/new` | Upload Photo | `POST /api/ai/vision/produce` | `analyzeProduceImage()` | Supabase Storage (`produce-photos`) | Google Cloud Vision | `FARMER_FPO` | — | `third-party-integrations.test.ts` |
| **My Listings Dashboard** | `/farmer/listings` | View / Filter Listings | `GET /api/listings` | `getFarmerListings()` | `produce_listings` | — | `FARMER_FPO` | Realtime status | `supabase-backend.test.ts` |
| **Buyer Demand Matching** | `/farmer/ai-recommendations` | View Recommended Demands | `POST /api/ai/smart-match` | `calculateSmartMatch()` | `buyer_demands`, `produce_listings` | — | `FARMER_FPO` | — | `domain-rules.test.ts` |
| **Order Acceptance (12h)** | `/farmer/orders/[id]` | Accept Order | `PATCH /api/orders/[id]/status` | `acceptOrderWithWindow()` | `orders`, `produce_listings` | — | `FARMER_FPO` (Owner) | `ORDER_ACCEPTED` / FCM | `domain-rules.test.ts` |
| **SmartTransport Selection** | `/farmer/orders/[id]` | Request Transport | `POST /api/orders/[id]/transport` | `selectSmartTransport()` | `transport_requests`, `transporter_profiles` | — | `FARMER_FPO` | `TRANSPORT_REQUESTED` | `supabase-backend.test.ts` |
| **FreshRoute Validation** | `/farmer/orders/[id]` | Check Delivery Route | `GET /api/location/route` | `evaluateFreshness()` | `freshness_windows` | Google Maps Directions | `FARMER_FPO` | — | `domain-rules.test.ts` |
| **Live Transit Tracking** | `/farmer/delivery/[id]` | View Live GPS Map | `GET /api/location/geocode` | `useShipmentTracking()` | `shipments` | Google Maps JS, Firebase RTDB | `FARMER_FPO` / `TRANSPORTER` | RTDB location stream | `third-party-integrations.test.ts` |
| **Payment Payout Ledger** | `/farmer/payments` | View Payout Breakdown | `GET /api/orders` | `calculateFarmerRevenue()` | `payments`, `orders` | — | `FARMER_FPO` (Owner) | `PAYMENT_SETTLED` | `domain-rules.test.ts` |
| **Krishi AI Voice Assistant** | `/farmer/ai-assistant` | Speak / Type Query | `POST /api/ai/krishi-assistant` | `processKrishiAssistantRequest()` | Domain tool queries | Sarvam AI (STT/TTS/Translate) | `FARMER_FPO` | — | `third-party-integrations.test.ts` |
| **Market Prices & Trends** | `/farmer/market-prices` | Search Commodity Prices | `GET /api/market-prices` | `getMarketPrices()` | `market_prices` | AgMarkNet / DoCA | Public / `FARMER_FPO` | — | `supabase-backend.test.ts` |
| **FPO Lot Aggregation** | `/farmer/fpo/aggregation` | Combine Member Lots | `POST /api/fpo/aggregation` | `aggregateMemberLots()` | `fpo_member_lots`, `produce_listings` | — | `FARMER_FPO` (FPO Admin) | — | `supabase-backend.test.ts` |
| **Provider Health Check** | `/api/health/providers` | System Diagnostic | `GET /api/health/providers` | Provider Health Monitor | Config Status | Google, Sarvam, Firebase, Supabase | Internal / Diagnostic | — | `third-party-integrations.test.ts` |
