# AI MANDI — Consolidated Research Brief (from analysis_text.md, 6749 lines, fully read)

## PRODUCT IDENTITY (final decisions)
- **Product name: AI MANDI** (decided at line 4537; supersedes working names "AgriFlow" / "AgriFlow Intelligence Engine" / "AgriSmart").
- Positioning (FINAL, line 5847): **"AI MANDI is a decision-and-fulfillment layer for agricultural commerce."** NOT "an online mandi" (e-NAM already does price discovery/FPO/lots).
- One-liner USP (line 1540): *"From market discovery to delivery optimization — one intelligent layer connecting demand to the nearest viable agricultural supply."*
  Simple form: *"Know where to sell. Know what to charge. Know who will buy. Know how to deliver."*
- Farmer-facing story (line 2861): **"AI tells farmers where to sell, what price to accept, and how to deliver."**
- Core pipeline mantra: **Predict → Recommend → Match → Move → Earn** (a.k.a. Predict → Aggregate → Match → Price → Route → Deliver → Measure).
- Ecosystem tagline: **BUY → SELL → MOVE**.
- NOTE ON BRANDING vs MOCKUPS: mockups use **"Kisan Setu"** (farmer + admin) and **"Kisan Bazaar" / "किसान-क्रेता पोर्टल"** (buyer/transporter). "AI MANDI" is the umbrella product/platform name from the transcript. → NEEDS one canonical decision (ask user). Working assumption: **AI MANDI** = platform/umbrella; **Kisan Setu** = farmer & admin app; **Kisan Bazaar** = buyer & transporter app. Treat as sub-brands unless user says otherwise.

## THE PROBLEM (framing)
- Reframe as a **coordination problem**, not "remove middlemen." Do NOT try to eliminate intermediaries; replace fragmented ones with an intelligent coordination layer (line 1758: "Don't eliminate intermediaries").
- Core innovation = **Supply-Demand Coordination Layer** + **Demand-First marketplace**: answer "what/where/when/how much is needed, and which nearby farmer/FPO can fulfil at best net price."
- **FPO-first, not farmer-first**: aggregate 500 farmers → FPO → hub → platform → 100 buyers (economies of scale). India has ~10,000 FPOs (₹20,358 cr cumulative turnover as of Jul 2026; 6,964 FPOs ≤₹50 lakh turnover).

## FINAL RBAC — 4 ROLES (matches user requirement exactly)
Superseded a 7-role hierarchy (Super Admin→Govt Officer→FPO Mgr→Farmer→Buyer→Logistics→Quality). FINAL 4:
1. **FARMER / FPO** (one combined role): create_produce, view_own_matches, accept_offer, view_own_orders, view_own_payments. FPO adds: manage_farmers, aggregate_lots, manage_inventory, manage_orders, view_fpo_analytics.
2. **BUYER** (buyer_type = consumer | business): search produce, post requirement/demand, accept/buy, track order, choose & pay delivery.
3. **TRANSPORTER / DELIVERY PARTNER**: see assigned/available deliveries, accept shipment, view route, update pickup/delivery, earnings, ratings, vehicle. (User calls this "Delivery Partner".)
4. **ADMIN** (lightweight operational): manage users, verify farmers/buyers/transporters, view transactions, monitor prices, supply-demand dashboard, disputes, analytics.
- Implementation: single `users` table + `role` enum {FARMER_FPO, BUYER, TRANSPORTER, ADMIN} (+ LOGISTICS_PARTNER reserved/Phase-2). Role-specific profile tables attached as needed. Consider RBAC+Scope (role+scope+permission) for realism (e.g., Admin scoped to a state/district).
- "Logistics Partner" (fleet manager) = Phase-2, folded conceptually into Transporter for MVP.

## BUSINESS / MONEY MODEL (DOMAIN RULE — critical)
- **Buyer pays: Product Price + Transportation/Delivery Charge (shown SEPARATELY, never merged).**
- **Farmer/FPO receives full agreed product price** (NOT reduced by transport).
- **Transporter receives the delivery fee.**
- **Platform fee: ₹0 / optional service fee** for MVP.
- Money flow: Buyer ₹12,500 → Farmer ₹11,000 (product) + Transporter ₹1,500 (delivery).
- Therefore: `Farmer Revenue = product_price × qty` (NO transport subtracted). `Buyer Total = product_price + delivery_fee`.
- SmartMatch optimizes BOTH: farmer→best product price; buyer→lowest TOTAL delivered cost (a higher product price can still win if delivery is cheaper).
- Buyer delivery choice = 3 options: **Platform Recommended / Cheapest / Fastest** (mockups scr-007: also Self Pick-up = FREE).
- Platform auto-creates the transport request after buyer confirms order (farmer needn't manage logistics manually).

## THE 6 SIGNATURE AI FEATURES ("Must Build") + naming (verbatim)
1. **DemandSense** — AI Demand Forecasting. "Where will my crop be needed?" Inputs: district/city, crop, qty, time, season, historical orders, market prices, festivals/events, weather. Output: expected demand + demand gap + trend%. e.g., "Lucknow Tomato: expected 1.8 t, supply 1.2 t, gap +600 kg, ↑17%".
2. **SellSmart** — Farmer Revenue Calculator. "Where should I sell?" Compares selling options (mandi vs buyers) by qty/requirement/location/market/historical/expected price. Output: best option + estimated farmer revenue. Do NOT subtract transport.
3. **SmartMatch** — AI Buyer Matching. "Who should buy my produce?" Ranks buyers. **Score = 30% price + 25% distance + 20% quantity fit + 10% quality fit + 10% delivery-time fit + 5% buyer reliability.** Output e.g. "FreshMart — 94/100" + plain-language explanation (explainable AI).
4. **SmartTransport** — "Rapido for Agricultural Transport." Ranks transporters: **30% distance-to-pickup + 25% vehicle capacity + 20% fare + 15% availability + 10% rating** → "Best Transporter 94% Match." Dynamic Transport Request: if load > vehicle, suggest e.g. "2× mini truck ₹2,000 vs 1× large ₹2,400 → recommend 2× mini, save ₹400."
5. **FreshRoute** — Shelf-life / Freshness Window matching. Farmer sets freshness window (e.g., 24h). Transporter only accepts if ETA < window ("✅ can deliver safely" / "❌ cannot meet window"). Buyer sees "freshness window remaining at arrival: 18h20m ✅".
6. **Krishi AI Assistant** — Voice-first multilingual assistant (sits ABOVE all modules). "Speak → Understand → Act." Extracts crop/qty/availability from natural speech; answers using AI MANDI's own platform data. Languages: हिन्दी/বাংলা/मराठी/தமிழ்/తెలుగు/ಕನ್ನಡ/ગુજરાતી/ਪੰਜਾਬੀ/ଓଡ଼ିଆ/English. Tech direction: BHASHINI (govt) for STT/translation/TTS.

## STRONG DIFFERENTIATORS (Phase-1.5) & FUTURE
- **MarketPilot** — AI Selling Strategy: "What should I do now?" e.g., "Sell 70% now to B2B, freshness risk rising."
- **AI Surplus-to-Demand Matching** — "Regional supply-demand balancing system": detect District A surplus 4T + District B shortage 3T → recommend move (after checking transport cost + buyer price).
- **Freshness/Spoilage Risk AI** — Freshness Risk Score (e.g., 82/100 HIGH) from crop/harvest/window/transit/distance/storage.
- **Smart Alerts** — per-role push (demand ↑, buyer above avg, freshness expiring, transporter nearby; buyer: produce available; transporter: new request Nkm away).
- **Trust / Reliability Score** — buyer/transporter/farmer reliability (NOT "credit score"): completion, cancellations, on-time%, ratings.
- FUTURE: Photo-Based Produce Listing (AI-assisted grade detect, not certified), Digital Produce Passport (LOT-##### + QR), Price Spread Intelligence (farmer vs wholesale vs retail; DoCA monitors 22 commodities/555 centres), Predictive Harvest Planning, Pre-Harvest Demand Signal / Future Supply Intent.
- **AI Opportunity Score** (recommended add): one number 0-100 "SELLING OPPORTUNITY: 91/100" 🟢/🟡/🔴 from demand/price/buyer availability/distance/freshness/transport availability.

## KEY DIFFERENTIATOR vs competitors
- Competitors: Ninjacart, DeHaat, WayCool, Arya.ag. Don't say "we connect farmers & buyers" (exists).
- Distinction (line 1522): **"We optimize the transaction BEFORE it happens."** predict→aggregate→match→price→route→transact (vs list→buy→deliver).

## SIGNATURE SCREENS / CONCEPTS
- **"Best Selling Opportunity"** screen (line 316): farmer enters crop/qty/quality/location → system returns ranked options (Local Mandi / Restaurant Buyer / Retail Cluster) each with price, transport, NET realization + AI recommendation + confidence %.
- **Value Chain Transparency Card** (line 409): per transaction show Consumer pays ₹32 = Farmer ₹23 + Aggregation ₹1.5 + Logistics ₹3 + Sorting/grading ₹1.5 + Platform ₹0.5 + Other verified ₹2.5. Answers "where did my money go / why this price."
- **Farmer Gain** number (line 1421): Traditional ₹18.20/kg vs Platform ₹22.10/kg = +₹3.90/kg; Consumer ₹31→₹27 = save ₹4. LABEL AS "Illustrative simulation" (no fake pilot claims).
- **Demand Pooling** (line 264, central USP): aggregate many households' demand + multiple FPOs' supply into clusters.
- **Dynamic Load Pooling** (line 1386): one truck, multiple orders/stops (util 60%→92%).
- Admin **Agri Supply Intelligence Dashboard** + **Price Spread Intelligence** (DoCA relevance).

## MATH CORE
- Net Farmer Realization (general) = Buyer Price − Logistics − Handling − Platform Fee − Expected Quality Deduction. **BUT for AI MANDI model, farmer realization = product price only** (buyer pays transport).
- Consumer Landed Price = Farmer Price + Aggregation + Processing + Logistics + Platform + other verified costs.
- Route optimization = **Vehicle Routing Problem (VRP)**. Minimize (total distance + transport cost + delay penalty + freshness penalty) s.t. vehicle capacity, quantity, delivery windows. Tool: **Google OR-Tools**.
- Demand forecast: use real ML/statistical methods (not "ask LLM to predict"). Sample/historical data OK for hackathon. (Prophet/ARIMA/LightGBM-class; transcript says "statistical methods," specific lib not mandated — use classical TS + heuristic fallback.)

## RECOMMENDED TECH STACK (transcript §27)
- Frontend: **Next.js + TypeScript + Tailwind**, **PWA** (mobile-first, offline-lean).
- Backend: **Node.js / Next.js API routes / FastAPI** (Python for heavy AI/optimization).
- DB: **PostgreSQL / Supabase**.
- LLM/voice: **Gemini / Vertex AI** (or equivalent) for voice extraction, multilingual assistant, NL summaries, explainable recs. **BHASHINI** for Indic STT/translate/TTS.
- Optimization: **Python + Google OR-Tools** (routing, assignment).
- Maps: **Google Maps Platform** (geocoding, distance matrix, routing).
- Notifications: **Firebase Cloud Messaging** (+ SMS/WhatsApp optional entry channel).
- Deploy: **Vercel + Railway/Supabase**.
- ⚠️ TENSION: the doc-workflow section also references **Webflow** (user apparently mentioned it). Mockups are complex live-data app screens (maps, voice, real-time tracking) NOT realistically Webflow-buildable. → ASK USER which stack is authoritative. Recommend Next.js app stack.

## GOVERNMENT DATA / INTEGRATIONS (real, cite in pitch)
- **AGMARKNET** (data.gov.in daily mandi prices: modal/min/max, arrivals) → market price data.
- **DoCA Price Monitoring System** (fcainfoweb.nic.in) — 22 essential commodities, 555 market centres — DIRECT relevance (problem owner = DoCA).
- **e-NAM** — conceptual: trading, FPOs, price discovery, lot tracking, logistics. Position ABOVE it, don't replace.
- **BHASHINI** — multilingual voice/translation.
- Post-harvest losses ~6–18% (ICAR 2026) → justifies FreshRoute.
- Do NOT replace e-NAM/ONDC; position as intelligence + orchestration layer on top.

## DATABASE (transcript §28 + §backend entities)
Core tables: users; farmers; fpos; farms; produce_lots (crop, quantity, quality, harvest_date, location, farmer_id); buyer_demands (buyer_id, crop, quantity, price_range, delivery_location, delivery_date); matches (lot_id, demand_id, match_score, recommended_price); orders; payments; shipments; vehicles; routes; quality_reports; price_history; forecasts.
Backend entity set: User, FarmerProfile, FPO, BuyerProfile, TransporterProfile, LogisticsPartner, Vehicle, ProduceListing, DemandRequest, BuyerMatch, Order, TransportRequest, Shipment, FreshnessWindow, Payment, Notification, Rating, Dispute, AIRecommendation.

## API SURFACE (transcript §API)
Namespaces: /api/auth, /api/users, /api/farmers, /api/fpos, /api/buyers, /api/produce, /api/demand, /api/matches, /api/orders, /api/transport, /api/transporters, /api/shipments, /api/freshness, /api/ai, /api/payments, /api/notifications, /api/admin.
Every endpoint documents: Method, URL, Auth, RBAC permission, Request, Validation, Response, Errors, Business rules, Example.
Example: POST /api/transport/requests — role FARMER_FPO/BUYER — in {orderId, pickupLocation, deliveryLocation, freshnessDeadline, vehicleCapacity} → out {requestId, eligibleTransporters, estimatedFare, estimatedDeliveryTime, freshnessStatus}. Use **OpenAPI 3.x** as source of truth.

## ORDER / FULFILMENT STATE MODEL (from scr-020 + transcript)
User orders product (chooses Self-service OR Delivery) → Farmer gets notification → Farmer ACCEPTS order → two branches:
 (a) Self Service → no further logistics steps (buyer picks up at FPO/farm; FREE).
 (b) Delivery → platform creates transport request → nearby transporters ranked (SmartMatch/SmartTransport) → transporter accepts (subject to FreshRoute) → Pickup → In Transit → Delivered → Payment settled.
Order statuses seen in mockups: New/नया ऑर्डर, Accepted/स्वीकार किया, Ordered, Packed, Dispatched, In Transit/डिलीवरी में, Delivered/पूरा हुआ, Cancelled/रद्द.
Delivery stepper: Order confirmed → Scheduled for pickup → Picked up → Out for delivery → Delivered.

## MVP SCOPE (transcript §41)
Build: (1) Produce Listing, (2) AI Recommendation (DemandSense+SellSmart+SmartMatch = one "AgriSmart Engine"), (3) Buyer Demand, (4) Simple Logistics (route optimization as demo), (5) Transparent Price. ~8 core screens: Landing, Login/Register, Farmer Dashboard, Add Produce, AI Recommendations, Buyer Dashboard, Order+Logistics Tracking, Admin Dashboard.
EXCLUDE from MVP: separate Govt/Quality/Finance/Support officer roles, complex warehouse mgmt, blockchain, full e-NAM/ONDC replacement, advanced escrow, complex bidding, huge consumer grocery catalogue.
From handwritten scr-006: **Payments + Help Center = "Future"** (author's own de-scope).

## 3-MINUTE DEMO SCRIPT (transcript §43)
Scene1 Farmer adds 500kg tomato (voice/photo) → Scene2 AI (DemandSense forecast + SellSmart net + SmartMatch buyer 94%) → Scene3 Buyer sees offer, accepts (product + delivery shown separately) → Scene4 SmartTransport ranks transporters, FreshRoute checks window, route optimized → Scene5 Value Chain Transparency card → Scene6 Admin/Govt Agri Supply Intelligence + Price Spread. Close: Farmer Gain +₹3.90/kg, Consumer −₹4/kg (illustrative simulation).

## KPIs (transcript §48)
↑ Farmer net realization, ↓ Consumer landed price, ↓ Logistics cost, ↓ Unsold/spoiled produce. Plus: farmers registered, active buyers, produce matched %, avg farmer price, orders today, truck utilization %, on-time delivery %, freshness-safe delivery %.

## DOC WORKFLOW GUIDANCE (transcript §doc workflow) — shapes our deliverables
- CLAUDE.md = "constitution"/briefing for a new teammate: mission, problem, roles, workflows, architecture, stack, conventions, folder structure, DB rules, API rules, AI rules, security rules, UI/UX rules, testing, deployment, and **"Things Claude MUST NOT do."** Keep concise-ish; NO secrets/keys.
- PRD sections (23): Exec summary, Problem, Existing analysis, Target users, Personas, Goals, Non-goals, Value prop, RBAC, User journeys, Functional reqs, AI features, Marketplace flow, Transportation flow, Freshness flow, Multilingual flow, Notifications, Payments, Admin reqs, KPIs, MVP scope, Future scope, Acceptance criteria.
- TRD sections (28): Overview, Architecture, Stack, FE arch, BE arch, DB arch, Auth, RBAC, API arch, AI arch, DemandForecasting, SmartMatch, SmartTransport, FreshRoute, Multilingual AI, Notifications, Payments, File/Image storage, Maps/Geo, Security, Rate limiting, Error handling, Logging, Monitoring, Testing, Deployment, Scalability, DR.
- API doc = OpenAPI 3.x + per-endpoint template above.
- UI/UX doc = design philosophy, brand, color, type, spacing, grid, buttons, cards, forms, tables, nav, mobile, breakpoints, a11y, loading/empty/error/success states, dialogs, AI components, maps, charts, voice UI, multilingual UI, + **UI per role**.
- Backend doc = entities + relationships.
- AI doc = per capability: purpose, input, output, data source, algorithm/model, fallback, confidence, business rule, human override, privacy, eval metric, failure cases.
- Extra recommended files: **DECISIONS.md** (buyer pays transport; farmer+FPO one role; transporter=individual; logistics partner=fleet; freshness window at listing) and **DOMAIN-RULES.md** (product price ≠ delivery charge; buyer pays delivery; transporter accepts only if fits freshness; farmer revenue excludes transport).
- Repo layout suggested: /CLAUDE.md, /docs/{PRD,TRD,ARCHITECTURE,DATABASE,API,AI-SYSTEM,RBAC,UI-UX,SECURITY,TESTING,DEPLOYMENT}.md, /.claude/skills, /.claude/commands, /.claude/agents.

## "WEB FLOW" interpretation
User asked for "WEB FLOW". Transcript's "Webflow" = the SaaS builder (separate). User's own handwritten notes scr-006 (site map) & scr-020 (order flow) are **user/navigation flows**. → Deliver a **Web Flow doc** = sitemap + navigation per role + screen-to-screen user journeys + order/transport state flow. (Clarify if they actually meant the Webflow builder.)
