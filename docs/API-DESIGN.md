# API-DESIGN.md — AI MANDI
### REST API · OpenAPI 3.x · per-endpoint contracts

**Read first:** `CLAUDE.md`, `docs/BACKEND-DESIGN.md`, `docs/DATABASE-DESIGN.md`, `docs/RBAC.md`.
**Base URL:** `/api` · **Auth:** Bearer token (JWT) unless marked public · **Format:** JSON · **Spec of record:** OpenAPI 3.x (this doc is its human companion).

> Every state-changing endpoint enforces RBAC and the domain rules server-side (`DOMAIN-RULES.md`). Product price and delivery fee are always returned as **separate fields**; the farmer is credited the product amount and the transporter the delivery fee.

---

## 1. Conventions

**Envelope.** Success: `{ "data": <payload>, "meta": {...} }`. Error: `{ "error": { "code": "STRING_CODE", "message": "human, localizable", "details": {...} } }`.
**IDs** are UUIDs. **Money** fields are decimal strings/numbers in rupees with 2 dp; product and delivery are never combined. **Timestamps** are ISO-8601 UTC.
**Pagination:** `?page=&limit=` → `meta: { page, limit, total }`. **Filtering/sorting** via query params documented per endpoint.
**Idempotency:** state-changing POSTs accept an `Idempotency-Key` header.
**Localization:** `Accept-Language` selects message language (default `hi`; admin `en`).

## 2. Auth model

`Authorization: Bearer <jwt>`. The JWT carries `sub` (user id) and `role`. Middleware verifies the token, loads the user, checks the route's allowed roles + permission, then services check ownership/scope. Wrong role → `403 FORBIDDEN`; missing/invalid token → `401 UNAUTHENTICATED` (`DOMAIN-RULES.md` R-007).

## 3. Standard error codes

| HTTP | `code` | When |
|---|---|---|
| 400 | `BAD_REQUEST` | malformed request |
| 401 | `UNAUTHENTICATED` | missing/invalid token |
| 403 | `FORBIDDEN` | role/ownership/scope denied |
| 404 | `NOT_FOUND` | resource absent |
| 409 | `CONFLICT` / `ILLEGAL_TRANSITION` | bad state change |
| 409 | `FRESHNESS_VIOLATION` | ETA exceeds freshness window (R-009) |
| 422 | `VALIDATION_ERROR` | schema/business validation failed |
| 429 | `RATE_LIMITED` | too many requests |
| 502 | `UPSTREAM_ERROR` | AI/Maps/BHASHINI failure (often degraded, not fatal) |

## 4. Namespaces (map)

`/auth` · `/users` · `/farmers` · `/fpos` · `/buyers` · `/produce` · `/demand` · `/matches` · `/orders` · `/transport` · `/transporters` · `/shipments` · `/freshness` · `/ai` · `/payments` · `/notifications` · `/admin`.

The per-endpoint template used throughout: **Method · URL · Auth · RBAC · Request · Validation · Response · Errors · Business rules · Example.**

---

## 5. `/auth`

### POST `/api/auth/otp/request` — public
Request an OTP for a phone.
- **Request:** `{ "phone": "9876543210" }`
- **Validation:** valid Indian mobile; rate-limited per phone/IP.
- **Response 200:** `{ "data": { "requestId": "uuid", "expiresIn": 300 } }`
- **Errors:** 422, 429.

### POST `/api/auth/otp/verify` — public
- **Request:** `{ "requestId": "uuid", "otp": "123456", "role": "FARMER_FPO" }` (role only on first registration)
- **Response 200:** `{ "data": { "token": "...", "refreshToken": "...", "user": {...} } }`
- **Business rules:** first verify creates the user with the chosen role (never `LOGISTICS_PARTNER` — R-006); subsequent verifies log in.
- **Errors:** 401 (bad OTP), 422, 429.

### POST `/api/auth/admin/login` — public
Admin email+password. **Response:** token+user. **Errors:** 401, 429.

### POST `/api/auth/refresh` · POST `/api/auth/logout` — authed
Rotate/revoke tokens.

---

## 6. `/users` & profiles

### GET `/api/users/me` — any authed
Returns the caller's user + role profile. **Response:** `{ data: { user, profile } }`.

### PATCH `/api/users/me` — any authed
Update own profile fields (name, language, location…). Aadhaar submitted here is stored masked + encrypted (R-019); response returns only `aadhaarLast4`.

### POST `/api/farmers/verify` — FARMER_FPO
Submit Aadhaar for verification → `verification=PENDING`. Admin approves later.

### GET `/api/fpos/:id` — authed
FPO public profile (name, member/product counts, on-time %, rating).

### GET `/api/fpos/:id/members` — FARMER_FPO (the FPO) / ADMIN
List member farmers. RBAC: only that FPO or an admin.

---

## 7. `/produce`

### POST `/api/produce` — FARMER_FPO
Create a listing.
- **Request:** `{ "crop":"Tomato","variety":"","quantityKg":500,"minOrderKg":50,"pricePerKg":24,"quality":"A","harvestDate":"2026-05-18","cultivationLocation":"Barabanki","geo":{"lat":..,"lng":..},"freshnessWindowHours":24,"perishable":true,"createdVia":"MANUAL","photoUrls":[] }`
- **Validation:** quantity/price ≥ 0; **perishable ⇒ freshnessWindowHours > 0** (R-010).
- **Response 201:** the listing + its freshness window.
- **Business rules:** seller = caller's farmer profile; status `ACTIVE`.
- **Errors:** 403 (not a farmer), 422.

### POST `/api/produce/from-voice` — FARMER_FPO
- **Request:** `multipart` audio + `language`.
- **Response 200:** `{ data: { draft: { crop, quantityKg, quality, location, ... }, confidence } }` — a **draft**, not a saved listing.
- **Business rules:** never persists without a follow-up confirm (`POST /api/produce` with the confirmed draft). Uses BHASHINI+LLM (R-018 boundaries).
- **Errors:** 422, 502 (STT/LLM upstream — degrade to manual form).

### POST `/api/produce/from-photo` — FARMER_FPO
Photo → suggested crop/quality draft (grade assist is advisory, not certified). Same draft-then-confirm contract.

### GET `/api/produce` — BUYER / authed
Search/browse listings.
- **Query:** `crop, q, near=lat,lng, radiusKm, maxPricePerKg, quality, fpoOnly, page, limit, sort`
- **Response 200:** paginated listings with `pricePerKg`, seller (name, verified, rating), distance, and market-comparison price where available.

### GET `/api/produce/:id` — authed
Listing detail incl. freshness window and seller trust info.

### PATCH `/api/produce/:id` · DELETE `/api/produce/:id` — FARMER_FPO (owner)
Edit/stock-adjust/delete. RBAC: owner only. Status transitions validated.

---

## 8. `/demand`

### POST `/api/demand` — BUYER
Post a requirement.
- **Request:** `{ "crop":"Onion","quantityKg":600,"priceMin":24,"priceMax":30,"deliveryLocation":"Lucknow","geo":{...},"neededBy":"2026-05-22" }`
- **Response 201:** the demand (`status=OPEN`). Triggers async matching to supply.

### GET `/api/demand` — BUYER (own) / ADMIN
List demands. Buyers see own; admin sees all (scoped).

### GET `/api/demand/:id/matches` — BUYER (owner) / ADMIN
Supply matched to this demand.

---

## 9. `/matches` (SmartMatch, seller side)

### GET `/api/matches/listing/:listingId` — FARMER_FPO (owner)
Ranked buyers for a listing (SmartMatch).
- **Response 200:** `{ data: [ { buyer:{...}, matchScore: 94, breakdown:{ price:0.9, distance:0.8, quantity:1.0, quality:0.7, deliveryTime:0.8, reliability:0.9 }, recommendedPrice: 24, reason: "Close by, pays above market, wants your full quantity", confidence: 0.86 } ] }`
- **Business rules:** weights **30/25/20/10/10/5** sum to 100 (R-014); every item carries breakdown + reason + confidence (R-016).
- **Errors:** 403 (not owner), 502 (AI upstream → heuristic fallback flagged).

### POST `/api/matches/:matchId/accept` — FARMER_FPO (owner)
Farmer accepts a matched buyer → creates a draft order / offer to the buyer.

---

## 10. `/orders`

### POST `/api/orders` — BUYER
Place an order (checkout).
- **Request:** `{ "items":[{"listingId":"uuid","quantityKg":20}], "deliveryMethod":"DELIVERY_PARTNER"|"SELF_PICKUP", "deliveryOptionId": "uuid?", "deliveryLocation":{...} }`
- **Validation:** items reference active listings with enough stock; if `SELF_PICKUP`, `deliveryFee=0`.
- **Response 201:**
```json
{ "data": { "id":"uuid","orderCode":"ORD5678","status":"PLACED",
  "productAmount":"3685.00","deliveryFee":"250.00","platformFee":"0.00","totalAmount":"3935.00",
  "deliveryMethod":"DELIVERY_PARTNER","acceptDeadline":"2026-05-20T22:30:00Z","items":[...] } }
```
- **Business rules (critical):** `productAmount = Σ line`, `deliveryFee` from chosen option (or 0), `totalAmount = productAmount + deliveryFee + platformFee`; **product and delivery are separate fields, never merged** (R-001/R-004). Notifies seller (`NEW_ORDER`).
- **Errors:** 422 (stock/quantity), 409.

### GET `/api/orders` — BUYER/FARMER_FPO (own) / ADMIN
List own orders (buyer: as buyer; farmer: as seller). Filter by `status`. Admin sees all (scoped).

### GET `/api/orders/:id` — parties + ADMIN
Order detail with itemized amounts, status, parties, and (if any) shipment/tracking summary. RBAC: buyer, seller, assigned transporter, or admin only.

### POST `/api/orders/:id/accept` — FARMER_FPO (seller)
Accept an order within the accept window.
- **Response 200:** updated order (`ACCEPTED`, then `SELF_PICKUP` or delivery branch).
- **Business rules:** must be `PLACED` and within `acceptDeadline`; self-pickup ends here (no transport, fee 0 — R-013); delivery auto-creates a transport request (R-012).
- **Errors:** 403, 409 `ILLEGAL_TRANSITION`, 422 (window expired).

### POST `/api/orders/:id/cancel` — parties/ADMIN (per rules)
Cancel with reason if allowed by the state machine (R-011).

---

## 11. `/transport`

### GET `/api/transport/requests/:orderId` — seller/buyer/ADMIN
The transport request for a delivery order (status, distance, freshness deadline, estimated fare).

### POST `/api/transport/requests` — FARMER_FPO / BUYER (system-invoked on accept)
Create a transport request (normally auto-created; exposed for completeness/retry).
- **Request:** `{ "orderId":"uuid","pickupLocation":{lat,lng},"deliveryLocation":{lat,lng},"freshnessDeadline":"...","requiredCapacityKg":500 }`
- **Response 201:**
```json
{ "data": { "requestId":"uuid","eligibleTransporters":[
    {"transporterId":"uuid","name":"Raj Transport","score":94,
     "breakdown":{"distanceToPickup":0.9,"capacity":1.0,"fare":0.8,"availability":1.0,"rating":0.96},
     "estimatedFare":"1250.00","eta":"2026-05-20T15:00:00Z","freshnessStatus":"SAFE"} ],
  "estimatedFare":"1250.00","estimatedDeliveryTime":"2h30m","freshnessStatus":"SAFE" } }
```
- **Business rules:** `eligibleTransporters` are SmartTransport-ranked (30/25/20/15/10 — R-015) and **FreshRoute-filtered** so only `freshnessStatus=SAFE` options appear as acceptable (R-009).
- **Errors:** 409 (order not accepted), 502.

### GET `/api/transport/available` — TRANSPORTER
Nearby open jobs for the caller (SmartMatch job feed, scr-004), each with load, pickup→drop, km, ETA, fare, pickup window, and `freshnessStatus`.

### POST `/api/transport/requests/:id/accept` — TRANSPORTER
Accept a job.
- **Response 200:** created shipment + updated order (`delivery_fee = fare`, status `PACKED`).
- **Business rules:** **rejected if ETA > freshness deadline** → `409 FRESHNESS_VIOLATION` (R-009); sets the order's delivery fee = accepted fare (R-003); recomputes total.
- **Errors:** 403, 409 (already assigned), 409 `FRESHNESS_VIOLATION`.

### POST `/api/transport/requests/:id/reject` — TRANSPORTER
Decline a job.

---

## 12. `/transporters`

### GET `/api/transporters/me/earnings` — TRANSPORTER
Month earnings, per-trip average, on-time %, trip counts (scr-004 right rail).

### PATCH `/api/transporters/me/availability` — TRANSPORTER
`{ "availability":"ONLINE"|"OFFLINE" }` (the Online toggle).

### POST `/api/transporters/me/location` — TRANSPORTER
`{ "lat":.., "lng":.. }` live location ping (throttled).

### CRUD `/api/transporters/me/vehicles` — TRANSPORTER
Manage own vehicles (type, registration, capacity).

---

## 13. `/shipments`

### GET `/api/shipments/:id` — parties/ADMIN
Shipment detail: status, transporter, vehicle, route polyline, ETA, freshness state, stepper timestamps.

### PATCH `/api/shipments/:id/status` — TRANSPORTER (assigned) / ADMIN
Advance status `PICKED_UP → OUT_FOR_DELIVERY → DELIVERED`.
- **Business rules:** legal transitions only (R-011); on `DELIVERED`, order → `DELIVERED`, `delivered_at` set, stub settlement written (farmer=product, transporter=delivery — R-002/R-003).
- **Errors:** 403, 409 `ILLEGAL_TRANSITION`.

### GET `/api/shipments/:id/tracking` — parties/ADMIN
Live location points for the map.

### POST `/api/shipments/:id/tracking` — TRANSPORTER (assigned)
Append a live location point.

---

## 14. `/freshness`

### GET `/api/freshness/check` — authed
Query freshness feasibility for a candidate delivery.
- **Query:** `listingId, eta` (or pickup/drop + speed) → `{ data: { windowHours, remainingAtArrival:"18h20m", state:"SAFE"|"AT_RISK"|"EXPIRED", canDeliver:true } }`
- **Business rules:** the same computation FreshRoute uses; `canDeliver=false` when `eta > deadline` (R-009).

---

## 15. `/ai`

All are called by the Core Backend (server-to-server) and surfaced through the domain endpoints above; documented here for completeness. Each returns `score/value + breakdown + reason + confidence + modelVersion + usedFallback` (R-016).

### POST `/api/ai/demand` — FARMER_FPO/ADMIN (via backend)
DemandSense forecast for `crop × location × horizon` → `{ expectedDemandKg, expectedSupplyKg, gapKg, trendPct, confidence, reason }`. Statistical/ML, not LLM-guessed (R-018).

### POST `/api/ai/sellsmart` — FARMER_FPO (via backend)
Revenue comparison across selling options → best option + estimated **farmer revenue** (never nets out transport — R-002).

### POST `/api/ai/match` — (backend) → powers `/matches`
SmartMatch buyer scoring (weights 30/25/20/10/10/5).

### POST `/api/ai/transport-rank` — (backend) → powers `/transport`
SmartTransport transporter scoring (weights 30/25/20/15/10).

### POST `/api/ai/route` — (backend)
OR-Tools VRP → optimized route(s), total distance/cost, ETA, freshness feasibility, pooling suggestions.

### POST `/api/ai/assistant` — FARMER_FPO/BUYER/TRANSPORTER (via backend)
Krishi AI Assistant: `{ audioOrText, language }` → transcription, extracted intent/slots, and a data-grounded answer or a proposed action (requiring confirmation).

### GET `/api/ai/opportunity/:listingId` — FARMER_FPO
Optional single AI Opportunity Score (0–100) with 🟢/🟡/🔴 band and reason.

---

## 16. `/payments` (stub, settlement-ready)

### GET `/api/payments/order/:orderId` — parties/ADMIN
Payment status and the settlement breakdown: farmer amount = `productAmount`, transporter amount = `deliveryFee`, platform = `platformFee` (0). No live gateway in MVP (`DECISIONS.md` D-013); amounts reconcile to `totalAmount` (R-022).

---

## 17. `/notifications`

### GET `/api/notifications` — authed
Caller's notifications (paginated, `type`, `read`).
### PATCH `/api/notifications/:id/read` · POST `/api/notifications/read-all` — authed
Mark read.
### POST `/api/notifications/token` — authed
Register an FCM device token.

---

## 18. `/admin` (ADMIN only, region-scoped)

### GET `/api/admin/dashboard` — ADMIN
KPI bundle (scr-005): totals (farmers, FPOs, orders, active deliveries, farmer earnings), order-status breakdown, delivery overview, top produce, price-spread series, recent alerts.

### GET `/api/admin/verifications?role=&status=` — ADMIN
Verification queue.
### POST `/api/admin/verifications/:userId/approve` · `/reject` — ADMIN
Approve/reject a farmer/FPO/buyer/transporter (masked Aadhaar shown).

### GET `/api/admin/orders` · `/api/admin/transport` · `/api/admin/prices` — ADMIN
Operational monitoring (orders, delivery health/live map, farmer-vs-market spread).

### GET `/api/admin/disputes` · POST `/api/admin/disputes/:id/resolve` — ADMIN
List/resolve disputes.

### GET `/api/admin/reports?type=&range=` — ADMIN
Analytics/exports incl. farmer net realization, consumer landed price, logistics cost, spoilage.

---

## 19. Worked example — the freshness gate (R-009)

```
POST /api/transport/requests/req_123/accept        (TRANSPORTER token)
→ service computes eta = 2026-05-20T16:30Z
  freshness_deadline = 2026-05-20T15:00Z
  eta > deadline  ⇒  409
{ "error": { "code":"FRESHNESS_VIOLATION",
  "message":"यह डिलीवरी ताज़गी सीमा के अंदर पूरी नहीं हो सकती",
  "details": { "eta":"2026-05-20T16:30:00Z","freshnessDeadline":"2026-05-20T15:00:00Z" } } }
```
The same job never appears as an acceptable option in `GET /api/transport/available` for a vehicle that can't meet the window — FreshRoute filters it out before it's offered.

---

## 20. Worked example — pricing stays separated (R-001/R-004)

```
POST /api/orders   →  201
data.productAmount = "3685.00"     // farmer's revenue basis (R-002)
data.deliveryFee   = "250.00"      // transporter's pay (R-003)
data.platformFee   = "0.00"        // MVP (R-005)
data.totalAmount   = "3935.00"     // = 3685 + 250 + 0 (R-004)
```
No endpoint ever returns a single blended "price" that folds delivery into product.
