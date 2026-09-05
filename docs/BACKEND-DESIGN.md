# BACKEND-DESIGN.md — AI MANDI
### Services · modules · entities · layering · jobs · integrations

**Read first:** `CLAUDE.md`, `docs/TRD.md`, `docs/DATABASE-DESIGN.md`, `docs/API-DESIGN.md`.

> Two backends: a **Core Backend** (Node / Next.js API) owning identity, workflow, and the source-of-truth data; and an **AI Service** (Python / FastAPI) owning forecasting, scoring, and route optimization. The client talks only to the Core Backend.

---

## 1. Service topology

```
Client (Next.js PWA)
     │  REST /api (OpenAPI 3.x)
     ▼
Core Backend (Node)
  ├─ HTTP layer:      routes/controllers + validation + RBAC middleware
  ├─ Domain services: business logic, transactions, state machines
  ├─ Repositories:    typed DB access (PostgreSQL)
  └─ Integration adapters ──► AI Service · Maps · BHASHINI · FCM · Price feeds · Storage
     │  internal REST
     ▼
AI Service (FastAPI)
  ├─ DemandSense (statistical/ML forecasting)
  ├─ SellSmart   (revenue comparison)
  ├─ SmartMatch  (weighted buyer scorer)
  ├─ SmartTransport (weighted transporter scorer)
  ├─ FreshRoute  (freshness gate) + OR-Tools VRP router
  └─ Language adapters (Gemini/Vertex extraction & explanation; BHASHINI STT/TTS/translate)
```

The Core Backend is the trust boundary and the only place RBAC and the money/freshness invariants are enforced for writes. The AI Service is compute: given features, return scores/routes; it never writes business state directly.

---

## 2. Layering (Core Backend)

Requests flow **route → controller → service → repository → DB**, with adapters called from services.

- **Routes/controllers** parse and validate input against shared schemas, resolve the authenticated user, and delegate. No business logic here.
- **Middleware** (in order): request-id/logging → auth (verify token, load user) → RBAC (role + permission for the route) → rate limiting → validation → handler → error normalizer.
- **Services** hold all business logic and own transactions and state machines. They enforce the domain rules (money separation, farmer-full-price, freshness gate, legal transitions) and call adapters for AI/Maps/notifications.
- **Repositories** are the only code that touches SQL; parameterized queries only. They return typed domain objects.
- **Adapters** wrap each external dependency behind an interface so it can be mocked in tests and swapped without touching services.

Shared enums/types/validation come from `packages/shared` so the client, Core Backend, and (via generated stubs) the AI Service agree on shapes.

---

## 3. Domain modules & responsibilities

**Auth & Identity** — OTP request/verify, session/JWT issuance & refresh, admin password login, logout/revoke. Owns nothing about roles beyond issuing a token that carries the role.

**Users & Profiles** — CRUD for `users` and the four profile types; verification workflow (farmer Aadhaar, buyer/transporter KYC) with masked storage; language preference; admin region scope.

**Produce** — listing lifecycle (create via manual/voice/photo, edit, delete, status transitions active↔low-stock↔sold/expired), view counts, per-listing analytics; requires a freshness window for perishables.

**Demand** — buyer demand/requirement CRUD and its matching to supply.

**Matching** — orchestrates SmartMatch: gathers features (listing, candidate buyers/demands, distances, reliability), calls the AI Service, persists `matches`, returns ranked buyers with breakdown/reason/confidence. Also SellSmart (seller-side revenue comparison) and DemandSense retrieval.

**Orders** — cart→order placement, the order **state machine**, acceptance within the accept window, cancellation rules, totals composition (product/delivery/platform kept separate), and emitting the events that trigger transport creation and notifications.

**Transport** — on delivery-order acceptance, auto-create the `transport_request`; call SmartTransport for ranking and FreshRoute for the freshness filter; handle transporter accept (validating the freshness gate), and set the order's `delivery_fee` from the winning fare.

**Shipments** — shipment lifecycle and status updates (scheduled→picked up→out for delivery→delivered), live tracking ingestion, ETA, and freshness state.

**Freshness** — the shared freshness computations used by Transport/Shipments and exposed for display (window remaining, safe/at-risk/expired).

**Payments (stub)** — compose settlement records (farmer = product amount, transporter = delivery fee), expose payment status; no live gateway in MVP but settlement-ready.

**Notifications** — role/event fan-out via FCM (+SMS/WhatsApp fallback), localized, deep-linked, queued and retried.

**Ratings & Trust** — capture ratings post-delivery; recompute reliability scores used by SmartMatch/SmartTransport.

**Admin** — verification queues, user management, order/delivery/price/supply-demand monitoring, dispute resolution, reports/analytics (incl. farmer-vs-market spread), region scoping.

---

## 4. Backend entities (domain objects)

The service layer works with these domain entities (persisted per `docs/DATABASE-DESIGN.md`): **User, FarmerProfile, FPOProfile, BuyerProfile, TransporterProfile, LogisticsPartner (reserved), Vehicle, ProduceListing, FreshnessWindow, DemandRequest, BuyerMatch, Order, OrderItem, TransportRequest, Shipment, ShipmentTracking, Payment, Notification, Rating, Dispute, AIRecommendation, PriceHistory, DemandForecast.** Each has a repository; state-changing entities (Order, Shipment, TransportRequest, ProduceListing) have an owning service that guards their transitions.

---

## 5. Critical service flows

### 5.1 Place order → accept → fulfil (the spine)
1. **Checkout** (Buyer): `OrderService.place()` creates `orders` (+`order_items`) with `product_amount = Σ line_amount`, `delivery_fee` provisional (from the chosen option) or 0 for self-pickup, `total_amount` composed, `accept_deadline = now + 12h`. Status `PLACED`. Notify seller (`NEW_ORDER`).
2. **Accept** (Farmer/FPO): `OrderService.accept()` checks the caller owns the order and it's within `accept_deadline`; sets `ACCEPTED`. Then branches:
   - self-pickup → status `SELF_PICKUP`, `delivery_fee = 0`, no transport.
   - delivery → `TransportService.createRequest(order)` builds `transport_request` with `freshness_deadline = placed_at + window_hours`, then runs SmartTransport + FreshRoute.
3. **Transporter accept**: `TransportService.acceptJob()` validates FreshRoute (`eta ≤ freshness_deadline`, else reject with a specific error — R-009), creates the `shipment`, sets `orders.delivery_fee = winning_fare`, recomputes `total_amount`, status → `PACKED`/`DISPATCHED`.
4. **Progress**: `ShipmentService.updateStatus()` walks picked-up → out-for-delivery → delivered, ingesting tracking points; on delivered, `orders.status = DELIVERED`, `delivered_at` set, `PaymentService.settleStub()` writes farmer (product_amount) and transporter (delivery_fee) payment rows.

Every step is transactional and emits notifications; every write re-checks the relevant invariant.

### 5.2 Produce listing via voice
`ProduceService.createFromVoice(audio)` → Language adapter (BHASHINI STT + LLM slot extraction) returns `{crop, quantity, quality, location, ...}` → return a **draft** to the client for confirmation → on confirm, require a freshness window → persist listing (`created_via='VOICE'`). The assistant never publishes without user confirmation.

### 5.3 SmartMatch request
`MatchingService.rankBuyers(listingId)` → assemble features (candidate buyers/demands, Maps distances, buyer reliability) → `aiAdapter.smartMatch(features)` → persist `matches` with score/breakdown/reason/confidence → return ranked list. Weights fixed (30/25/20/10/10/5) and validated to sum to 100 (R-014).

---

## 6. State machines (owned by services)

**Order** (`OrderService`): `PLACED→ACCEPTED→(SELF_PICKUP | PACKED→DISPATCHED→IN_TRANSIT→DELIVERED)`, any non-terminal `→CANCELLED`. Illegal transitions throw `IllegalTransitionError` → HTTP 409 (R-011).
**Shipment** (`ShipmentService`): `SCHEDULED→PICKED_UP→OUT_FOR_DELIVERY→DELIVERED`, plus `FAILED/CANCELLED`.
**Transport request** (`TransportService`): `OPEN→ASSIGNED→ACCEPTED`, plus `EXPIRED/CANCELLED`.
**Listing** (`ProduceService`): `ACTIVE↔LOW_STOCK`, `ACTIVE→ORDER_RECEIVED`, `→SOLD_OUT/EXPIRED/INACTIVE`.

---

## 7. Background jobs & scheduling

Run outside the request path (queue + workers):
- **Price sync** — pull AGMARKNET / DoCA PMS daily into `price_history`.
- **Forecast refresh** — regenerate `demand_forecasts` per crop×location on a schedule; cache results.
- **Demand-supply scan** — detect regional surplus/shortage for the Admin dashboard and Smart Alerts (Phase-1.5 Surplus-to-Demand).
- **Notification fan-out** — batch and deliver notifications; retry failures.
- **Accept-deadline sweeper** — auto-flag/expire orders not accepted within the window.
- **Freshness watcher** — mark shipments/listings `AT_RISK`/`EXPIRING` and fire alerts.
- **Reliability recompute** — update buyer/farmer/transporter reliability scores after ratings/deliveries.
- **Earnings rollup** — refresh transporter `earnings_month` and farmer monthly earnings caches.

---

## 8. Integration adapters

**AI Service adapter** — typed client for `/demand`, `/sellsmart`, `/match`, `/transport-rank`, `/route`; handles timeouts, retries, and a heuristic fallback flag.
**Maps adapter** — geocoding, distance matrix, directions; keys stay server-side; responses cached.
**BHASHINI/LLM adapter** — STT, translation, TTS, and slot extraction; language routing; confirmation-before-action contract.
**FCM/SMS/WhatsApp adapter** — push + fallbacks; templated, localized messages.
**Price-feed adapter** — AGMARKNET/DoCA PMS ingestion with source tagging.
**Storage adapter** — object storage for photos/documents; signed URLs; validation.

Each adapter is defined by an interface with a mock implementation for tests; upstream failures degrade gracefully (`docs/TRD.md` §22) rather than failing the whole request.

---

## 9. Validation, errors, transactions

Input is validated at the edge with shared schemas (rejecting malformed requests with 422). Services throw typed domain errors — `ValidationError`(422), `NotFoundError`(404), `ForbiddenError`(403), `ConflictError`/`IllegalTransitionError`(409), `FreshnessViolationError`(409), `UpstreamError`(502) — normalized by middleware into the standard error envelope (`docs/API-DESIGN.md` §3). Multi-write operations (place order, accept+create transport, accept job+create shipment+update order, deliver+settle) run in DB transactions so partial failures never leave the money/state invariants violated.

---

## 10. Security responsibilities (backend)

RBAC on every protected route and ownership/scope checks in services (R-007/R-008); parameterized queries only (no string SQL); secrets from env/secret store, never in code (R-021); Aadhaar/phone masked, encrypted, access-logged (R-019); cross-user PII shaped by transaction context — e.g., a transporter receives pickup contact details only after accepting a job (R-020); rate limits on auth/AI/write endpoints; structured logs without secrets/PII; audit log for verification, dispute, and admin-override actions. Full policy in `docs/TRD.md` §20.

---

## 11. AI Service internals (FastAPI)

Stateless request handlers over versioned model artifacts. **DemandSense**: statistical/ML time-series with a seasonal/heuristic fallback and lowered confidence on thin data (R-018). **SellSmart**: deterministic revenue comparison across selling options (never subtracts transport — R-002). **SmartMatch / SmartTransport**: deterministic weighted scorers with fixed, sum-to-100 weights returning score + breakdown + reason + confidence (R-014/R-015/R-016). **FreshRoute + Router**: freshness feasibility filter plus an OR-Tools VRP minimizing distance + cost + delay penalty + freshness penalty under capacity/quantity/time-window/freshness constraints, with dynamic load pooling (R-009, `docs/AI-SYSTEM.md` §5). **Language**: Gemini/Vertex for extraction/explanation and BHASHINI for STT/translate/TTS — used for language only, never to invent forecast numbers. Every response carries `model_version` and `confidence`; results are cached where inputs repeat.

---

## 12. Configuration & environments

All configuration is environment-driven (dev/staging/prod): DB connection, AI-service URL, Maps/BHASHINI/LLM/FCM credentials, price-feed endpoints, rate-limit thresholds, and feature flags (e.g., `PAYMENTS_ENABLED=false`, `LOGISTICS_PARTNER_ENABLED=false` for MVP). No credential ever appears in source, docs, or logs. Feature flags let Phase-2 items (payments gateway, fleet role) light up without code forks.
