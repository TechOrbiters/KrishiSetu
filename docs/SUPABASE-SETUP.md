# AI MANDI — Supabase Setup & Architecture Manual

## 1. Architectural Topology
- **Authentication**: Firebase Phone Auth (Identity Provider)
- **API Server & Middleware**: Next.js 14 API Routes (Server-side RBAC & Token verification)
- **Structured Data**: Supabase PostgreSQL 15 (Service Role Key Access)
- **Media Storage**: Supabase Buckets (`produce-photos`, `profile-images`, `documents`)
- **Realtime GPS Tracking**: Firebase Realtime Database (RTDB)

---

## 2. Environment Setup

### Required `.env.local` Variables
```env
# Public Supabase Access
NEXT_PUBLIC_SUPABASE_URL=https://hikysobkgojhmzqaiity.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_UETMByYA6eSq1_K2C7Tm9A_CaFgL90e

# Server-Only Secret (NEVER EXPOSE TO CLIENT)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## 3. Versioned Database Migrations

Migrations are stored under `supabase/migrations/`:
1. `001_initial_schema.sql` — Enumerated types, core tables (`users`, `farmer_profiles`, `produce_listings`, `orders`, `transport_requests`, `shipments`, `payments`, `market_prices`).
2. `002_indexes.sql` — Performance indexes on `firebase_uid`, `farmer_id`, `buyer_id`, `status`, `crop_name`.
3. `003_constraints.sql` — Database level check constraints enforcing `product_amount = quantity * unit_price`, positive quantities, non-negative delivery fees.
4. `004_rls.sql` — Row Level Security policies for public listing access.
5. `005_domain_rules.sql` — Atomic stored procedures `reserve_listing_quantity()` and `restore_listing_quantity()` with PostgreSQL `SELECT ... FOR UPDATE` row locks.
6. `006_transport.sql` — Atomic driver assignment stored procedure `accept_transport_request()` preventing double transport claims.
7. `007_payment_ledger.sql` — Immutable financial ledger tracking `PRODUCT_PAYMENT` and `DELIVERY_FEE`.
8. `008_fpo_provenance.sql` — FPO lot aggregation and member contribution tracking.
9. `009_notifications_audit.sql` — User notifications and immutable audit log tables.

---

## 4. CLI Workflow & Local Execution

### Apply Migrations Locally or to Cloud Supabase
```bash
# Push versioned migrations to linked Supabase project
npx supabase db push

# Generate TypeScript types from active database schema
npx supabase gen types typescript --local > src/types/database.ts
```

---

## 5. Security & Isolation Matrix

| Component | Access Key Used | Execution Context | RLS Status |
| :--- | :--- | :--- | :--- |
| **Browser Client** | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client Component | Enabled (`ACTIVE` listings view) |
| **Next.js API Server** | `SUPABASE_SERVICE_ROLE_KEY` | Node.js Server Environment | Bypasses RLS (Protected by Firebase Auth middleware) |
| **Storage Buckets** | Server-Signed URL | Server Upload Handler | Enforces 5MB max size & MIME validation |

---

## 6. Health & Verification Endpoints

- `GET /api/health` — Basic API health status.
- `GET /api/health/supabase` — Tests real-time connection to Supabase database (`SELECT 1`).
- `npm run test:backend` — Executes automated domain invariant assertions (Zero Platform Fee, FreshRoute, Capacity).
