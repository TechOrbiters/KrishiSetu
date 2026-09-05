# TRD — AI MANDI
### Technical Requirements Document
**Read first:** `CLAUDE.md`, `DOMAIN-RULES.md`, `docs/PRD.md`.
**Scope:** how AI MANDI is built — architecture, stack, and non-functional requirements. Where this doc and `CLAUDE.md` disagree, `CLAUDE.md` wins.

---

## 1. Technical overview

AI MANDI is a **PWA web application** backed by two cooperating backends: a **Node/Next.js service** for authentication, CRUD, orchestration, and the marketplace/order/transport workflows, and a **Python (FastAPI) AI service** for forecasting, scoring, and route optimization. State lives in **PostgreSQL**. Three concerns cut across everything: **RBAC** (four roles, server-enforced), the **money model** (product price and delivery fee always separate), and **freshness** (a hard constraint on fulfilment). The system integrates public rails (AGMARKNET, DoCA PMS, e-NAM concepts, BHASHINI) and Google Maps, and pushes notifications via FCM.

The design goal that shapes most trade-offs: it must work for a low-end Android phone on an intermittent rural connection, in the user's language, by voice.

## 2. Architecture

A layered, service-oriented architecture:

```
                    ┌───────────────────────────────────────────┐
   Farmer / Buyer / │      Next.js PWA (TS + Tailwind)            │
   Transporter /    │  role-based UIs · i18n · voice · maps · SW  │
   Admin clients    └───────────────┬───────────────────────────┘
                                     │ HTTPS / REST (/api, OpenAPI 3.x)
                    ┌────────────────▼───────────────────────────┐
                    │   Core Backend (Node / Next.js API)         │
                    │  auth · RBAC · users/profiles · produce ·   │
                    │  demand · orders · transport · shipments ·  │
                    │  freshness gate · notifications · admin     │
                    └───────┬───────────────────────┬─────────────┘
                            │ internal REST/gRPC     │ SQL
              ┌─────────────▼───────────┐   ┌────────▼───────────┐
              │  AI Service (FastAPI)    │   │   PostgreSQL        │
              │ DemandSense · SellSmart  │   │  (Supabase)         │
              │ SmartMatch · SmartTrans  │   └────────────────────┘
              │ FreshRoute · OR-Tools    │
              │ LLM/BHASHINI adapters    │
              └───────┬──────────────────┘
                      │ external APIs
   AGMARKNET · DoCA PMS · Google Maps · BHASHINI · Gemini/Vertex · FCM
```

The Core Backend owns the source-of-truth data and workflow; the AI Service is stateless-ish (reads features, returns scores/routes) and independently scalable. The client never talks to the AI Service directly — it goes through the Core Backend, which enforces auth and shapes responses.

## 3. Technology stack

Frontend: **Next.js + TypeScript + Tailwind CSS**, as a **PWA** (service worker for offline-lean behavior, installable, push). Core backend: **Node.js** (Next.js API routes or a standalone Node service). AI/optimization: **Python 3.11+ + FastAPI**, with **Google OR-Tools** and standard ML/time-series libraries. Database: **PostgreSQL** (via **Supabase**, which also provides auth, storage, and realtime). LLM/voice: **Gemini / Vertex AI** for extraction and explanation; **BHASHINI** for Indic STT/translation/TTS. Maps: **Google Maps Platform** (geocoding, distance matrix, directions). Push: **Firebase Cloud Messaging**; SMS/WhatsApp as fallback channels. Hosting: **Vercel** (web) + **Railway/Supabase** (services, DB, jobs). Shared enums/types/validation live in a `packages/shared` workspace.

## 4. Frontend architecture

A single Next.js app serves all four roles, with route groups per role (`/farmer`, `/buyer`, `/transporter`, `/admin`) guarded by the session's role. The shared design system (see `docs/UI-DESIGN.md`) provides the sidebar+topbar+content shell, the right rail, the mobile bottom-tab-with-voice-FAB, and the component library (cards, tables, chips, steppers, charts, maps, voice UI). i18n is provided through a locale provider defaulting to Hindi for farmer/buyer/transporter and English for admin; all strings are keyed and translatable. Data fetching uses a typed API client generated from the OpenAPI spec; server state is cached and revalidated; the service worker caches shell and last-known data so a farmer sees something useful offline. Charts use a lightweight charting lib; maps use the Google Maps JS SDK. Voice input records audio, sends it to the backend's BHASHINI-backed endpoint, and renders the structured result for confirmation before acting.

## 5. Backend architecture

The Core Backend is organized by domain module (auth, users/profiles, produce, demand, matching, orders, transport, shipments, freshness, payments-stub, notifications, ratings, admin) over a layered structure: **routes/controllers** (HTTP + validation) → **services** (business logic, transactions, state machines) → **repositories** (DB access) → **integration adapters** (AI service, Maps, BHASHINI, FCM, price feeds). Cross-cutting middleware handles authentication, RBAC authorization, request validation (shared schemas), rate limiting, logging, and error normalization. Long-running or scheduled work (price-feed sync, forecast refresh, notification fan-out, demand-supply rebalancing scans) runs as background jobs. Full module and entity detail is in `docs/BACKEND-DESIGN.md`.

## 6. Database architecture

PostgreSQL with a normalized relational schema: one `users` table plus per-role profile tables, produce listings, buyer demands, matches, orders, transport requests, shipments, vehicles, freshness windows, payments, notifications, ratings, disputes, AI recommendations, and supporting price/forecast tables. Money is stored in exact types (integer paise or `NUMERIC`), never floats. Enums (`role`, order status, etc.) are defined once and shared. Foreign keys, check constraints (e.g., delivery_fee ≥ 0; product and delivery amounts are separate columns), and indexes on the hot query paths (geo, status, crop, time) enforce integrity and performance. Full schema and ERD in `docs/DATABASE-DESIGN.md`.

## 7. Authentication

Phone-first authentication (OTP) suited to the user base, issuing a signed session/JWT carrying the user id and role. Farmer identity verification uses Aadhaar with masked storage (`XXXX XXXX 1234`) and a verified flag; raw identifiers are encrypted at rest and never returned to other users. Tokens are short-lived with refresh; sessions can be revoked. Supabase Auth may back this. All auth endpoints are rate-limited and logged. Passwords, where used (admin), follow strong hashing (argon2/bcrypt) — never stored in plaintext, never committed.

## 8. RBAC

Authorization is a server-side gate on every protected route: the middleware resolves the caller's role and checks it against the endpoint's allowed roles and the specific permission required, then services further enforce ownership (a farmer touches only their own listings/orders) and, for admins, region scope. FPO abilities are permission flags on `FARMER_FPO`. The full role × permission matrix is the contract in `docs/RBAC.md`; the UI's role-based rendering is a convenience, never the security boundary (`DOMAIN-RULES.md` R-007).

## 9. API architecture

REST over HTTPS, namespaced under `/api`, documented as **OpenAPI 3.x** which is the source of truth for the typed client and server validation. Namespaces: `/api/auth`, `/users`, `/farmers`, `/fpos`, `/buyers`, `/produce`, `/demand`, `/matches`, `/orders`, `/transport`, `/transporters`, `/shipments`, `/freshness`, `/ai`, `/payments`, `/notifications`, `/admin`. Every endpoint documents method, URL, auth, RBAC permission, request schema, validation, response schema, error cases, and business rules. Standard conventions: consistent envelope, pagination, idempotency keys on state-changing calls, and error codes mapped to HTTP status. Full spec in `docs/API-DESIGN.md`.

## 10. AI architecture

The FastAPI AI service exposes internal endpoints for each capability and is called only by the Core Backend. It reads features from (or is passed features by) the backend, runs the relevant model/optimizer, and returns a structured result: `score`/`value`, `breakdown`, `reason`, `confidence`, plus a `fallback` flag when heuristics were used. Models and weights are versioned. The service separates **numeric intelligence** (statistical forecasting, deterministic weighted scoring, OR-Tools routing) from **language intelligence** (LLM/BHASHINI for extraction, translation, and NL explanation). It holds no long-term state beyond model artifacts and caches. Full capability specs in `docs/AI-SYSTEM.md`.

## 11. Demand forecasting (DemandSense)

Numeric forecasts come from statistical/ML time-series methods (moving-average/seasonal baselines, ARIMA/Prophet-class models, or gradient-boosted regressors) trained on historical orders, seasonal patterns, festival/event calendars, weather, and market prices, per crop × location × horizon. When history is thin, fall back to a seasonal/heuristic baseline and lower the confidence. Output is expected demand, supply gap, and trend %, with an explanation. Never uses an LLM to invent a number (`DOMAIN-RULES.md` R-018). Refreshed on a schedule and cached.

## 12. SmartMatch (buyer matching)

A deterministic weighted scorer: **30% price + 25% distance + 20% quantity fit + 10% quality fit + 10% delivery-time fit + 5% buyer reliability**, each sub-score normalized to 0–1, combined to 0–100. Distance uses the Maps distance matrix; reliability uses the buyer's completion/rating history. Output includes the per-factor breakdown and a plain-language reason ("close by, pays above market, wants your full quantity"). Optimizes for the farmer's product price while remaining consistent with the buyer's total delivered cost. Weights are fixed and versioned (`DOMAIN-RULES.md` R-014).

## 13. SmartTransport (transporter matching)

A deterministic weighted scorer: **30% distance-to-pickup + 25% vehicle capacity + 20% fare + 15% availability + 10% rating**, normalized and combined to 0–100. Produces a ranked list of eligible transporters and can recommend multi-vehicle splits for large loads (e.g., 2× mini vs 1× large, choosing the cheaper feasible option). Feeds the transporter's fare (= delivery fee, per R-003). Weights fixed and versioned (`DOMAIN-RULES.md` R-015).

## 14. FreshRoute (freshness matching) & routing

FreshRoute is the freshness gate over transport: for each candidate transporter/route it computes projected arrival and compares to the listing's freshness window, excluding any option where ETA > window and labelling the rest with the window remaining. Routing itself is a **Vehicle Routing Problem** solved by **OR-Tools**, minimizing `distance + transport_cost + delay_penalty + freshness_penalty` under capacity, quantity, delivery-time-window, and freshness constraints, with **dynamic load pooling** across nearby stops. The freshness window is a **hard** constraint; delay and freshness risk are penalties in the objective.

## 15. Multilingual AI (Krishi AI Assistant)

Voice/text in ten languages via BHASHINI (STT → normalize → translate as needed) feeding an LLM for intent/slot extraction (crop, quantity, quality, location, availability, or a question), which the backend maps to a listing action or a data-grounded answer, returned in the user's language (TTS optional). The assistant answers using AI MANDI's own data (listings, prices, orders, forecasts), not open-ended world knowledge, and always asks the user to confirm before it creates or changes a record. Admin surfaces are English and skip this.

## 16. Notifications

FCM for push to installed PWAs, with SMS/WhatsApp adapters as low-end fallbacks. A notification service fans out role-and-event-specific, localized messages (order placed/accepted, demand up, price opportunity, freshness expiring, transporter nearby, produce available, new job nearby, delivery delayed/exception, pending assignment). Notifications are queued and retried; user preferences and quiet hours are respected; every notification links to the relevant screen.

## 17. Payments (MVP-stubbed, settlement-ready)

The MVP records the money model (product amount → farmer, delivery fee → transporter, buyer total = sum, platform fee ₹0) and exposes payment status per order, but integrates no live gateway or escrow (`DECISIONS.md` D-013). The `payments` model is structured so a Phase-2 gateway/escrow can attach without reshaping orders — amounts, payee roles, and settlement status already exist. All currency math is exact (`DOMAIN-RULES.md` R-022).

## 18. File & image storage

Produce photos, profile images, and documents are stored in object storage (Supabase Storage / equivalent), referenced by URL/key in the DB, never as blobs in Postgres. Uploads are validated (type, size), virus/again-content checked where feasible, and served via signed URLs. Aadhaar/document images are access-controlled and never publicly linkable.

## 19. Maps & geolocation

Google Maps Platform provides geocoding (village/district → coordinates), the distance matrix (used by SmartMatch distance and SmartTransport distance-to-pickup), directions/routing (feeding OR-Tools and the live route view), and the map tiles shown in tracking screens. Transporter live location is captured periodically and streamed to the tracking views. API usage is proxied through the backend so keys never reach the client.

## 20. Security

RBAC enforced server-side on every request; input validated and sanitized via shared schemas; parameterized queries only (no string-built SQL); secrets solely in environment/secret storage and never committed (`DOMAIN-RULES.md` R-021); sensitive identifiers masked, encrypted at rest, and access-logged (R-019); cross-user PII disclosed only as a transaction requires (R-020); TLS everywhere; least-privilege service credentials; security-relevant events logged. Threat areas explicitly handled: auth abuse (rate limits, OTP throttling), authorization bypass (server checks + ownership + scope), injection (validation + parameterization), and data exposure (response shaping + masking).

## 21. Rate limiting

Per-identity and per-IP limits on auth (OTP request/verify), AI endpoints (forecast/match/route are comparatively expensive), and write-heavy endpoints, with sensible burst allowances. Limits are enforced at the API edge/middleware; exceeded limits return `429` with a retry hint. AI calls are additionally protected by caching and debouncing so repeated identical requests don't re-run models.

## 22. Error handling

A single error model across services: services throw typed domain errors (validation, not-found, forbidden, conflict/illegal-transition, upstream-failure) which middleware maps to consistent HTTP responses with a stable error code, a human-readable (localizable) message, and no leaked internals. AI/Maps/BHASHINI upstream failures degrade gracefully — the app falls back to heuristics or cached data and tells the user, rather than failing hard. Illegal order-state transitions and freshness violations return specific, actionable errors.

## 23. Logging

Structured, leveled logs with correlation/request IDs spanning the client → core backend → AI service path. Logs capture request metadata, RBAC decisions, state transitions, external-call latency, and errors — never secrets or unmasked PII. Audit logs record verification actions, dispute resolutions, and admin overrides. Logs are shipped to a central store for search and alerting.

## 24. Monitoring

Health checks per service; metrics for request latency/error rate, AI inference latency and fallback rate, external-API latency/quota, job queue depth and failures, and business KPIs (orders/day, on-time %, freshness-safe %). Dashboards and alerts (error-rate spikes, queue backlogs, upstream outages, quota exhaustion) keep operators ahead of incidents. Traces connect a slow user action to the responsible service/call.

## 25. Testing

Unit tests for services and the AI scorers/optimizer (including that SmartMatch/SmartTransport weights sum to 100% and produce deterministic outputs); contract tests against the OpenAPI spec; integration tests for the order/transport state machine and the freshness gate (an over-window acceptance must fail — R-009); RBAC tests asserting wrong-role calls are rejected (R-007); money-model tests asserting product/delivery separation and farmer-full-price/transporter-fee settlement (R-001..R-004); and end-to-end tests of the primary journeys (farmer voice-list → AI recs → buyer checkout with separated pricing → farmer accept → transport match under freshness → delivery). Seed data covers all four roles and both buyer types.

## 26. Deployment

Frontend on Vercel; core backend and AI service on Railway (or equivalent); PostgreSQL/Storage/Auth on Supabase. CI runs lint, type-check, tests, and an OpenAPI-diff on every PR; passing builds deploy to a staging environment, then promote to production. Configuration and secrets come from environment/secret storage per environment; database migrations run as a gated deploy step. The PWA is served over HTTPS with a service worker versioned per release.

## 27. Scalability

The two backends scale independently and statelessly behind load balancers; PostgreSQL scales via connection pooling, read replicas for analytics/admin reporting, and indexed geo/status/time queries; the AI service scales horizontally and shields models with caching (forecasts, distance matrices, recent scores) and queues for batch work (nightly forecast refresh, demand-supply scans). Notification fan-out and route optimization run as queued jobs so spikes don't block request paths. Data partitioning by region/time is available for the price/forecast/order history as volume grows.

## 28. Disaster recovery

Automated, encrypted, regularly tested PostgreSQL backups with point-in-time recovery and a defined RPO/RTO; object storage versioning for uploads; infrastructure and configuration captured as code so environments can be rebuilt; documented runbooks for restore, key rotation, and upstream-outage fallback (serve cached prices/forecasts, queue writes). Model artifacts are versioned and re-deployable. Regular restore drills verify the backups actually work.
