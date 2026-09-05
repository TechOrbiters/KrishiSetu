# AI MANDI — Supabase Backend Setup Audit

**Audit Timestamp**: September 5, 2026

## 1. Current State Summary
- **Framework**: Next.js 14 App Router (TypeScript 5.3)
- **Authentication**: Firebase Admin SDK server-side token verification with fallback demo mode.
- **Database Layer**: Supabase PostgreSQL 15 client initialized via `@supabase/supabase-js`.
- **Domain Invariants**: Tested and enforced (`pricing.ts` zero platform fee, `freshness.ts` 3-state FreshRoute, `aiEngine.ts` Zod validation).
- **Environment**: Development server running on port 3000.

---

## 2. Existing Supabase Integration
- **`src/lib/supabase/server.ts`**: Service-role admin client created via `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- **`supabase/migrations/20260905000000_init_schema.sql`**: Initial database schema containing tables, atomic stored procedures (`reserve_listing_quantity`, `restore_listing_quantity`), and indexes.

---

## 3. Existing Firebase Integration
- **`src/lib/auth/firebaseAdmin.ts`**: Verifies Bearer JWTs server-side, extracts `uid` and `phone_number`.
- **`src/lib/auth/middleware.ts`**: Role-based access control (RBAC) guard verifying `FARMER`, `BUYER`, `TRANSPORTER`, `FPO_ADMIN`.
- **`src/app/api/auth/sync/route.ts`**: Bridge mapping `firebase_uid` to Supabase `users` table.

---

## 4. Missing Pieces
1. **Client-side Supabase client**: `src/lib/supabase/client.ts` for browser-safe/public read requests.
2. **Modular versioned migrations**: Migrations split into ordered `001` through `009` files under `supabase/migrations/`.
3. **TypeScript Database Types**: `src/types/database.ts` representing exact Supabase schema.
4. **Health Check Endpoints**: `/api/health` and `/api/health/supabase`.
5. **Buyer Demands Endpoints**: Full lifecycle `/api/demands/*` connecting demand to supply.
6. **Storage Bucket Config**: Server-signed policies for `produce-photos`, `profile-images`, and `documents`.
7. **Comprehensive Integration Test Suite**: `tests/supabase-backend.test.ts`.
8. **Setup Documentation**: `docs/SUPABASE-SETUP.md`.

---

## 5. Identified Conflicts & Fixes
- **Conflict**: Single monolithic `20260905000000_init_schema.sql` file instead of versioned `001_` through `009_` migrations.
- **Fix**: Reorganize database schema into versioned migrations matching `docs/DATABASE-DESIGN.md`.

---

## 6. Required Changes & Guardrails
- **Environment**: Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` and `.env.example`.
- **Security**: Keep `SUPABASE_SERVICE_ROLE_KEY` strictly server-side.
- **Data Invariants**: Enforce `farmer_revenue = product_price * quantity` with ZERO transport deduction.
- **Concurrency**: Use atomic `SELECT ... FOR UPDATE` row locks in PostgreSQL stored procedures.

---

## 7. Risk Assessment
- **Low Risk**: Supabase integration uses service role key on server routes only; client bundle has zero exposure to secrets.
- **Mitigation**: Automated tests verify zero platform fee, order state transitions, and concurrency safety before completion.
