# FARMER-INTEGRATION-BASELINE.md — AI MANDI / KRISHISETU

> **Audit Baseline & Gap Analysis for Farmer / FPO Experience**  
> *Date:* September 6, 2026  
> *Scope:* Complete evaluation of Farmer/FPO UI pages, Zustand stores, API routes, Database tables, Firebase/Supabase services, and AI integrations against Domain Invariants (`DOMAIN-RULES.md`).

---

## 1. Executive Summary

This document establishes the official technical baseline for the **Farmer & FPO Experience** in AI MANDI (KrishiSetu). The codebase possesses a visually rich, responsive Next.js frontend with mobile-tailored Hindi UI components and comprehensive domain documentation. However, the Farmer/FPO workflow currently relies heavily on client-side Zustand store state (`farmerStore`) initialized with mock seed data (`seedData.ts`), leaving key database tables (`listings`, `orders`, `transport_requests`, `fpo_members`) disconnected from live CRUD APIs.

The objective of the Farmer/FPO Integration plan is to wire all UI pages directly to Supabase PostgreSQL, Firebase RTDB, OSRM Routing, and Sarvam/Gemini AI APIs while strictly maintaining existing visual layouts and enforcing business invariants (e.g., R-002: 100% product price revenue to farmer, R-010: freshness window required, R-012: order acceptance auto-creates transport request).

---

## 2. Feature Classification Matrix

Legend:
- **WORKING**: Fully functional end-to-end (UI ↔ API ↔ DB / External Service).
- **PARTIAL**: UI works and connects to mock store or some APIs, but missing complete DB persistence or real-time sync.
- **MOCKED**: UI functions only with hardcoded or Zustand in-memory mock seed data.
- **DISCONNECTED**: Page/Component exists but is not linked to backend routes or state handlers.
- **BROKEN**: Runtime error or non-functional state handler.
- **MISSING**: Documented requirement absent from codebase.

| Feature Area | Sub-Component / Route | Current Classification | Technical Summary & Gap |
| :--- | :--- | :---: | :--- |
| **Authentication & Sync** | `src/app/auth/farmer/page.tsx`<br>`src/app/api/auth/sync/route.ts` | **WORKING** | Firebase Phone OTP dispatch, Invisible reCAPTCHA, OTP confirmation, and `/api/auth/sync` Supabase upsert fully connected. |
| **Farmer Dashboard** | `src/app/farmer/dashboard/page.tsx` | **PARTIAL** | Reads `farmerStore` in-memory state. Displays live market ticker, but does not fetch user-specific listings/orders from `/api/listings` or `/api/orders`. |
| **Produce Listings List** | `src/app/farmer/listings/page.tsx` | **PARTIAL** | Tab filtering ('ALL', 'ACTIVE', 'LOW_STOCK', 'EXPIRED'), search, pause/delete work in `farmerStore`, but not fetching from `GET /api/listings`. |
| **Add New Listing** | `src/app/farmer/listings/new/page.tsx` | **PARTIAL** | Multi-step form with voice & Google Vision photo scan integrations (`/api/ai/vision/produce`). Submitting updates `farmerStore` but does not issue `POST /api/listings` to Supabase. |
| **Listing Details** | `src/app/farmer/listings/[id]/page.tsx` | **PARTIAL** | Displays crop details, connects to `/api/ai/smart-match`, but price/quantity updates do not persist to backend DB. |
| **Orders List** | `src/app/farmer/orders/page.tsx` | **PARTIAL** | Tab navigation ('ALL', 'PLACED', 'ACCEPTED', 'DELIVERED'). State mutations stay inside `farmerStore` memory without calling `GET /api/orders`. |
| **Order Accept / Reject** | `src/app/farmer/orders/[id]/page.tsx`<br>`src/app/api/orders/[id]/status/route.ts` | **DISCONNECTED** | Order accept/reject buttons update `farmerStore` locally, but do not call `PATCH /api/orders/[id]/status` or auto-generate `transport_requests` record per R-012. |
| **Delivery & Live Map Tracking** | `src/app/farmer/delivery/page.tsx`<br>`src/app/farmer/delivery/[id]/page.tsx` | **PARTIAL** | Leaflet + OpenStreetMap + OSRM route calculation works cleanly, but simulated vehicle movement is disconnected from Firebase RTDB live tracking (`/shipments/{id}/location`). |
| **Bazaar Bhav / Market Prices** | `src/app/farmer/market-prices/page.tsx`<br>`src/app/api/market-prices/route.ts` | **WORKING** | Connected to Government data.gov.in AGMARKNET proxy with local caching, search, district filtering, and fallback dataset. |
| **Krishi AI Voice Assistant** | `src/app/farmer/ai-assistant/page.tsx`<br>`src/app/api/ai/krishi-assistant/route.ts` | **WORKING** | Hindi/Regional voice and text AI assistant powered by Sarvam AI & Gemini fallback routes. |
| **AI Price & Sell Smart** | `src/app/farmer/ai-recommendations/page.tsx` | **PARTIAL** | Calculates price trends & connects to `/api/ai/smart-match`, but does not pull live buyer demand counts from `GET /api/demands`. |
| **FPO Member Management** | `src/app/farmer/fpo/members/page.tsx` | **PARTIAL** | Modal for adding FPO members mutates `farmerStore`, but does not save records to Supabase table `fpo_members`. |
| **FPO Bulk Lot Aggregation** | `src/app/farmer/fpo/aggregation/page.tsx` | **DISCONNECTED** | Combines member produce into an aggregated lot, but does not write contribution records to database or link member IDs to created listing. |
| **FPO Inventory & Analytics** | `src/app/farmer/fpo/inventory/page.tsx`<br>`src/app/farmer/fpo/analytics/page.tsx` | **MOCKED** | Displays static stock and analytics metrics; no dynamic aggregation queries. |
| **Payments & Revenue** | `src/app/farmer/payments/page.tsx` | **MOCKED** | Enforces invariant R-002 in UI calculations (`revenue = price * qty`), but displays hardcoded transaction history. |
| **Help & Helpline 1551** | `src/app/farmer/help/page.tsx` | **WORKING** | Displays Kisan Call Center 1551 direct dialer, FAQ accordions, and dispute contact info. |
| **Transport Request View** | `src/app/farmer/transport/[id]/page.tsx` | **DISCONNECTED** | Detail view for transport request relies on seed data and isn't linked to `transport_requests` API. |

---

## 3. Critical Blockers Summary

1. **Persistence Gap**: Farmer state mutations (`addListing`, `acceptOrder`, `addFPOMember`, `updateListing`) remain isolated in browser memory (`farmerStore`) and do not persist to Supabase PostgreSQL database tables.
2. **Order Lifecycle & Transport Request Auto-Creation (Rule R-012 Violation)**: When a farmer accepts a delivery order in `src/app/farmer/orders/[id]/page.tsx`, it fails to invoke `PATCH /api/orders/[id]/status` to auto-insert a record into `transport_requests` and notify available transporters.
3. **Live GPS Stream Disconnect**: Delivery tracking page (`src/app/farmer/delivery/[id]/page.tsx`) uses client-side timer animation instead of subscribing to real-time transporter coordinates in Firebase RTDB (`firebaseRtdb` at `/shipments/{id}/location`).
4. **FPO Contribution Tracking**: FPO Lot Aggregation does not create relational database links between member records (`fpo_members`) and aggregated listings (`listings.fpo_aggregated`).

---

## 4. Exact Files Involved

### Frontend UI & Pages:
- [`src/app/auth/farmer/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/auth/farmer/page.tsx)
- [`src/app/farmer/dashboard/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/dashboard/page.tsx)
- [`src/app/farmer/listings/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/listings/page.tsx)
- [`src/app/farmer/listings/new/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/listings/new/page.tsx)
- [`src/app/farmer/listings/[id]/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/listings/[id]/page.tsx)
- [`src/app/farmer/orders/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/orders/page.tsx)
- [`src/app/farmer/orders/[id]/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/orders/[id]/page.tsx)
- [`src/app/farmer/delivery/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/delivery/page.tsx)
- [`src/app/farmer/delivery/[id]/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/delivery/[id]/page.tsx)
- [`src/app/farmer/fpo/members/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/fpo/members/page.tsx)
- [`src/app/farmer/fpo/aggregation/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/fpo/aggregation/page.tsx)
- [`src/app/farmer/payments/page.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/farmer/payments/page.tsx)

### State & Stores:
- [`src/lib/store/farmerStore.tsx`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/lib/store/farmerStore.tsx)

### Backend API Routes:
- [`src/app/api/listings/route.ts`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/api/listings/route.ts)
- [`src/app/api/orders/route.ts`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/api/orders/route.ts)
- [`src/app/api/orders/[id]/status/route.ts`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/api/orders/[id]/status/route.ts)
- [`src/app/api/demands/route.ts`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/api/demands/route.ts)
- [`src/app/api/ai/smart-match/route.ts`](file:///c:/Users/abhis/Downloads/AI%20MANDI/docs/src/app/api/ai/smart-match/route.ts)

---

## 5. Implementation Roadmap & Order

1. **Phase 1: Listings Persistence & API Sync**
   - Wire `farmerStore` and `src/app/farmer/listings/new/page.tsx` to `POST /api/listings`.
   - Fetch real user listings from `GET /api/listings?farmerId=...` on Dashboard and Listings pages.
2. **Phase 2: Order Management & Rule R-012 Enforcement**
   - Connect Order Accept/Reject UI in `src/app/farmer/orders/[id]/page.tsx` to `PATCH /api/orders/[id]/status`.
   - Ensure backend status endpoint auto-creates `transport_requests` record upon transitioning `PLACED` -> `ACCEPTED`.
3. **Phase 3: Live Delivery Tracking & Firebase RTDB Integration**
   - Subscribe `src/app/farmer/delivery/[id]/page.tsx` to live Firebase RTDB location stream `/shipments/{id}/location`.
4. **Phase 4: FPO Member & Aggregated Lot DB Storage**
   - Connect FPO member creation and bulk lot aggregation forms to database tables (`fpo_members`, `fpo_contributions`).
5. **Phase 5: Payments & Settlement Real Data Calculation**
   - Compute real revenue totals from completed orders in `src/app/farmer/payments/page.tsx` enforcing Rule R-002 (`farmer_revenue = product_price * quantity`).
