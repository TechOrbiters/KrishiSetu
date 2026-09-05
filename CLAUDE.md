# CLAUDE.md — AI MANDI

> **The single source of truth for the AI MANDI platform.**
> Read this file first, in full, before writing any code, schema, API, or UI. Every other document in `docs/` expands on a section here. If any document contradicts this file, **this file wins** — and you must flag the contradiction.

---

## 0. How to use this file

This is the project **constitution**: the briefing you would give a new senior engineer on day one. It states *what* we are building, *for whom*, *why*, and the *non-negotiable rules* that keep the build coherent. It intentionally repeats the most load-bearing rules (money model, RBAC, freshness) because those are the ones that, if broken, quietly corrupt the whole product.

Companion documents (all in `/docs`):

| Doc | Purpose |
|-----|---------|
| `docs/PRD.md` | Product requirements — what to build and why, feature by feature |
| `docs/TRD.md` | Technical requirements — architecture, stack, non-functional requirements |
| `docs/WEB-FLOW.md` | Sitemap, per-role navigation, screen-to-screen journeys, order state machine |
| `docs/DATABASE-DESIGN.md` | Full schema, ERD, tables, enums, indexes |
| `docs/BACKEND-DESIGN.md` | Services, modules, layering, background jobs, integrations |
| `docs/API-DESIGN.md` | Every endpoint: method, auth, RBAC, request/response, errors, rules |
| `docs/AI-SYSTEM.md` | The 6 AI capabilities: inputs, outputs, algorithms, fallbacks, confidence |
| `docs/RBAC.md` | The 4 roles and the full permission matrix |
| `docs/UI-DESIGN.md` | Design system + screen-by-screen spec that must match the mockups |
| `DECISIONS.md` | Locked decisions and the reasoning behind them |
| `DOMAIN-RULES.md` | The business/domain invariants that code must never violate |

---

## 1. Mission

**Problem (SIH 2026, ID 26033):** Multiple intermediaries reduce farmers' earnings and increase consumer prices.
**Owner:** Ministry of Consumer Affairs, Food & Public Distribution → Department of Consumer Affairs (DoCA).
**Category:** Software. **Theme:** Agriculture, FoodTech & Rural Development.

**What we are building:** AI MANDI — a **decision-and-fulfillment layer for agricultural commerce**. It connects farmers and FPOs directly with consumers and bulk buyers, arranges logistics, and uses AI for demand forecasting, buyer/transporter matching, and route optimization — so the farmer earns more and the consumer pays less, with the margin that used to disappear into a chain of middlemen made visible and largely removed.

**The one line:** *From market discovery to delivery optimization — one intelligent layer connecting demand to the nearest viable agricultural supply.*

**The farmer's version:** *AI MANDI tells a farmer where to sell, what price to accept, who will buy, and how to deliver.*

**Core pipeline (memorize this):** **Predict → Recommend → Match → Move → Earn.**

**Ecosystem promise:** **BUY → SELL → MOVE.**

---

## 2. The frame that makes this different

Read this carefully; it governs a hundred downstream decisions.

1. **This is a coordination problem, not a "remove the middleman" problem.** We do **not** try to delete intermediaries. Fragmented, opaque intermediation is replaced by one intelligent, transparent coordination layer. Aggregation, grading, and logistics are *real* services; we make them efficient and visible, we don't pretend they're free.

2. **We are demand-first.** The interesting question is not "what does this farmer have to sell?" but "**what, where, when, and how much is needed — and which nearby farmer/FPO can fulfil it at the best net price?**" Demand pulls supply.

3. **We optimize the transaction *before* it happens.** Competitors (Ninjacart, DeHaat, WayCool, Arya.ag) do list → buy → deliver. We do **predict → aggregate → match → price → route → transact**. That pre-transaction intelligence is the moat. Never pitch AI MANDI as "an app that connects farmers and buyers" — that already exists.

4. **We sit on top of public rails; we don't replace them.** e-NAM, ONDC, AGMARKNET, the DoCA Price Monitoring System and BHASHINI are inputs and context. AI MANDI is the intelligence and orchestration layer above them, not a competitor to them.

5. **FPO-first.** Aggregating ~500 smallholders through an FPO into hub-scale lots is what unlocks bulk buyers and cheap logistics. The FPO is a first-class actor, not an afterthought.

---

## 3. Product naming (canonical)

The mockups and the strategy notes use several names. Treat them as a deliberate hierarchy, and keep it consistent in code and copy:

- **AI MANDI** — the platform / umbrella product name. Use in all technical docs, repo, and internal naming.
- **Kisan Setu** ("आपका अपना बाजार") — the **Farmer** app and the **Admin** panel surface, as shown in the mockups.
- **Kisan Bazaar** / **किसान-क्रेता पोर्टल** ("Direct from Farmer") — the **Buyer** and **Transporter** surfaces.

> If the team later wants one single consumer-facing brand, that is a product decision to be recorded in `DECISIONS.md`. Until then: **AI MANDI = platform; Kisan Setu / Kisan Bazaar = role-facing app skins.** Do not invent new names.

---

## 4. The four roles (RBAC) — FINAL

There are **exactly four** roles. This is fixed and matches the product owner's requirement. Do not add roles without a recorded decision.

| # | Role | `role` enum | Who they are | Core abilities |
|---|------|-------------|--------------|----------------|
| 1 | **Farmer / FPO** | `FARMER_FPO` | An individual farmer **or** a Farmer Producer Organization. One combined role. | List produce (incl. voice/photo), set freshness window, view AI recommendations, accept/reject orders, track delivery, view payments. FPO adds: manage member farmers, aggregate lots, manage inventory & orders, view FPO analytics. |
| 2 | **Buyer** | `BUYER` | A consumer (household) **or** a business (retailer, hotel, restaurant, store). Distinguished by `buyer_type`. | Search/browse produce, post a demand/requirement, add to cart, place order, choose & pay for delivery, track order, rate. |
| 3 | **Transporter / Delivery Partner** | `TRANSPORTER` | An individual vehicle operator (Rapido-for-agri model). | See available & assigned deliveries, accept/reject a job (subject to freshness fit), navigate optimized route, update pickup/in-transit/delivered, view earnings & ratings, manage own vehicle. |
| 4 | **Admin** | `ADMIN` | Platform operations. English-only UI. | Verify farmers/buyers/transporters, manage users, monitor orders & deliveries, monitor market prices & supply-demand, handle disputes, view analytics/reports. |

- **`LOGISTICS_PARTNER`** (a fleet manager operating multiple vehicles) is a **reserved, Phase-2 role**. Keep the enum value defined but ship no UI for it in the MVP. For the MVP, all transport is done by individual `TRANSPORTER`s.
- Implementation: **one `users` table** + a `role` enum, with **role-specific profile tables** (`farmer_profiles`, `fpo_profiles`, `buyer_profiles`, `transporter_profiles`) attached as needed. Details in `docs/DATABASE-DESIGN.md` and `docs/RBAC.md`.
- The Admin may be **scoped** (e.g., to a state/district) via a `scope` field — model it now, enforce lightly in MVP.

`role` enum (authoritative): `FARMER_FPO | BUYER | TRANSPORTER | ADMIN | LOGISTICS_PARTNER`.

---

## 5. The money model — the rule that must never be broken

This is the single most important business rule in the system. It appears again in `DOMAIN-RULES.md` and is enforced in the schema and API layers.

- **The buyer pays two separate amounts: (1) the product price and (2) the transportation/delivery charge.** They are shown, stored, and settled **separately**. They are **never merged into one blended number.**
- **The farmer/FPO receives the full agreed product price.** Transportation is **not** deducted from what the farmer earns.
- **The transporter receives the delivery fee.**
- **Platform service fee = ₹0** for the MVP (an optional, explicit, itemized fee may be added later — never a hidden markup).

Therefore, everywhere in the code:

```
farmer_revenue  = product_price * quantity          # transport is NOT subtracted
buyer_total     = (product_price * quantity) + delivery_fee
transporter_pay = delivery_fee
```

**Consequences you must respect:**
- `SmartMatch` optimizes *both sides*: best product price for the farmer **and** lowest **total delivered cost** for the buyer. A listing with a slightly higher product price can still win if its delivery is cheaper.
- Any UI that shows a buyer a price must show product price and delivery charge on separate lines, with a visible total (see mockups scr-007, scr-009).
- Self Pick-up ⇒ delivery fee = ₹0 (see scr-007).

Money flow example: buyer pays **₹12,500** → farmer gets **₹11,000** (product) + transporter gets **₹1,500** (delivery). Nothing leaks to a middleman.

---

## 6. Freshness is a hard constraint, not a nice-to-have

- Every produce listing carries a **freshness window** (e.g., "must reach the buyer within 24 h"), set by the farmer/FPO at listing time.
- A transporter may accept a delivery **only if** their estimated time of arrival is **within** the freshness window. If `ETA > freshness_window`, the job is shown as **"cannot meet window"** and cannot be accepted by that transporter/vehicle.
- Route optimization treats freshness as a penalty/constraint, not an afterthought (see §9 and `docs/AI-SYSTEM.md`).
- The buyer sees the freshness window remaining at the projected arrival time (e.g., "18h 20m ✅").

This is the feature that directly attacks the 6–18% post-harvest loss the problem statement cares about.

---

## 7. The six AI capabilities (Must Build)

These are the heart of the product. Full specs (inputs, outputs, algorithm, fallback, confidence, business rules, failure modes) live in `docs/AI-SYSTEM.md`. Names are canonical — use them in code and UI.

1. **DemandSense — Demand Forecasting.** *"Where will my crop be needed?"* Predicts expected demand, supply gap, and trend for a crop × location × time window. Uses real statistical/ML time-series methods (not "ask an LLM to guess a number"). Example: *"Lucknow · Tomato · expected 1.8 t, supply 1.2 t, gap +600 kg, ↑17%."*

2. **SellSmart — Farmer Revenue Calculator.** *"Where should I sell?"* Compares selling options (local mandi vs. specific buyers) and estimates the farmer's revenue for each. **Never subtracts transport** from the farmer's number.

3. **SmartMatch — Buyer Matching.** *"Who should buy my produce?"* Ranks buyers for a listing. **Score = 30% price + 25% distance + 20% quantity fit + 10% quality fit + 10% delivery-time fit + 5% buyer reliability.** Output is a 0–100 score with a plain-language explanation (explainable AI). Example: *"FreshMart — 94/100."*

4. **SmartTransport — "Rapido for agricultural transport."** Ranks transporters for a delivery. **Score = 30% distance-to-pickup + 25% vehicle capacity + 20% fare + 15% availability + 10% rating.** Handles dynamic load pooling and multi-vehicle suggestions (e.g., *"2× mini truck ₹2,000 vs 1× large ₹2,400 → recommend 2× mini, save ₹400"*).

5. **FreshRoute — Shelf-life / freshness matching.** Enforces §6: matches only transport options that can deliver within the freshness window; surfaces freshness-safe/at-risk status to all parties.

6. **Krishi AI Assistant — voice-first, multilingual.** *Speak → Understand → Act.* Sits above every module. Extracts crop/quantity/availability from natural speech and answers using AI MANDI's own data. Languages: Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Gujarati, Punjabi, Odia, English. Uses **BHASHINI** for Indic STT/translation/TTS.

**Strong differentiators (Phase 1.5):** MarketPilot (AI selling strategy), AI Surplus-to-Demand matching (regional balancing), Freshness/Spoilage Risk score, Smart Alerts, Trust/Reliability score, and a single **AI Opportunity Score** (0–100, "SELLING OPPORTUNITY: 91/100"). **Future:** photo-based grade assist, Digital Produce Passport (LOT-##### + QR), Price Spread Intelligence, predictive harvest planning.

> **AI honesty rule:** Every AI output must be explainable and must degrade gracefully. When data is thin, fall back to a transparent heuristic and **lower the confidence**, never fabricate. Any projected benefit shown in the UI (e.g., "Farmer Gain +₹3.90/kg") must be labelled **"Illustrative simulation."** Never claim a pilot result we don't have.

---

## 8. Order & fulfilment state model (authoritative)

From the product owner's own flow note (mockup scr-020) and the buyer/farmer screens:

```
Buyer places order  ─ chooses  Self-Service  OR  Delivery
        │
        ▼
Farmer/FPO notified ──► Farmer/FPO ACCEPTS (or rejects within the accept window)
        │
        ├── Self-Service ──►  (no logistics)  Buyer picks up at farm/FPO. Delivery fee = ₹0.
        │
        └── Delivery ──► Platform auto-creates a Transport Request
                         ──► SmartTransport ranks nearby transporters (FreshRoute filters by window)
                         ──► Transporter accepts ──► Pickup ──► In Transit ──► Delivered
                         ──► Payment settled (farmer: product price; transporter: delivery fee)
```

Order statuses (canonical enum): `PLACED → ACCEPTED → (SELF_PICKUP | PACKED → DISPATCHED → IN_TRANSIT → DELIVERED)`, plus `CANCELLED`.
Shipment/delivery stepper (UI): Order confirmed → Scheduled for pickup → Picked up → Out for delivery → Delivered.

The farmer never has to arrange logistics manually — the platform creates the transport request automatically once the buyer confirms a delivery order.

---

## 9. Route optimization

- Modeled as a **Vehicle Routing Problem (VRP)**, solved with **Google OR-Tools**.
- **Objective:** minimize `total_distance + transport_cost + delay_penalty + freshness_penalty`.
- **Constraints:** vehicle capacity, order quantity, delivery time windows, and the freshness window (hard).
- **Dynamic Load Pooling:** one vehicle can serve multiple nearby orders/stops to lift utilization (illustratively 60% → 92%). This is also how buyers get cheaper delivery.

---

## 10. Recommended tech stack

The mockups depict a rich, live-data, multi-role dashboard application (maps, real-time tracking, voice) — a custom web app, **not** a page-builder site. Build accordingly.

- **Frontend:** Next.js + TypeScript + Tailwind CSS, delivered as a **PWA** (mobile-first, tolerant of poor connectivity).
- **Backend:** Node.js via Next.js API routes / a Node service for core CRUD & orchestration; **Python (FastAPI)** for the AI/optimization services (forecasting, OR-Tools routing, scoring).
- **Database:** PostgreSQL (Supabase is fine for the hackathon; it also gives us auth, storage, and realtime).
- **AI / LLM:** Gemini / Vertex AI (or equivalent) for voice-slot extraction, the multilingual assistant, NL explanations of recommendations. **BHASHINI** for Indic speech-to-text, translation, and text-to-speech.
- **Optimization:** Python + Google OR-Tools.
- **Maps / geo:** Google Maps Platform (geocoding, distance matrix, routing).
- **Notifications:** Firebase Cloud Messaging (push); SMS/WhatsApp as optional low-end entry channels.
- **Deployment:** Vercel (frontend) + Railway/Supabase (backend, DB, jobs).

> If a real deployment forces a different choice (e.g., a Webflow marketing site in front of the app), record it in `DECISIONS.md` — but the *product itself* is the Next.js application described above.

---

## 11. External data & integrations (real, cite these)

- **AGMARKNET** (data.gov.in) — daily mandi prices (min/max/modal, arrivals). Feeds market-price screens and SellSmart.
- **DoCA Price Monitoring System** (fcainfoweb.nic.in) — 22 essential commodities across 555 market centres. Directly relevant: DoCA owns this problem. Feeds the Admin price-spread intelligence.
- **e-NAM** — conceptual reference for trading, FPOs, price discovery, lot tracking. We layer above it.
- **BHASHINI** — Indic multilingual voice/translation.
- **Context:** ~10,000 FPOs in India (₹20,358 cr cumulative turnover as of Jul 2026; 6,964 FPOs ≤ ₹50 lakh turnover); ICAR post-harvest losses ~6–18%.

---

## 12. UI / UX rules (must match the mockups)

Full spec in `docs/UI-DESIGN.md`. The non-negotiables:

- **Layout:** fixed left sidebar (~220 px) + topbar + content. Buyer and Transporter screens add a right rail. Mobile uses a **bottom tab bar with a centre voice FAB** (farmer screens).
- **Language:** Farmer, Buyer, and Transporter UIs are **Hindi-first** (bilingual, English as small subtitle/parentheses). **Admin UI is English-only.** All role UIs must support the multilingual switcher.
- **Voice is a first-class entry point** on farmer/buyer screens (mic in search, "बोलकर लिस्ट करें" FAB).
- **Color tokens:** primary green `#15803D`–`#1A7F4B`; brand deep-green `#14532D`; dark-green sidebar `#0F5132`; success `#16A34A`; negative/down `#DC2626`; warning `#F59E0B`; info `#2563EB`; purple accent `#6366F1`. Surfaces: white cards on `#F7F8FA`, borders `#E5E7EB`, radius 12–16px, soft shadows.
- **Iconography:** outline (Lucide-style). **Crops use photographic thumbnails, never icons.**
- **Trust chips:** verified ✓ chips on FPO names and farmer identity.
- **Pricing display:** product price and delivery charge always on separate lines with a visible total; show market-comparison savings where the mockups do; use the strikethrough-original + discounted pattern for delivery options.
- Every screen must define its **loading, empty, error, and success** states.

The mockups are the visual contract. When in doubt, match `docs/UI-DESIGN.md` and the screen inventory exactly.

---

## 13. Repository layout (target)

```
AI-MANDI/
├── CLAUDE.md                 # this file — the constitution
├── DECISIONS.md              # locked decisions + rationale
├── DOMAIN-RULES.md           # business invariants code must never break
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── WEB-FLOW.md
│   ├── DATABASE-DESIGN.md
│   ├── BACKEND-DESIGN.md
│   ├── API-DESIGN.md
│   ├── AI-SYSTEM.md
│   ├── RBAC.md
│   └── UI-DESIGN.md
├── apps/
│   ├── web/                  # Next.js + TS + Tailwind (PWA) — all 4 role UIs
│   └── ai/                   # FastAPI: forecasting, OR-Tools routing, scoring
├── packages/
│   ├── db/                   # schema, migrations, seed
│   └── shared/               # shared types, enums, validation
└── .claude/                  # skills, commands, agents (project automation)
```

---

## 14. Conventions

- **Language & types:** TypeScript everywhere on the web/Node side; Python (typed) for AI. Shared enums (`role`, order status, etc.) live in `packages/shared` and are the single source of truth — never redefine them ad hoc.
- **API:** REST, versioned under `/api`. OpenAPI 3.x is the contract (see `docs/API-DESIGN.md`). Every endpoint documents auth, RBAC, validation, response, errors, and business rules.
- **Auth:** token-based (JWT/session); every protected endpoint checks role + permission. RBAC is enforced server-side, always — never trust the client.
- **Money:** store amounts in a consistent minor/major unit convention (decided in `DATABASE-DESIGN.md`); never do lossy float math on currency in business logic.
- **Time & i18n:** store timestamps in UTC; render in the user's locale. All user-facing strings are translatable; Hindi is the default for farmer/buyer/transporter.
- **Naming:** `snake_case` in the database, `camelCase` in TypeScript, `PascalCase` for types/entities.
- **Explainability:** any AI recommendation returned by the API includes a machine-readable score breakdown and a human-readable reason string.

---

## 15. Security rules

- **NEVER commit secrets.** No API keys, passwords, DB credentials, private tokens, or `.env` contents in this file, in `docs/`, in code, or in git history. Secrets live only in environment variables / a secrets manager.
- Enforce RBAC on the server for every request; the UI hiding a button is not access control.
- Validate and sanitize all input (use shared validation schemas). Never build SQL by string concatenation.
- Aadhaar and phone numbers are sensitive: store masked where shown (e.g., `XXXX XXXX 1234`), encrypt at rest, log access. Verification status is a boolean/enum, not the raw document.
- Rate-limit auth and AI endpoints. Log security-relevant events. Least-privilege for service credentials.
- PII (farmer/buyer identity, location) is handled per privacy rules in `docs/TRD.md`; don't expose one user's PII to another beyond what a transaction requires (e.g., a transporter sees the pickup contact only after accepting).

---

## 16. MVP scope (build this first)

**In scope:** produce listing (incl. voice/photo entry), the AI recommendation engine (DemandSense + SellSmart + SmartMatch), buyer demand/browse/checkout, simple logistics with SmartTransport + FreshRoute + a route-optimization demo, transparent pricing, and the four role dashboards. Roughly eight core screens: Landing, Login/Register, Farmer Dashboard, Add Produce, AI Recommendations, Buyer Dashboard/Home, Order + Logistics Tracking, Admin Dashboard.

**Explicitly deferred (Future):** separate government/quality/finance/support officer roles, the fleet `LOGISTICS_PARTNER` UI, warehouse management, blockchain, full e-NAM/ONDC replacement, advanced escrow, complex bidding/auctions, a large consumer grocery catalogue. **Payments and Help Center are marked "Future"** in the owner's own site-flow note (scr-006) — treat full payment settlement and a full help centre as post-MVP; stub them cleanly.

---

## 17. What you MUST NOT do

- ❌ Do **not** merge product price and delivery charge into one number, anywhere.
- ❌ Do **not** subtract transport (or any fee) from the farmer's revenue.
- ❌ Do **not** add, remove, or rename the four roles without a recorded decision. `LOGISTICS_PARTNER` stays Phase-2.
- ❌ Do **not** let a transporter accept a delivery that misses the freshness window.
- ❌ Do **not** put secrets (keys, passwords, credentials, tokens) in any file or commit.
- ❌ Do **not** ship AI numbers without an explanation and a confidence, or present simulations as real pilot results.
- ❌ Do **not** position AI MANDI as a replacement for e-NAM/ONDC, or pitch it as "just connecting farmers and buyers."
- ❌ Do **not** invent new brand names or new screens that contradict the mockups; the mockups + `docs/UI-DESIGN.md` are the visual contract.
- ❌ Do **not** trust the client for authorization; enforce RBAC on the server.
- ❌ Do **not** build the deferred/Future items into the MVP.

---

## 18. Known data-quality notes (carried from source materials)

- The source `Details.zip` contained two handwritten pages (mockups **scr-017** and **scr-018**) that belong to a **different** SIH problem statement — **ID 26139, "Skill Development & Employment Tracking."** They are **not** part of AI MANDI and have been excluded from every document here. If you find references to trainee/employment tracking, they are out of scope.
- Brand names differ across the mockups (Kisan Setu / Kisan Bazaar / किसान-क्रेता पोर्टल / AI MANDI). Resolved per §3; revisit only via `DECISIONS.md`.
- "WEB FLOW" in the requirements means the **site/navigation flow** (see the owner's handwritten site map scr-006 and order-flow scr-020), documented in `docs/WEB-FLOW.md`. It does **not** mean the Webflow website builder.
