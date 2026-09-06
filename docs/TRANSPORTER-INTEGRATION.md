# KRISHISETU — Transporter Portal Architecture & Integration Guide

## 1. Overview
The **Transporter Portal** in **KrishiSetu** is a production-grade, first-class RBAC logistics execution interface seamlessly unified within the KrishiSetu ecosystem. It operates with zero mock data, real-time Supabase PostgreSQL persistence, Firebase Authentication, and strictly adheres to KrishiSetu Domain Rules.

---

## 2. Canonical RBAC & Role Model
KrishiSetu defines four active primary roles:
```
1. FARMER_FPO (farmer_kind = INDIVIDUAL | FPO)
2. BUYER (buyer_type = CONSUMER | BUSINESS)
3. TRANSPORTER (individual logistics operator / driver)
4. ADMIN (platform & regional oversight)
```
- **Transporter Identity**: Defined by role `TRANSPORTER`.
- **Server-Side Enforcement**: Authorization and identity are derived exclusively from verified Firebase session tokens mapped to `users` and `transporter_profiles` records in PostgreSQL. Client-supplied headers (`x-user-role`, `x-user-id`) are strictly untrusted.

### Transporter Permissions:
- `transporter.profile.read.self` / `transporter.profile.update.self`
- `transporter.availability.update.self` (Duty status: Online / Busy / Offline)
- `transporter.vehicle.manage.self` (Fleet CRUD, positive capacity validation, duplicate registration prevention)
- `transport.available.read.self` (SmartMatch job discovery filtered by vehicle type, capacity, duty status, and freshness deadline)
- `transport.job.accept.self` (Atomic conditional lock preventing double acceptance, HTTP 409 Conflict)
- `shipment.status.update.assigned` (Lifecycle: Arrive at pickup -> Pickup confirmed -> In transit -> Arrived at destination -> Delivered)
- `shipment.track.append.assigned` (Real-time telemetry, lat/lng updates, distance/ETA estimation)
- `transporter.earnings.read.self` (100% direct payout ledger under Rule R-001)
- `transporter.ratings.read.self` (Quality score, punctuality, produce handling, communication)

---

## 3. Database Relationships & Schema

```
                  ┌────────────────────┐
                  │       users        │
                  │  (role=TRANSPORTER)│
                  └─────────┬──────────┘
                            │ 1:1
              ┌─────────────┴─────────────┐
              │                           │ 1:N
              ▼                           ▼
    transporter_profiles              vehicles
    - vehicle_type                    - registration_number (UNIQUE)
    - capacity_kg                     - vehicle_type
    - is_available (duty)             - capacity_kg (> 0)
    - rating                          - is_active
                                      - verification_status

              ┌────────────────────┐
              │       orders       │
              └─────────┬──────────┘
                        │ 1:1 (on acceptance)
                        ▼
              transport_requests
              - order_id
              - transporter_id (NULL initially)
              - fare_amount
              - distance_km
              - status (REQUESTED | ASSIGNED | COMPLETED)
                        │
                        ▼ (on claim)
                  shipments
                  - order_id
                  - transport_request_id
                  - transporter_id
                  - vehicle_id
                  - pickup_lat, pickup_lng, pickup_address
                  - dest_lat, dest_lng, delivery_address
                  - status (ASSIGNED | PICKED_UP | IN_TRANSIT | ARRIVED_AT_DESTINATION | DELIVERED)
                  - current_lat, current_lng, last_location_update
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    payment_ledger               ratings
    - type = DELIVERY_CHARGE     - order_id, shipment_id
    - amount = 100% fare         - reviewer_id, reviewee_id
    - status = COMPLETED         - rating (1-5)
```

---

## 4. End-to-End Transport Lifecycle

### Step 1: Demand & Order Creation
- Farmer creates produce listing with freshness window.
- Buyer places order with separate itemized delivery fee.
- Farmer accepts order within the 12-hour acceptance window.

### Step 2: Auto-Generation of Transport Request
- When the farmer accepts the order (`POST /api/orders/[id]/accept`), a `transport_requests` record is automatically generated with `status = 'REQUESTED'`.

### Step 3: SmartMatch Job Discovery
- Transporter opens **Available Jobs** / **Smart Match** (`GET /api/transporters/jobs`).
- Algorithm ranks jobs using multi-factor weighting:
  - Distance fit (30%)
  - Vehicle capacity fit (25%)
  - Fare attractive rate (20%)
  - Driver availability (15%)
  - Transporter rating (10%)
- Validates crop freshness window using FreshRoute engine (`isFreshnessSafe = true`).

### Step 4: Atomic Job Acceptance
- Transporter accepts job (`POST /api/transport/requests/[id]/accept`).
- **Atomic Concurrency Protection**:
  ```sql
  UPDATE transport_requests
  SET transporter_id = $transporterId, status = 'ASSIGNED', updated_at = NOW()
  WHERE id = $id AND (status = 'REQUESTED' OR status = 'PENDING') AND transporter_id IS NULL;
  ```
  If zero rows are updated, the endpoint returns **HTTP 409 Conflict**:
  `"This transport job has already been claimed by another transporter."`
- On success, creates a canonical `shipments` record linked to the transporter and assigned vehicle.

### Step 5: Sequential Shipment Multi-Stage Execution
1. **Pickup Arrival & Confirmation**:
   - Transporter reaches mandi / farm: `POST /api/shipments/[id]/pickup`
   - Validates shipment ownership and transitions state to `PICKED_UP`.
2. **Transit Initiation**:
   - Driver starts moving: `POST /api/shipments/[id]/start`
   - Transitions state to `IN_TRANSIT`.
3. **Live GPS Telemetry**:
   - Driver telemetry posted: `POST /api/shipments/[id]/location`
   - Persists coordinates, calculates OSRM driving distance and ETA, and detects stale location (> 5 mins).
4. **Destination Arrival**:
   - Driver reaches buyer destination: `POST /api/shipments/[id]/arrive`
   - Transitions state to `ARRIVED_AT_DESTINATION`.
5. **Delivery Completion**:
   - Transporter submits proof of delivery: `POST /api/shipments/[id]/deliver`
   - Transitions shipment and order state to `DELIVERED`.
   - Triggers cross-RBAC notifications to Farmer and Buyer.

### Step 6: 100% Payout & Financial Settlement (Rule R-001)
- Under KrishiSetu Domain Rules (R-001, R-002, R-003):
  - Farmer gets 100% of product price.
  - Transporter receives **100% of delivery fee** with **₹0 platform deduction**.
- Verified in `payment_ledger` and queried via `GET /api/transporters/earnings`.

### Step 7: Verified Ratings & Reviews
- Buyer or Farmer submits verified rating: `POST /api/transporters/ratings`.
- Transporter profile rating recalculated; review appears in Transporter Ratings tab.

---

## 5. Transporter Portal UI Architecture
The portal is located at `/transporter` and built with nine specialized sub-views:
1. **TransporterDashboard**: Real-time KPI cards, active shipment spotlight, top-match banner, quick actions.
2. **TransporterSmartMatch**: Algorithmic job ranking cards with FreshRoute indicators, distance, and one-click accept/decline.
3. **TransporterMyTrips**: Filterable tabs (Pending, Active, Completed, Cancelled) with step-by-step lifecycle actions.
4. **TransporterLiveTracking**: Interactive OpenStreetMap / Leaflet map rendered dynamically via `LiveTrackingMap`. Shows pickup, live location, destination, route geometry, and turn-by-turn ETA.
5. **TransporterVehicles**: Fleet registry displaying vehicle cards, active status, payload capacity bars, and Add Vehicle modal.
6. **TransporterEarnings**: 100% payout ledger breakdown (Today, Week, Month, Pending), direct bank account specs, and itemized transaction history.
7. **TransporterRatings**: Overall quality score (4.9★), star distribution breakdown, punctuality/produce care metrics, and verified reviews.
8. **TransporterNotifications**: Real-time dispatch alerts, job assignments, delivery reminders, and settlement updates.
9. **TransporterProfile**: Driver identity details, duty switch (Online / On Duty / Offline), vehicle specs, and direct payout account.

---

## 6. Admin Transporter Oversight
- Integrated into `src/app/admin/page.tsx` under the **"Logistics & Transporters"** tab.
- Admins can inspect active transporters, verification statuses, vehicle counts, capacities, and duty states with regional scope enforcement.

---

## 7. Automated Test Suites & Verification
The logistics domain is continuously validated by automated test suites:
- `npm test`: Critical Domain Rules (R-001 to R-005 itemized pricing & 100% payout).
- `npm run test:step6`: Farmer -> Transporter auto-request generation, vehicle constraints, and atomic double-claim prevention (HTTP 409).
- `npm run test:step7`: Full delivery workflow, OSRM routing, FreshRoute evaluation, stale location detection, and HTTP 403 authorization.
- `npm run test:step8`: Payment ledger persistence, 100% driver settlement, FCM tokens, and domain event notifications.
- `npm run test:transporter`: End-to-end 9-step transporter lifecycle integration test suite.
