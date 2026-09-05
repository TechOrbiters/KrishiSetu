# DECISIONS.md — AI MANDI

> A running log of **locked decisions** and the reasoning behind them. When a future question sounds like "wait, why did we do it this way?", the answer lives here. Changing a locked decision requires adding a new dated entry that supersedes the old one — never silently edit history.

Format: **ID · Decision · Status · Why · Implications.**

---

### D-001 · Product is a decision-and-fulfillment layer, not an online mandi
**Status:** Locked.
**Decision:** AI MANDI positions itself as an intelligence + orchestration layer over agricultural commerce, not as a replacement for e-NAM/ONDC or "an online mandi."
**Why:** Price discovery, FPO registries, and lot trading already exist (e-NAM). Re-building them wins nothing and invites a "why not just use e-NAM?" question. The unmet need is *coordinating demand with supply and logistics intelligently, before the transaction*.
**Implications:** Pitch, PRD, and features emphasize prediction/matching/routing. Public rails (AGMARKNET, DoCA PMS, e-NAM, BHASHINI) are treated as inputs, not competitors.

### D-002 · Exactly four RBAC roles
**Status:** Locked (matches product owner requirement).
**Decision:** Roles are Farmer/FPO, Buyer, Transporter/Delivery Partner, Admin. A 7-role hierarchy (super admin, govt officer, FPO manager, farmer, buyer, logistics, quality) was considered and **rejected** for the MVP.
**Why:** Four roles cover every job to be done in the marketplace and keep auth, UI, and testing tractable for a hackathon build. The owner explicitly asked for these four.
**Implications:** `role` enum has four active values (+ one reserved, see D-003). One `users` table + per-role profile tables.

### D-003 · Farmer and FPO are ONE role; Logistics Partner is Phase-2
**Status:** Locked.
**Decision:** Farmer and FPO share the single `FARMER_FPO` role (FPO simply unlocks aggregation/management abilities). The fleet-operating **Logistics Partner** is a reserved enum value (`LOGISTICS_PARTNER`) with **no MVP UI**.
**Why:** A farmer and an FPO do the same core things (list, accept, deliver, get paid); an FPO just does them at scale for members. A distinct fleet role adds real complexity (multi-vehicle dispatch) that the MVP doesn't need — individual `TRANSPORTER`s cover demo needs.
**Implications:** FPO-specific abilities are permission flags on the same role. Model the fleet role in the schema/enum now; build its UI later.

### D-004 · Transporter is an individual vehicle operator ("Rapido for agri")
**Status:** Locked.
**Decision:** The `TRANSPORTER` role is a single driver with one (or few) vehicles who accepts individual jobs.
**Why:** Matches the mockup (scr-004: "Raj Transport", one Mini Truck, per-job accept/reject) and the SmartTransport ranking model.
**Implications:** SmartTransport ranks individual transporters; fleet dispatch is Phase-2 (`LOGISTICS_PARTNER`).

### D-005 · Buyer pays product price + delivery charge, shown separately
**Status:** Locked. **This is the flagship domain rule — see `DOMAIN-RULES.md` R-001..R-004.**
**Decision:** Buyer total = product price + delivery fee, always itemized. Farmer receives the full product price. Transporter receives the delivery fee. Platform fee = ₹0 for MVP.
**Why:** The problem is that intermediaries silently skim margin. Making every rupee visible and paying the farmer the full product price *is the product*. Blending the numbers would reproduce the opacity we're fighting.
**Implications:** Schema stores `product_price` and `delivery_fee` as distinct columns; APIs return them separately; UI renders them on separate lines. SmartMatch optimizes total delivered cost for buyers and product price for farmers.

### D-006 · Freshness window is a hard constraint set at listing time
**Status:** Locked.
**Decision:** Each listing has a freshness window. A transporter can accept a delivery only if ETA ≤ window. FreshRoute enforces this.
**Why:** Directly targets 6–18% post-harvest loss (ICAR) — the crux of the problem statement. A late delivery of perishables is a failed delivery.
**Implications:** `freshness_window` on the listing; VRP objective includes a freshness penalty and treats the window as a hard constraint; UI shows freshness-safe/at-risk everywhere.

### D-007 · AI outputs must be explainable, bounded, and honest
**Status:** Locked.
**Decision:** Every AI recommendation returns a 0–100 score, a machine-readable breakdown, a human-readable reason, and a confidence. When data is thin, fall back to a transparent heuristic with lowered confidence. Projected benefits are labelled "Illustrative simulation."
**Why:** Judges and users distrust black-box magic numbers; farmers deserve a reason. Overclaiming (fake pilot results) is a credibility risk.
**Implications:** Scoring weights are fixed and documented (see `docs/AI-SYSTEM.md`); the API schema carries `score`, `breakdown`, `reason`, `confidence`.

### D-008 · Demand forecasting uses real statistical/ML methods, not an LLM guess
**Status:** Locked.
**Decision:** DemandSense uses classical time-series / ML methods (e.g., moving averages / ARIMA / Prophet / gradient-boosted trees class), with a heuristic fallback. The LLM is used for language and explanation, not for numeric forecasting.
**Why:** LLMs don't produce reliable numeric forecasts; a defensible statistical method does and is explainable.
**Implications:** AI service (Python) hosts the forecasting model; sample/historical data is acceptable for the hackathon.

### D-009 · Route optimization via Google OR-Tools (VRP)
**Status:** Locked.
**Decision:** Model delivery routing as a Vehicle Routing Problem solved with OR-Tools; objective minimizes distance + transport cost + delay penalty + freshness penalty under capacity/quantity/time-window/freshness constraints. Support dynamic load pooling.
**Why:** VRP is the correct, well-tooled formulation; OR-Tools is free, capable, and demo-ready.
**Implications:** Lives in the Python AI service; exposed via `/api/ai` routing endpoints.

### D-010 · Tech stack: Next.js + TS + Tailwind (PWA), Node + FastAPI, PostgreSQL
**Status:** Locked (revisit only via a new entry).
**Decision:** See `CLAUDE.md` §10 for the full stack.
**Why:** The mockups are a rich, live-data, multi-role app (maps, tracking, voice) — a custom web app, not a page-builder site. Next.js PWA fits low-connectivity rural use; Python/FastAPI is the natural home for OR-Tools and ML.
**Implications:** "WEB FLOW" in the requirements = site/navigation flow (see `docs/WEB-FLOW.md`), **not** the Webflow builder. If a marketing site later uses Webflow, that's a separate, recorded decision.

### D-011 · Product naming hierarchy
**Status:** Locked (interim).
**Decision:** AI MANDI = platform/umbrella; Kisan Setu = farmer & admin surface; Kisan Bazaar / किसान-क्रेता पोर्टल = buyer & transporter surface.
**Why:** Reconciles the different names across the mockups without discarding any. Keeps technical naming stable (AI MANDI) while honoring the UI copy in the designs.
**Implications:** Code/repo/docs use "AI MANDI." Consolidating to a single consumer brand later is a product decision to be recorded here.

### D-012 · scr-017 / scr-018 excluded (wrong problem statement)
**Status:** Locked.
**Decision:** The two handwritten pages describing "Skill Development & Employment Tracking" belong to SIH problem **26139** and are excluded from all AI MANDI docs.
**Why:** They are unrelated to problem 26033; they appear to have slipped into the source zip.
**Implications:** Ignore any trainee/employment-tracking content; do not model it.

### D-013 · Payments & Help Center are post-MVP
**Status:** Locked.
**Decision:** Full payment settlement and a full help centre are deferred; stub cleanly in the MVP.
**Why:** The product owner's own site-flow note (scr-006) brackets "Payments" and "Help Center" as "Future." Focus MVP effort on listing → AI → match → deliver.
**Implications:** UI shows payment status and a help entry point, but no full gateway integration or ticketing system in the MVP.

### D-014 · Admin is operational and English-only
**Status:** Locked.
**Decision:** Admin handles verification, monitoring, disputes, and analytics; its UI is English-only, while all other roles are Hindi-first bilingual.
**Why:** Matches the mockups (scr-005 admin panel is English; farmer/buyer/transporter are Hindi-first) and the reality that operators work in English while end-users need vernacular.
**Implications:** i18n applies to three roles; admin screens skip the Hindi-first requirement but keep the design system.
