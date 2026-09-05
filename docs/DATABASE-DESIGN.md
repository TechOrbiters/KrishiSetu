# DATABASE-DESIGN.md — AI MANDI
### PostgreSQL schema · ERD · enums · constraints · indexes

**Read first:** `CLAUDE.md`, `DOMAIN-RULES.md`, `docs/BACKEND-DESIGN.md`.
**Engine:** PostgreSQL 15+ (Supabase). Naming: `snake_case` tables/columns, plural table names, `id` UUID primary keys, `created_at`/`updated_at` on every table.

> **Money rule in the schema:** product amount and delivery fee are **separate columns** on `orders`; the farmer's credit equals the product amount and the transporter's credit equals the delivery fee — never blended (`DOMAIN-RULES.md` R-001..R-004). Money is stored as `NUMERIC(12,2)` (rupees) or integer paise; **never float**.

---

## 1. Entity-relationship overview

```
                         ┌──────────┐
                         │  users   │ (role, buyer_type, verification)
                         └────┬─────┘
       ┌───────────┬─────────┼───────────┬──────────────┐
       ▼           ▼         ▼           ▼              ▼
farmer_profiles  fpo_    buyer_      transporter_    (admin uses users
   │             profiles profiles   profiles         + admin_scope)
   │ member_of ─────┘        │           │
   ▼                         │           ▼
 farms                       │        vehicles
   │                         │
   ▼                         │
produce_listings ◄───────────┼──────── freshness_windows (1:1 w/ listing)
   │   │                     │
   │   └───────► buyer_demands (posted requirements)
   │                 │
   ▼                 ▼
 matches (listing × buyer/demand, score) ─────► ai_recommendations
   │
   ▼
 orders ──► order_items
   │  │
   │  └──► payments (settlement-ready stub)
   ▼
transport_requests ──► shipments ──► shipment_tracking (live points)
   │                         │
   └──► (SmartTransport ranks transporters/vehicles)
                         ratings ◄── (buyer↔farmer↔transporter)
                         disputes
                         notifications
   price_history · demand_forecasts  (market/AI reference data)
```

---

## 2. Enumerated types

```sql
CREATE TYPE user_role       AS ENUM ('FARMER_FPO','BUYER','TRANSPORTER','ADMIN','LOGISTICS_PARTNER');
-- LOGISTICS_PARTNER reserved / Phase-2, not assignable to live users in MVP (DOMAIN-RULES R-006)

CREATE TYPE buyer_type      AS ENUM ('CONSUMER','BUSINESS');
CREATE TYPE farmer_kind     AS ENUM ('INDIVIDUAL','FPO');       -- distinguishes farmer vs FPO within FARMER_FPO
CREATE TYPE verification_status AS ENUM ('UNVERIFIED','PENDING','VERIFIED','REJECTED');

CREATE TYPE listing_status  AS ENUM ('ACTIVE','LOW_STOCK','ORDER_RECEIVED','EXPIRED','SOLD_OUT','INACTIVE');
CREATE TYPE quality_grade   AS ENUM ('A','B','C','UNGRADED');

CREATE TYPE delivery_method AS ENUM ('DELIVERY_PARTNER','SELF_PICKUP');

CREATE TYPE order_status    AS ENUM
  ('PLACED','ACCEPTED','SELF_PICKUP','PACKED','DISPATCHED','IN_TRANSIT','DELIVERED','CANCELLED');

CREATE TYPE transport_request_status AS ENUM ('OPEN','ASSIGNED','ACCEPTED','EXPIRED','CANCELLED');

CREATE TYPE shipment_status AS ENUM
  ('SCHEDULED','PICKED_UP','OUT_FOR_DELIVERY','DELIVERED','FAILED','CANCELLED');

CREATE TYPE freshness_state AS ENUM ('SAFE','AT_RISK','EXPIRED');

CREATE TYPE payment_status  AS ENUM ('PENDING','HELD','SETTLED','REFUNDED','FAILED');
CREATE TYPE payee_role      AS ENUM ('FARMER_FPO','TRANSPORTER','PLATFORM');

CREATE TYPE vehicle_type    AS ENUM ('MINI_TRUCK','PICKUP','TEMPO','LARGE_TRUCK','TRACTOR_TROLLEY','TWO_WHEELER');
CREATE TYPE transporter_availability AS ENUM ('ONLINE','OFFLINE','ON_TRIP');

CREATE TYPE demand_status   AS ENUM ('OPEN','MATCHED','FULFILLED','EXPIRED','CANCELLED');
CREATE TYPE ai_kind         AS ENUM ('DEMAND_FORECAST','SELL_SMART','SMART_MATCH','SMART_TRANSPORT','FRESH_ROUTE','OPPORTUNITY_SCORE');
CREATE TYPE dispute_status  AS ENUM ('OPEN','IN_REVIEW','RESOLVED','REJECTED');
CREATE TYPE notification_type AS ENUM
  ('NEW_ORDER','ORDER_ACCEPTED','ORDER_STATUS','DEMAND_UP','PRICE_OPPORTUNITY',
   'FRESHNESS_EXPIRING','TRANSPORTER_NEARBY','PRODUCE_AVAILABLE','NEW_JOB','DELIVERY_DELAYED','PENDING_ASSIGNMENT');
```

---

## 3. Core tables

### 3.1 `users`
The single identity table for all roles.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK, default `gen_random_uuid()` | |
| `role` | `user_role` NOT NULL | one of four active values (R-006) |
| `full_name` | `text` NOT NULL | |
| `phone` | `text` UNIQUE NOT NULL | primary auth identifier |
| `email` | `text` UNIQUE | optional (admins) |
| `password_hash` | `text` | only for password roles (admin); argon2/bcrypt |
| `buyer_type` | `buyer_type` | required iff `role='BUYER'` |
| `preferred_language` | `text` NOT NULL default `'hi'` | ISO code; admin defaults `'en'` |
| `verification` | `verification_status` NOT NULL default `'UNVERIFIED'` | |
| `aadhaar_last4` | `char(4)` | masked; raw never stored here |
| `aadhaar_ref` | `text` | opaque ref to encrypted vault entry, nullable |
| `region_scope` | `text` | admin scope (state/district), nullable |
| `avatar_url` | `text` | |
| `is_active` | `boolean` NOT NULL default `true` | |
| `created_at` `updated_at` | `timestamptz` NOT NULL default `now()` | |

Constraints: `CHECK (role <> 'LOGISTICS_PARTNER')` on insert of live users in MVP (or enforce in app); `CHECK (role='BUYER' = (buyer_type IS NOT NULL))`.

### 3.2 `farmer_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK→users UNIQUE NOT NULL | |
| `kind` | `farmer_kind` NOT NULL | INDIVIDUAL or FPO |
| `father_or_spouse_name` | `text` | scr-001 |
| `dob` | `date` | |
| `gender` | `text` | |
| `village` `post_office` `district` `state` `pincode` | `text` | location (scr-001) |
| `geo_lat` `geo_lng` | `numeric(9,6)` | geocoded |
| `registered_on` | `date` | |
| `rating_avg` | `numeric(2,1)` default 0 | |
| `reliability_score` | `numeric(5,2)` default 0 | on-time %, completion |

### 3.3 `fpo_profiles`
For `FARMER_FPO` users whose `kind='FPO'`; captures aggregation stats (scr-011: "250+ Farmers · 20+ Products · 98% On-time").

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK→users UNIQUE NOT NULL | the FPO account |
| `fpo_name` | `text` NOT NULL | |
| `member_count` | `int` default 0 | |
| `product_count` | `int` default 0 | |
| `on_time_pct` | `numeric(5,2)` | |
| `district` `state` | `text` | |
| `verified` | `boolean` default false | |

FPO membership link:
```sql
CREATE TABLE fpo_memberships (
  id uuid PK,
  fpo_id uuid REFERENCES fpo_profiles(id),
  farmer_profile_id uuid REFERENCES farmer_profiles(id),
  joined_on date default now(),
  UNIQUE (fpo_id, farmer_profile_id)
);
```

### 3.4 `farms`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `farmer_profile_id` | `uuid` FK→farmer_profiles | |
| `name` | `text` | |
| `area_acres` | `numeric(8,2)` | |
| `geo_lat` `geo_lng` | `numeric(9,6)` | |
| `primary_crops` | `text[]` | |

### 3.5 `buyer_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK→users UNIQUE NOT NULL | |
| `business_name` | `text` | null for consumers |
| `buyer_type` | `buyer_type` NOT NULL | mirrors users.buyer_type |
| `city` `district` `state` `pincode` | `text` | |
| `geo_lat` `geo_lng` | `numeric(9,6)` | delivery default location |
| `rating_avg` | `numeric(2,1)` | |
| `reliability_score` | `numeric(5,2)` | used by SmartMatch (5%) |
| `orders_count` `total_saved` | `int` / `numeric(12,2)` | scr-009 impact stats |

### 3.6 `transporter_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK→users UNIQUE NOT NULL | |
| `display_name` | `text` | "Raj Transport" |
| `availability` | `transporter_availability` default `OFFLINE` | Online toggle (scr-004) |
| `home_lat` `home_lng` | `numeric(9,6)` | |
| `current_lat` `current_lng` | `numeric(9,6)` | live location |
| `location_updated_at` | `timestamptz` | |
| `rating_avg` | `numeric(2,1)` | ★4.8 |
| `ratings_count` | `int` | (128) |
| `on_time_pct` | `numeric(5,2)` | 98% |
| `total_trips` | `int` | |
| `earnings_month` | `numeric(12,2)` | ₹42,850 (denormalized cache) |

### 3.7 `vehicles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `transporter_profile_id` | `uuid` FK→transporter_profiles | (Phase-2: or `logistics_partner_id`) |
| `type` | `vehicle_type` NOT NULL | |
| `registration_no` | `text` UNIQUE | "UP32 AB 1234" |
| `capacity_kg` | `int` NOT NULL | 1000 |
| `is_active` | `boolean` default true | |

---

## 4. Marketplace tables

### 4.1 `produce_listings`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `farmer_profile_id` | `uuid` FK→farmer_profiles NOT NULL | seller (farmer or FPO) |
| `crop` | `text` NOT NULL | e.g., "Tomato" |
| `variety` | `text` | |
| `quantity_kg` | `numeric(10,2)` NOT NULL | available quantity |
| `min_order_kg` | `numeric(10,2)` | scr-016 "कम से कम 50kg" |
| `price_per_kg` | `numeric(10,2)` NOT NULL | product price (R-002 basis) |
| `quality` | `quality_grade` NOT NULL default `UNGRADED` | |
| `harvest_date` | `date` | |
| `cultivation_location` | `text` | |
| `geo_lat` `geo_lng` | `numeric(9,6)` | |
| `status` | `listing_status` NOT NULL default `ACTIVE` | |
| `views_count` | `int` default 0 | scr-016 |
| `photo_urls` | `text[]` | object-storage keys |
| `created_via` | `text` | 'MANUAL' \| 'VOICE' \| 'PHOTO' |
| `created_at` `updated_at` | `timestamptz` | |

Constraints: `CHECK (quantity_kg >= 0)`, `CHECK (price_per_kg >= 0)`.

### 4.2 `freshness_windows` (1:1 with listing)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `listing_id` | `uuid` FK→produce_listings UNIQUE NOT NULL | |
| `window_hours` | `int` NOT NULL | e.g., 24 |
| `perishable` | `boolean` NOT NULL default true | |
| `set_at` | `timestamptz` default now() | |

Rule: perishable listings **must** have a window (R-010) — enforce in app + `CHECK (NOT perishable OR window_hours > 0)`.

### 4.3 `buyer_demands` (posted requirements)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `buyer_profile_id` | `uuid` FK→buyer_profiles NOT NULL | |
| `crop` | `text` NOT NULL | |
| `quantity_kg` | `numeric(10,2)` NOT NULL | |
| `price_min` `price_max` | `numeric(10,2)` | price range |
| `delivery_location` | `text` | |
| `geo_lat` `geo_lng` | `numeric(9,6)` | |
| `needed_by` | `date` | |
| `status` | `demand_status` default `OPEN` | |

### 4.4 `matches`
Result of SmartMatch (listing ↔ buyer/demand).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `listing_id` | `uuid` FK→produce_listings NOT NULL | |
| `buyer_profile_id` | `uuid` FK→buyer_profiles | |
| `demand_id` | `uuid` FK→buyer_demands | nullable |
| `match_score` | `numeric(5,2)` NOT NULL | 0–100 |
| `score_breakdown` | `jsonb` NOT NULL | {price, distance, quantity, quality, delivery_time, reliability} |
| `recommended_price` | `numeric(10,2)` | |
| `reason` | `text` | human-readable |
| `confidence` | `numeric(4,3)` | 0–1 |
| `created_at` | `timestamptz` | |

---

## 5. Order & fulfilment tables

### 5.1 `orders`
The money model lives here — **product and delivery kept separate** (R-001).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `order_code` | `text` UNIQUE NOT NULL | human ref "ORD5678" |
| `buyer_profile_id` | `uuid` FK→buyer_profiles NOT NULL | |
| `seller_farmer_profile_id` | `uuid` FK→farmer_profiles NOT NULL | farmer/FPO |
| `status` | `order_status` NOT NULL default `PLACED` | state machine |
| `delivery_method` | `delivery_method` NOT NULL | partner or self-pickup |
| `product_amount` | `numeric(12,2)` NOT NULL | Σ(item price×qty) — farmer's revenue (R-002) |
| `delivery_fee` | `numeric(12,2)` NOT NULL default 0 | transporter's pay (R-003); 0 for self-pickup |
| `platform_fee` | `numeric(12,2)` NOT NULL default 0 | ₹0 in MVP (R-005) |
| `total_amount` | `numeric(12,2)` NOT NULL | = product_amount + delivery_fee + platform_fee (R-004) |
| `accept_deadline` | `timestamptz` | 12h accept window (scr-010) |
| `accepted_at` | `timestamptz` | |
| `placed_at` | `timestamptz` default now() | |
| `delivered_at` | `timestamptz` | |
| `cancelled_reason` | `text` | |

Constraints (encode the domain rules directly):
```sql
CHECK (delivery_fee >= 0 AND product_amount >= 0 AND platform_fee >= 0),
CHECK (total_amount = product_amount + delivery_fee + platform_fee),   -- R-004
CHECK (delivery_method <> 'SELF_PICKUP' OR delivery_fee = 0)           -- R-013
```

### 5.2 `order_items`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `order_id` | `uuid` FK→orders NOT NULL | |
| `listing_id` | `uuid` FK→produce_listings NOT NULL | |
| `crop` | `text` | snapshot |
| `quantity_kg` | `numeric(10,2)` NOT NULL | |
| `price_per_kg` | `numeric(10,2)` NOT NULL | snapshot of product price |
| `line_amount` | `numeric(12,2)` NOT NULL | = quantity_kg × price_per_kg |

`orders.product_amount` MUST equal `Σ order_items.line_amount` (enforced in service + verified by test).

### 5.3 `transport_requests`
Auto-created when a delivery order is accepted (R-012).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `order_id` | `uuid` FK→orders UNIQUE NOT NULL | |
| `pickup_lat` `pickup_lng` | `numeric(9,6)` NOT NULL | farm/FPO |
| `drop_lat` `drop_lng` | `numeric(9,6)` NOT NULL | buyer |
| `distance_km` | `numeric(8,2)` | |
| `freshness_deadline` | `timestamptz` NOT NULL | placed_at + window_hours |
| `required_capacity_kg` | `numeric(10,2)` NOT NULL | |
| `estimated_fare` | `numeric(12,2)` | becomes order.delivery_fee on accept |
| `status` | `transport_request_status` default `OPEN` | |
| `created_at` | `timestamptz` | |

### 5.4 `shipments`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `transport_request_id` | `uuid` FK→transport_requests UNIQUE NOT NULL | |
| `transporter_profile_id` | `uuid` FK→transporter_profiles NOT NULL | |
| `vehicle_id` | `uuid` FK→vehicles | |
| `status` | `shipment_status` NOT NULL default `SCHEDULED` | |
| `smarttransport_score` | `numeric(5,2)` | ranking that won |
| `score_breakdown` | `jsonb` | {distance_to_pickup,capacity,fare,availability,rating} |
| `route_polyline` | `text` | optimized route (OR-Tools/Maps) |
| `eta` | `timestamptz` | |
| `freshness_state` | `freshness_state` default `SAFE` | must be SAFE at accept (R-009) |
| `picked_up_at` `delivered_at` | `timestamptz` | |

Constraint (freshness gate at persistence): a shipment may be created/accepted only when `eta <= transport_requests.freshness_deadline` (enforced in service; asserted by test — R-009).

### 5.5 `shipment_tracking`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `shipment_id` | `uuid` FK→shipments NOT NULL | |
| `lat` `lng` | `numeric(9,6)` NOT NULL | |
| `recorded_at` | `timestamptz` default now() | live points for the map |

### 5.6 `payments` (settlement-ready stub)
Records who is owed what; no live gateway in MVP (D-013).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `order_id` | `uuid` FK→orders NOT NULL | |
| `payee_role` | `payee_role` NOT NULL | FARMER_FPO or TRANSPORTER (or PLATFORM if fee>0) |
| `payee_user_id` | `uuid` FK→users NOT NULL | |
| `amount` | `numeric(12,2)` NOT NULL | farmer=product_amount; transporter=delivery_fee |
| `status` | `payment_status` default `PENDING` | |
| `settled_at` | `timestamptz` | |

Invariant (R-002/R-003/R-022): the FARMER_FPO payee amount = `orders.product_amount`; the TRANSPORTER payee amount = `orders.delivery_fee`; sum of payee amounts + platform_fee = `orders.total_amount`.

---

## 6. Supporting tables

### 6.1 `ratings`
| Column | Type | Notes |
|---|---|---|
| `id` uuid PK · `order_id` uuid FK · `rater_user_id` uuid FK · `ratee_user_id` uuid FK · `stars` int CHECK 1–5 · `comment` text · `created_at` timestamptz | | buyer↔farmer↔transporter |

### 6.2 `disputes`
| `id` uuid PK · `order_id` uuid FK · `raised_by_user_id` uuid FK · `category` text (delivery/quality/payment) · `status` dispute_status default OPEN · `resolution` text · `resolved_by` uuid FK→users(admin) · timestamps |

### 6.3 `notifications`
| `id` uuid PK · `user_id` uuid FK · `type` notification_type · `title` text · `body` text · `payload` jsonb · `deep_link` text · `read_at` timestamptz · `created_at` timestamptz |

### 6.4 `ai_recommendations`
Generic store of any AI output for audit/explainability (R-016).

| `id` uuid PK · `kind` ai_kind · `subject_type` text · `subject_id` uuid · `score` numeric(6,3) · `value` jsonb · `breakdown` jsonb · `reason` text · `confidence` numeric(4,3) · `used_fallback` boolean · `model_version` text · `created_at` timestamptz |

### 6.5 `price_history` (market reference, from AGMARKNET/DoCA PMS)
| `id` uuid PK · `crop` text · `market` text · `state` text · `date` date · `min_price` numeric · `max_price` numeric · `modal_price` numeric · `unit` text ('per_quintal'/'per_kg') · `source` text · UNIQUE(crop,market,date) |

### 6.6 `demand_forecasts` (DemandSense output cache)
| `id` uuid PK · `crop` text · `location` text · `horizon_days` int · `expected_demand_kg` numeric · `expected_supply_kg` numeric · `gap_kg` numeric · `trend_pct` numeric · `confidence` numeric(4,3) · `model_version` text · `generated_at` timestamptz |

---

## 7. Key relationships (cardinality)

A `user` has exactly one role and one matching profile row (farmer/fpo/buyer/transporter); admins use `users` + `region_scope`. A `farmer_profile` has many `farms` and many `produce_listings`; each listing has one `freshness_window` and appears in many `matches`. A `buyer_profile` posts many `buyer_demands` and places many `orders`. An `order` has many `order_items`, at most one `transport_request` (delivery orders only), and one-or-two `payments` rows (farmer, and transporter if delivered). A `transport_request` yields one `shipment`; a `shipment` has many `shipment_tracking` points and is carried by one `transporter_profile`/`vehicle`. FPO membership links many `farmer_profiles` to one `fpo_profile`.

---

## 8. Indexes (hot paths)

```sql
CREATE INDEX ON produce_listings (crop, status);
CREATE INDEX ON produce_listings (geo_lat, geo_lng);          -- proximity search
CREATE INDEX ON produce_listings (farmer_profile_id, status);
CREATE INDEX ON buyer_demands (crop, status);
CREATE INDEX ON orders (buyer_profile_id, status);
CREATE INDEX ON orders (seller_farmer_profile_id, status);
CREATE INDEX ON orders (status, placed_at);
CREATE INDEX ON transport_requests (status, freshness_deadline);
CREATE INDEX ON shipments (transporter_profile_id, status);
CREATE INDEX ON shipment_tracking (shipment_id, recorded_at);
CREATE INDEX ON notifications (user_id, read_at);
CREATE INDEX ON price_history (crop, market, date);
CREATE INDEX ON matches (listing_id, match_score DESC);
```
For heavier geo work, consider PostGIS (`geography` columns + GiST index) in place of lat/lng pairs.

---

## 9. Integrity & invariants summary (maps to DOMAIN-RULES)

- `orders.total_amount = product_amount + delivery_fee + platform_fee` — **R-004** (DB CHECK).
- self-pickup ⇒ `delivery_fee = 0` — **R-013** (DB CHECK).
- farmer payment amount = `product_amount`; transporter payment amount = `delivery_fee` — **R-002/R-003** (service + test).
- perishable listing ⇒ freshness window present — **R-010** (CHECK + app).
- shipment accepted only if `eta ≤ freshness_deadline` — **R-009** (service + test).
- order status changes follow the state machine — **R-011** (service).
- live users never have `role='LOGISTICS_PARTNER'` — **R-006** (app/CHECK).
- money columns are `NUMERIC`/paise, never float — **R-022**.
- Aadhaar stored only as `aadhaar_last4` + encrypted vault ref — **R-019**.

---

## 10. Seed data (for demo & tests)

Seed at least: 1 admin (English), 2 FPOs (e.g., Sharma FPO, Verma FPO) with member farmers, 3 individual farmers (Ramesh, Suresh, Arvind), listings across tomato/potato/wheat/onion with freshness windows, 2 buyers (one CONSUMER "Preeti", one BUSINESS "Rohit"/store), 3 transporters (Raj Transport / Mini Truck, Shakti Logistics, FastMove Cargo) with vehicles, a handful of orders spanning every `order_status`, matching price_history rows for the shown crops, and one open dispute — so every screen in `docs/UI-DESIGN.md` renders with realistic data and every state is exercised.
