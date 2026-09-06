# AI MANDI — Supabase Database Data Cleanup Audit

**Audit Date:** September 6, 2026  
**Environment:** Staging / Production Development  
**Database URL:** `https://hikysobkgojhmzqaiity.supabase.co`  
**Auditor:** AI MANDI Engineering Agent  
**Status:** Completed — Inspection & Impact Analysis (No destructive SQL executed)

---

## Executive Summary

An exhaustive inspection of the Supabase PostgreSQL database was conducted using direct service-role queries and compared against the constitutional platform baselines:
- `CLAUDE.md`
- `DECISIONS.md`
- `DOMAIN-RULES.md`
- `docs/DATABASE-DESIGN.md`
- `src/lib/seedData.ts`
- `src/lib/store/farmerStore.tsx`
- `supabase/migrations/001_initial_schema.sql` through `014_notifications_fcm.sql`

### Current Database Live State
Every table in the active public schema has been inspected. Following the recent verification suites and test cleanup, the table row counts are:

| Table Name | Schema Status | Current Live Row Count | Data Classification |
| :--- | :--- | :--- | :--- |
| **`users`** | Exists | **0 rows** | Clean (All test UIDs removed) |
| **`farmer_profiles`** | Exists | **0 rows** | Clean |
| **`fpo_profiles`** | Exists | **0 rows** | Clean |
| **`fpo_memberships`** | Exists | **0 rows** | Clean |
| **`produce_listings`** | Exists | **0 rows** | Clean (Canonical table empty) |
| **`buyer_demands`** | Exists | **0 rows** | Clean |
| **`orders`** | Exists | **0 rows** | Clean |
| **`transport_requests`** | Exists | **0 rows** | Clean |
| **`shipments`** | Exists | **0 rows** | Clean |
| **`payments`** | Exists | **0 rows** | Clean |
| **`market_prices`** | Exists | **0 rows** | Clean (Ready for live AGMARKNET sync) |
| **`notifications`** | Exists | **0 rows** | Clean |
| **`audit_logs`** | Exists | **0 rows** | Clean |
| **`notification_devices`** | Not in public schema | — | Superseded / Unused |
| **`transporter_profiles`** | Not in public schema | — | Transporter data stored on `users` |
| **`buyer_profiles`** | Not in public schema | — | Buyer data stored on `users` |
| **`fcm_tokens`** | Not in public schema | — | FCM tokens stored on `users` or memory |
| **`listings`** | Not in public schema | — | Legacy table replaced by `produce_listings` |

---

## 1. Baseline Comparison & Dummy Data Analysis

### 1.1 Comparison with `seedData.ts` and `farmerStore.tsx`
- **`src/lib/seedData.ts`**: Contains static mock arrays created for UI mockup prototypes:
  - `INITIAL_USER`: Mock farmer *"रामेश्वर प्रसाद वर्मा"* (`9876543210`, Barabanki).
  - `INITIAL_PRODUCE`: 5 hardcoded items (`prod_1` to `prod_5`) with unverified image URLs.
  - `INITIAL_ORDERS`: 4 mock orders (`ord_1` to `ord_4`) with synthetic retailer names.
  - `INITIAL_MARKET_PRICES`: 6 hardcoded mandi prices from UP.
  - `INITIAL_FPO_MEMBERS`: 5 fake member names (`mem_1` to `mem_5`).
- **`src/lib/store/farmerStore.tsx`**: Has been completely decoupled from `INITIAL_PRODUCE` and `INITIAL_MARKET_PRICES`. The store now starts with empty states (`listings: []`, `marketPrices: []`) and strictly loads data via typed API requests to Supabase (`/api/listings`, `/api/orders`, `/api/users/me`).
- **Database Status**: None of the static records from `seedData.ts` are present in PostgreSQL.

### 1.2 Comparison with `CLAUDE.md`, `DECISIONS.md`, and `DOMAIN-RULES.md`
- **`CLAUDE.md` §1 & §2**: Mandates an authentic decision-and-fulfillment layer. Fake listings with simulated orders violate the live fulfillment invariants.
- **`DECISIONS.md` D-002 & D-005**: 
  - Roles must be strictly `FARMER_FPO`, `BUYER`, `TRANSPORTER`, `ADMIN`.
  - Money math is strictly segregated (`product_amount` to farmer, `delivery_fee` to transporter, platform fee ₹0).
- **`DOMAIN-RULES.md` R-001..R-008**:
  - Test accounts with unverified Firebase UIDs or hardcoded test phones must not mix with authentic farmer/buyer data.
  - All produce listings must enforce positive price, positive quantity, and real freshness deadlines.
- **Database Migrations (`001` to `014`)**:
  - All 14 SQL migrations contain purely structural DDL (`CREATE TABLE`, `CREATE TYPE`, `CREATE INDEX`, `ALTER TABLE ... ADD CONSTRAINT`, and RLS policies).
  - There are **zero `INSERT` statements** in any migration file.

---

## 2. Table-by-Table Detailed Audit Report

### 2.1 `users`
- **Current Row Count:** `0`
- **Classification:** Clean / Real
- **Source:** Created dynamically during Firebase Phone Auth registration (`/api/auth/otp/verify` or `/api/auth/bootstrap`).
- **Safe-to-Delete:** Yes, in development/testing. In production, only delete test UIDs (`demo_uid_*`, test phone numbers).
- **Dependencies:**
  - Referenced by: `farmer_profiles(user_id)`, `fpo_profiles(admin_user_id)`, `fpo_memberships(farmer_user_id)`, `produce_listings(farmer_id)`, `buyer_demands(buyer_id)`, `orders(buyer_id, farmer_id)`, `transport_requests(transporter_id)`, `shipments(transporter_id)`, `payments(payer_id, payee_id)`.
- **Recommended Action:** Preserve table schema. Ensure that any future cleanup removes test users while preserving authentic registered farmers/buyers.

### 2.2 `farmer_profiles`
- **Current Row Count:** `0`
- **Classification:** Clean / Real
- **Source:** Created during farmer KYC / profile completion (`/api/users/me`).
- **Safe-to-Delete:** Yes, in development.
- **Dependencies:**
  - Foreign key: References `users(id)` with `ON DELETE CASCADE`.
- **Recommended Action:** Preserve table schema. When resetting user data, deleting the parent `users` record automatically cascades and cleans this table.

### 2.3 `fpo_profiles` & `fpo_memberships`
- **Current Row Count:** `0` (both tables)
- **Classification:** Clean / Real
- **Source:** FPO manager registration and member aggregation.
- **Safe-to-Delete:** Yes, in development.
- **Dependencies:**
  - Foreign keys: References `users(id)`. `fpo_memberships` references `fpo_profiles(id)`.
- **Recommended Action:** Maintain clean state until real FPOs are onboarded.

### 2.4 `produce_listings` (Canonical Table)
- **Current Row Count:** `0`
- **Classification:** Clean / Real
- **Source:** Created by farmers via `/api/listings` wizard or API.
- **Safe-to-Delete:** Yes (safe to purge test listings).
- **Dependencies:**
  - Foreign key: References `users(id)` (`farmer_id`).
  - Referenced by: `orders(listing_id)`.
- **Recommended Action:** Single source of truth for produce. Test listings created during automation runs should be cleaned prior to production launch.

### 2.5 `buyer_demands`
- **Current Row Count:** `0`
- **Classification:** Clean / Real
- **Source:** Created by commercial/retail buyers via `/api/demands`.
- **Safe-to-Delete:** Yes.
- **Dependencies:**
  - Foreign key: References `users(id)` (`buyer_id`).
- **Recommended Action:** Retain empty for real buyer demand posting.

### 2.6 `orders`
- **Current Row Count:** `0`
- **Classification:** Clean / Real
- **Source:** Created when buyers purchase produce (`/api/orders`).
- **Safe-to-Delete:** Yes (safe to purge test orders).
- **Dependencies:**
  - Foreign keys: References `produce_listings(id)`, `users(id)` (`buyer_id`, `farmer_id`).
  - Referenced by: `transport_requests(order_id)`, `shipments(order_id)`, `payments(order_id)`.
- **Recommended Action:** Purge test orders before production. Never delete an order while downstream `shipments` or `payments` exist without `CASCADE`.

### 2.7 `transport_requests`
- **Current Row Count:** `0`
- **Classification:** Clean / Real
- **Source:** Generated automatically when delivery is required for an order.
- **Safe-to-Delete:** Yes.
- **Dependencies:**
  - Foreign keys: References `orders(id)` (`ON DELETE CASCADE`), `users(id)` (`transporter_id`).
- **Recommended Action:** Keep clean until real logistics partners accept shipments.

### 2.8 `shipments`
- **Current Row Count:** `0`
- **Classification:** Clean / Real
- **Source:** Created upon transporter acceptance and dispatch.
- **Safe-to-Delete:** Yes.
- **Dependencies:**
  - Foreign keys: References `orders(id)` (`ON DELETE CASCADE`), `users(id)` (`transporter_id`).
- **Recommended Action:** Safe to purge test shipments.

### 2.9 `payments`
- **Current Row Count:** `0`
- **Classification:** Clean / Real
- **Source:** Escrow ledger entries created upon order confirmation.
- **Safe-to-Delete:** Yes.
- **Dependencies:**
  - Foreign keys: References `orders(id)`, `users(id)` (`payer_id`, `payee_id`).
- **Recommended Action:** Maintain clean state for production payment gateway integration.

### 2.10 `market_prices`
- **Current Row Count:** `0`
- **Classification:** Clean / Reference Data
- **Source:** Populated from Government of India AGMARKNET / DoCA Price Monitoring System API.
- **Safe-to-Delete:** Safe to delete mock/cached entries. Real AGMARKNET data should be refreshed via the daily sync worker.
- **Dependencies:** No foreign key dependents.
- **Recommended Action:** Populate exclusively via live AGMARKNET background sync or seed script (`recorded_at = CURRENT_DATE`).

### 2.11 `notifications` & `audit_logs`
- **Current Row Count:** `0` (both tables)
- **Classification:** Clean / Operational Logs
- **Source:** System event dispatchers.
- **Safe-to-Delete:** Yes.
- **Dependencies:** References `users(id)`.
- **Recommended Action:** Periodically archive or purge test logs.

---

## 3. Seven Required Audit Questions & Answers

### 1. Exact Dummy Records
Test/dummy records in this repository originate from two categories:
1. **Automated Integration Tests (`tests/step*.ts`)**:
   - UIDs: `demo_uid_farmer`, `demo_uid_buyer`, `demo_uid_transporter_a`, `demo_uid_admin`, `demo_uid_unknown_farmer`.
   - Phones: `+919876543210`, `+919876543211`, `+919876543212`, `9876543210`.
   - Listing Crops: *"ताज़ा टमाटर (Fresh Tomato)"*, *"गोभी (Cauliflower)"*, *"आलू"*.
   - Order Numbers: Pattern `ORD-*` (e.g. `ORD-1788674...`).
2. **Prototype Scratch Scripts (`scratch/*.js`)**:
   - Phone verification test names: *"रामेश्वर किसान (Token Test)"*, *"F5kNvNQo8jNixp6SYdEZyhCKs2t2"*.
   - Synthetic addresses: *"ग्राम बहरामघाट, बाराबंकी"*, *"लखनऊ सब्जी मंडी बयार"*.

### 2. Records Dependent on Them
When a dummy `user` or `produce_listing` is created, foreign key constraints link downstream child records:
```
users (parent)
 ├── farmer_profiles (child: user_id)
 ├── fpo_profiles (child: admin_user_id)
 ├── fpo_memberships (child: farmer_user_id)
 ├── produce_listings (child: farmer_id)
 │    └── orders (child: listing_id)
 │         ├── transport_requests (child: order_id)
 │         ├── shipments (child: order_id)
 │         └── payments (child: order_id)
 ├── buyer_demands (child: buyer_id)
 ├── notifications (child: user_id)
 └── audit_logs (child: user_id)
```
Deleting a dummy user without cascading will violate foreign key constraints if child records exist.

### 3. Tables that Can Safely Be Cleaned
All operational tables can safely be wiped during staging/reset without affecting schema integrity:
- **100% Safe to Wipe Anytime (Operational Data):**
  `notifications`, `audit_logs`, `payments`, `shipments`, `transport_requests`, `orders`, `buyer_demands`, `produce_listings`.
- **Safe to Wipe in Development (Subject to Real User Onboarding):**
  `fpo_memberships`, `fpo_profiles`, `farmer_profiles`, `users`.
- **Reference Tables:**
  `market_prices` (can be truncated and re-fetched from AGMARKNET API).

### 4. Correct Deletion Order Based on Foreign Keys
To prevent foreign key constraint violations (`violates foreign key constraint`), tables must be cleaned in reverse topological dependency order:

```
Step 1:  notifications
Step 2:  audit_logs
Step 3:  payments
Step 4:  shipments
Step 5:  transport_requests
Step 6:  orders
Step 7:  produce_listings
Step 8:  buyer_demands
Step 9:  fpo_memberships
Step 10: fpo_profiles
Step 11: farmer_profiles
Step 12: market_prices
Step 13: users (Parent)
```

### 5. Whether a Complete Development Reset is Safer
**Yes, a complete development reset using `TRUNCATE ... CASCADE` is substantially safer than manual, selective record deletion:**
- **Why:** In PostgreSQL, selective `DELETE` statements on parent tables can trigger partial failure if child records exist in un-audited tables, leaving orphaned state.
- **Advantage of `TRUNCATE ... CASCADE`:**
  1. Atomically clears all rows across all interrelated tables in a single transaction.
  2. Resets auto-increment sequences (if any).
  3. Completely preserves table structures, column datatypes, check constraints, foreign keys, indexes, triggers, and Row Level Security (RLS) policies.
  4. Guarantees zero leftover foreign key dangling references.

### 6. SQL that Would Be Used

#### A. Inspection SQL (Dry Run — Non-Destructive)
Run this in the Supabase SQL Editor to inspect all row counts without modifying data:
```sql
SELECT 
    schemaname,
    relname AS table_name,
    n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname ASC;
```

#### B. Execution SQL (Clean Reset — Preserving All Schemas & DDL)
To wipe all mock/test rows across the entire database in a single atomic transaction while preserving every table, constraint, index, and RLS policy:
```sql
BEGIN;

TRUNCATE TABLE
    public.notifications,
    public.audit_logs,
    public.payments,
    public.shipments,
    public.transport_requests,
    public.orders,
    public.produce_listings,
    public.buyer_demands,
    public.fpo_memberships,
    public.fpo_profiles,
    public.farmer_profiles,
    public.market_prices,
    public.users
CASCADE;

COMMIT;
```

#### C. Verification Query (Confirm Empty State)
```sql
SELECT 'users' AS tbl, count(*) FROM users
UNION ALL SELECT 'farmer_profiles', count(*) FROM farmer_profiles
UNION ALL SELECT 'produce_listings', count(*) FROM produce_listings
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'shipments', count(*) FROM shipments
UNION ALL SELECT 'transport_requests', count(*) FROM transport_requests
UNION ALL SELECT 'payments', count(*) FROM payments
UNION ALL SELECT 'buyer_demands', count(*) FROM buyer_demands
UNION ALL SELECT 'market_prices', count(*) FROM market_prices;
```

### 7. Whether Any Data Should Be Preserved
- **Data That MUST NOT Be Preserved (Purged):**
  - Any user with `phone` in `('9876543210', '9876543211', '9876543212')` or `firebase_uid` starting with `demo_uid_`.
  - Any test listing created by automated test runners (`ताज़ा टमाटर`, `गोभी (Cauliflower)`).
  - Any dummy orders with synthetic order numbers (`ORD-*`).
- **Data That SHOULD Be Preserved (If Present):**
  - **Live Admin Credentials:** Any authentic administrator UID provisioned for production monitoring.
  - **Verified Market Prices:** Real daily AGMARKNET mandi feeds for Uttar Pradesh districts (if imported from data.gov.in).
  - **All DDL Structures:** All 14 migrations, RLS policies, custom enum types (`user_role`, `listing_status`, `order_status`, `shipment_status`, `transport_status`, `payment_status`), and indexes.

---

## 4. Conclusion & Next Steps

The database is currently clean, with zero orphan rows and all 13 canonical tables empty and fully intact. 

When you are ready to begin production onboarding or run live user registrations:
1. Authentic farmers will register via Firebase OTP and auto-provision their own rows in `users` and `farmer_profiles`.
2. Produce listings created via the web app will populate `produce_listings` as the sole source of truth.
3. No seed data or mock fallbacks will be injected.
