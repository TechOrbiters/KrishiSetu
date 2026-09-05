# PRD — AI MANDI
### Product Requirements Document
**Problem Statement:** SIH 2026 · ID 26033 — "Multiple intermediaries reduce farmers' earnings and increase consumer prices."
**Owner:** Ministry of Consumer Affairs, Food & Public Distribution → Department of Consumer Affairs (DoCA).
**Category:** Software · **Theme:** Agriculture, FoodTech & Rural Development.
**Status:** MVP definition · **Read first:** `CLAUDE.md`, `DOMAIN-RULES.md`.

---

## 1. Executive summary

Indian farmers sell into a chain of intermediaries that each take a cut, so the farmer receives a small fraction of the final price while the consumer pays a large one. The margin disappears into fragmented, opaque middle steps, and perishable produce loses 6–18% to delays along the way.

AI MANDI is a **decision-and-fulfillment layer for agricultural commerce**. It connects farmers and FPOs directly with consumers and bulk buyers, arranges logistics through a Rapido-style network of individual transporters, and applies AI to the parts humans do badly: forecasting where demand will be, recommending who to sell to and at what price, matching the right transporter, and routing the delivery so produce arrives fresh. The farmer receives the full product price; the buyer pays that price plus a transparent delivery charge; the platform takes no hidden cut.

The product's distinctive claim is that it **optimizes the transaction before it happens** — predict → aggregate → match → price → route → transact — rather than merely listing produce and processing orders after the fact. It layers on top of public rails (AGMARKNET, DoCA Price Monitoring, e-NAM, BHASHINI) rather than replacing them.

This PRD defines the MVP: produce listing (including voice and photo entry), the AI recommendation engine, buyer demand and checkout, logistics with freshness-aware transporter matching and route optimization, transparent pricing, and four role dashboards.

## 2. The problem

**Root cause.** Between a smallholder and a consumer sit commission agents, wholesalers, sub-wholesalers, and retailers. Each adds cost and opacity. The farmer has weak price information and no direct line to demand; the consumer has no visibility into how the final price was built. Perishables degrade during the delays this chain introduces.

**Quantified context.** India has ~10,000 FPOs (₹20,358 cr cumulative turnover as of July 2026; 6,964 FPOs at ≤ ₹50 lakh turnover), yet most lack a demand-intelligence and logistics layer. ICAR estimates post-harvest losses of ~6–18%. DoCA itself monitors 22 essential commodities across 555 market centres — evidence that price volatility and spread are a first-order government concern.

**Why it persists.** Existing marketplaces connect farmers and buyers but still work reactively (list → buy → deliver) and treat logistics and freshness as someone else's problem. Nobody coordinates *demand, supply, price, and delivery together, ahead of the sale.*

## 3. Analysis of existing solutions

**Public rails.** e-NAM provides trading, FPO onboarding, price discovery, and lot tracking; ONDC provides open commerce interoperability; AGMARKNET publishes daily mandi prices; the DoCA Price Monitoring System tracks essential-commodity prices; BHASHINI provides Indic language services. These are assets to build on, not competitors.

**Private players.** Ninjacart, DeHaat, WayCool, and Arya.ag aggregate and distribute produce with real logistics and financing. They are strong operators but the model is still largely list/procure → distribute. None make pre-transaction demand-and-route intelligence the centerpiece, and pricing transparency to the farmer/consumer is limited.

**Gap AI MANDI fills.** A demand-first coordination layer that forecasts demand, recommends the best sell decision and buyer, matches a freshness-viable transporter, optimizes the route, and shows every rupee of the value chain — sitting above the public rails.

## 4. Target users

Smallholder and mid-size **farmers** with intermittent connectivity and low comfort with English or dense UIs; **FPOs** aggregating hundreds of member farmers who need inventory, order, and analytics tooling; **consumers** (households) wanting fresh produce at fair prices; **business buyers** (kirana stores, retailers, hotels, restaurants) buying in bulk; **individual transporters** with a vehicle looking for well-paid, nearby, time-viable jobs; and **DoCA/platform operators** who verify participants and monitor market health.

## 5. Personas

**Ramesh (Farmer).** 40s, grows wheat/potato/tomato on a few acres in Barabanki, UP. Speaks Hindi, uses a mid-range Android phone, prefers speaking to typing. Wants a fair price and to not get stuck with unsold or spoiled produce. Needs the app to tell him where and when to sell and to handle delivery for him.

**Sharma FPO (FPO manager).** Aggregates ~250 farmers, 20+ products, 98% on-time reputation. Needs to pool member lots into bulk offers, manage incoming orders, and see analytics. Judged by member farmers on the price he secures.

**Rohit / Preeti (Buyer).** Rohit runs a store in Lucknow; Preeti is a household buyer. Both want produce cheaper than the market with proof of freshness and a clear delivery ETA, paying product and delivery separately.

**Raj Transport (Transporter).** Owns a Mini Truck (1,000 kg), rated 4.8 (128 trips). Wants nearby, well-paid jobs he can complete within the pickup and freshness windows, with clear earnings and live navigation.

**DoCA Operator (Admin).** Verifies farmers/FPOs/buyers/transporters, watches order and delivery health, monitors the farmer-vs-market price spread, and resolves disputes. Works in English.

## 6. Goals

Raise the farmer's net realization per unit; lower the consumer's landed price; cut logistics cost through smart matching and load pooling; reduce unsold and spoiled produce via demand forecasting and freshness-aware routing; and make the entire value chain transparent so both farmer and consumer can see how the price was formed. Do all of this in a vernacular, voice-first interface usable on a low-end phone with poor connectivity.

## 7. Non-goals (MVP)

AI MANDI does not replace e-NAM/ONDC, does not run a full payment gateway or escrow (payments are Phase-2), does not ship a full help centre, does not build warehouse management, blockchain, complex auctions/bidding, a large consumer grocery catalogue, or the fleet Logistics Partner UI. Separate government/quality/finance/support officer roles are out of scope; there are exactly four roles.

## 8. Value proposition

For the **farmer**: "Know where to sell, what price to accept, who will buy, and how to deliver — and keep the full product price." For the **buyer**: "Buy fresh, direct from farmers, cheaper than the market, with a transparent delivery charge and live tracking." For the **transporter**: "Get nearby, well-paid, time-viable jobs with smart routing." For **DoCA**: "See supply, demand, and the farmer-vs-market price spread across the state, and act on it." The unifying idea: **we optimize the transaction before it happens.**

## 9. RBAC (summary)

Four roles — Farmer/FPO (`FARMER_FPO`), Buyer (`BUYER`), Transporter/Delivery Partner (`TRANSPORTER`), Admin (`ADMIN`) — with `LOGISTICS_PARTNER` reserved for Phase-2. Farmer and FPO are one role (FPO unlocks aggregation/management). Buyers carry a `buyer_type` of consumer or business. Full permission matrix in `docs/RBAC.md`. This is fixed (see `DECISIONS.md` D-002/D-003).

## 10. User journeys (primary)

**Farmer sells surplus.** Ramesh opens the farmer dashboard, taps the voice FAB, and says "I have 500 kg tomatoes, good quality, in Barabanki." The app extracts crop/quantity/quality/location, asks him to set a freshness window, and creates a listing. DemandSense shows where tomatoes are in demand; SellSmart estimates his revenue for each option; SmartMatch surfaces ranked buyers ("FreshMart — 94/100"). He accepts an offer. The platform handles delivery.

**Buyer orders fresh produce.** Preeti searches "20 kg tomatoes" (typed or spoken), sees nearby farmer/FPO listings priced below market with a savings badge, adds to cart, and at checkout picks a delivery option — Smart Delivery (recommended), a cheaper option, a faster option, or free Self Pick-up. She sees product price and delivery charge separately and a clear total, confirms, and tracks the order live.

**Farmer accepts and delivery happens.** Ramesh is notified of the order and accepts within the accept window. Because Preeti chose delivery, the platform auto-creates a transport request. SmartTransport ranks nearby transporters, FreshRoute filters to those who can arrive within the freshness window, and the route is optimized. Raj Transport accepts, picks up, and the buyer and farmer both watch live tracking through Delivered.

**Admin oversees.** The DoCA operator reviews pending verifications, watches the order-status and delivery-health dashboards, monitors the farmer-vs-market price spread, and resolves a delayed-delivery dispute.

## 11. Functional requirements

**Authentication & profiles.** Register/login by role; phone-based auth; Aadhaar-based farmer verification (masked storage); role-specific profiles (farmer/FPO, buyer with type, transporter with vehicle, admin with optional region scope).

**Produce listing.** Create/edit/delete listings via manual form, **voice** ("बोलकर लिस्ट करें"), or **photo**; each listing has crop, quantity, quality/grade, price per unit, cultivation location, minimum order quantity, and a **freshness window**; listing states: active, low-stock, order-received, expired/sold; view counts and per-listing analytics.

**Demand.** Buyers can browse/search (multilingual, voice) and can **post a demand/requirement** (crop, quantity, price range, delivery location, delivery date) that the system matches to supply.

**AI recommendations.** DemandSense (forecast + gap + trend), SellSmart (revenue per option), SmartMatch (ranked buyers with score + reason), an optional AI Opportunity Score. All explainable, all confidence-bounded.

**Cart & checkout.** Add to cart; choose delivery method (delivery partner vs self pick-up); pick a delivery option (Recommended / Cheapest / Fastest / Self Pick-up = free); see product price and delivery charge separately with a total and a market-comparison savings figure.

**Order lifecycle.** Place → farmer accepts (within accept window) → self-pickup or packed → dispatched → in-transit → delivered; cancellations per rules; status visible to all relevant parties.

**Transport.** On acceptance of a delivery order, auto-create a transport request; SmartTransport ranks transporters; FreshRoute enforces the freshness window; route optimized via VRP; transporter accepts, updates pickup/in-transit/delivered; live location tracking.

**Freshness.** Window set at listing; enforced at transporter acceptance and in routing; freshness-safe/at-risk shown to farmer, buyer, and transporter.

**Payments (stub).** Show product/delivery/total and payment status; full settlement deferred (Phase-2), but the model records who is owed what (farmer = product price, transporter = delivery fee).

**Notifications.** Per-role alerts (new order, order accepted, demand up, buyer above average price, freshness expiring, transporter nearby, produce available, new job N km away).

**Ratings & trust.** Buyers/transporters/farmers accrue ratings and a reliability score used by matching.

**Admin.** Verify participants; manage users; monitor orders, deliveries, prices, and supply-demand; handle disputes; view reports/analytics including the farmer-vs-market price spread.

**Multilingual & voice.** Ten languages via BHASHINI; Krishi AI Assistant available across farmer/buyer/transporter surfaces; admin in English.

## 12. AI features (product view)

The six capabilities of §7 in `CLAUDE.md` — DemandSense, SellSmart, SmartMatch, SmartTransport, FreshRoute, Krishi AI Assistant — are the product's core value and are "must build." Phase-1.5 differentiators (MarketPilot selling strategy, AI Surplus-to-Demand regional balancing, Freshness/Spoilage Risk score, Smart Alerts, Trust/Reliability score, a single AI Opportunity Score) sharpen the pitch. Future items (photo grade-assist, Digital Produce Passport, Price Spread Intelligence, predictive harvest planning) extend it. Technical specs live in `docs/AI-SYSTEM.md`; every output is explainable and confidence-bounded (`DOMAIN-RULES.md` R-014..R-018).

## 13. Marketplace flow (requirements)

The marketplace is demand-aware: listings and demands are both first-class, and the system continuously matches them. A buyer can act on an existing listing or post a demand that pulls supply. Aggregation through FPOs turns many small lots into bulk offers that attract business buyers and cheaper logistics. Pricing is always transparent: the buyer sees the product price, the delivery charge, the total, and the market comparison; the farmer sees the full product price they will receive.

## 14. Transportation flow (requirements)

Delivery is a distinct, priced service. When a buyer chooses delivery and the farmer accepts, the platform creates a transport request automatically. SmartTransport ranks individual transporters by proximity, capacity, fare, availability, and rating; FreshRoute removes any option that cannot arrive within the freshness window; the route is optimized via VRP with dynamic load pooling so one vehicle can serve nearby stops. The transporter is paid the delivery fee. Live tracking is available to buyer and farmer from pickup to delivery.

## 15. Freshness flow (requirements)

Freshness is enforced end to end. The farmer sets a window at listing time; the system computes, for each transport option, whether estimated arrival falls within it; only viable options can be accepted; the route penalizes delay and freshness risk; and all parties see freshness-safe/at-risk indicators, including the window remaining at projected arrival.

## 16. Multilingual & voice flow (requirements)

Farmer, buyer, and transporter interfaces are Hindi-first and switchable across ten Indian languages via BHASHINI. Voice is a primary input: farmers can list produce by speaking; buyers can search by speaking; the Krishi AI Assistant answers questions using platform data. The assistant follows Speak → Understand → Act: transcribe, extract structured intent (crop, quantity, availability, etc.), and either answer or perform the action, in the user's language. Admin remains English.

## 17. Notifications (requirements)

Push notifications (FCM), with SMS/WhatsApp as low-end fallbacks, delivered per role and event: farmers get new-order, order-accepted, demand-up, and price-opportunity alerts; buyers get produce-available and order-status alerts; transporters get new-job-nearby and pickup-window alerts; admins get delay/exception and pending-assignment alerts. Notifications are localized.

## 18. Payments (requirements, MVP-stubbed)

The MVP records and displays the money model — product amount to the farmer, delivery fee to the transporter, buyer total as their sum, platform fee ₹0 — and shows payment status per order, but does not integrate a full gateway or escrow (deferred per `DECISIONS.md` D-013). The data model must be settlement-ready so Phase-2 can add a gateway without reshaping orders.

## 19. Admin requirements

The admin (English UI) verifies farmers, FPOs, buyers, and transporters; manages users; monitors orders (status breakdown), deliveries (on-time/in-transit/delayed/exception), market prices, and supply-demand balance; resolves disputes; and views reports and analytics — most importantly the **farmer-price-vs-market-price spread** that demonstrates the platform's impact and speaks directly to DoCA's mandate. Admins may be scoped to a region.

## 20. Success metrics (KPIs)

Primary outcomes: **↑ farmer net realization**, **↓ consumer landed price**, **↓ logistics cost**, **↓ unsold/spoiled produce**. Operational metrics: farmers/FPOs registered, active buyers, percentage of produce matched, average farmer price vs market, orders per day, truck utilization %, on-time delivery %, and freshness-safe delivery %. The hero number is **Farmer Gain** (e.g., +₹3.90/kg vs traditional channels) with a corresponding consumer saving — always labelled an illustrative simulation until real pilot data exists (`DOMAIN-RULES.md` R-017).

## 21. MVP scope

Build produce listing (manual + voice + photo), the AI recommendation engine (DemandSense + SellSmart + SmartMatch), buyer browse/search/demand and checkout, logistics with SmartTransport + FreshRoute + a route-optimization demo, transparent pricing, and the four role dashboards — approximately eight core screens (Landing, Login/Register, Farmer Dashboard, Add Produce, AI Recommendations, Buyer Home/Dashboard, Order + Logistics Tracking, Admin Dashboard). Payments and Help Center are stubbed as "Future" per the owner's own site-flow note.

## 22. Future scope

Full payments/escrow and a help centre; the fleet Logistics Partner role and multi-vehicle dispatch; MarketPilot and AI Surplus-to-Demand balancing in production; Freshness/Spoilage Risk scoring; photo-based grade assistance; the Digital Produce Passport (LOT ID + QR); Price Spread Intelligence dashboards for DoCA; predictive harvest planning and pre-harvest demand signals; deeper e-NAM/ONDC interoperability.

## 23. Acceptance criteria

The MVP is accepted when: a farmer can list produce by voice and set a freshness window; DemandSense, SellSmart, and SmartMatch each return an explainable, confidence-bounded result for a real listing; a buyer can search (typed or spoken), see nearby listings priced against the market, and check out seeing **product price and delivery charge separately** with a correct total; choosing delivery auto-creates a transport request that SmartTransport ranks and FreshRoute filters, and a transporter can accept **only** a freshness-viable job; the order progresses through the canonical state machine with live tracking; the farmer is credited the full product price and the transporter the delivery fee (recorded, per the stubbed payment model); the admin can verify a participant and view the farmer-vs-market price spread; all farmer/buyer/transporter screens render Hindi-first and support the language switch while admin renders in English; and no screen, response, or record ever merges product price with delivery charge or subtracts transport from farmer revenue (`DOMAIN-RULES.md` R-001..R-004). All four roles' screens match `docs/UI-DESIGN.md` and the mockups.
