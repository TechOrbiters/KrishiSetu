# AI-SYSTEM.md — AI MANDI
### The six AI capabilities · algorithms · fallbacks · explainability

**Read first:** `CLAUDE.md` §7, `DOMAIN-RULES.md` R-014..R-018, `docs/TRD.md` §10–15.

> Every capability returns a **score/value + breakdown + human-readable reason + confidence**, degrades to a transparent heuristic when data is thin (lowering confidence, never fabricating), and never presents a projection as a measured pilot result. Numeric forecasts are statistical/ML; the LLM is used for language and explanation only.

Each capability is specified against a fixed template: **Purpose · Inputs · Output · Data sources · Algorithm · Fallback · Confidence · Business rules · Human override · Privacy · Eval metric · Failure modes.**

---

## 1. DemandSense — Demand Forecasting

**Purpose.** Answer "where and when will this crop be needed, and is there a supply gap?" so a farmer sells into demand rather than into a glut.
**Inputs.** Crop, location (district/city), quantity, time window/season; historical orders, historical arrivals, market prices (AGMARKNET/DoCA PMS), festival/event calendar, weather.
**Output.** `expectedDemandKg`, `expectedSupplyKg`, `gapKg`, `trendPct`, `confidence`, `reason`. Example: *"Lucknow · Tomato · expected 1.8 t, supply 1.2 t, gap +600 kg, ↑17%."*
**Data sources.** `price_history`, `orders`/`order_items`, `produce_listings`, external price/weather feeds; cached in `demand_forecasts`.
**Algorithm.** Statistical/ML time-series per crop×location×horizon: seasonal-naïve and moving-average baselines, ARIMA/Prophet-class models, or gradient-boosted regressors on engineered features (season, festival, price, lagged demand). Choose per-series by backtest error.
**Fallback.** Thin history ⇒ seasonal/heuristic baseline (same-season prior years or regional average) with reduced confidence and a `usedFallback` flag.
**Confidence.** Derived from backtest error and data density; lower for short/sparse series.
**Business rules.** Numbers come from the forecasting model, never an LLM (R-018). Any farmer-facing projected benefit is labelled "illustrative simulation" (R-017).
**Human override.** Advisory only; the farmer decides. Admin can flag/exclude anomalous feeds.
**Privacy.** Aggregates demand; never exposes an individual buyer's identity in a forecast.
**Eval metric.** MAPE/MAE on held-out periods; track fallback rate.
**Failure modes.** New crop/region (no history) → fallback; feed outage → last-known cached forecast, flagged stale; festival/weather shock → wider interval, lower confidence.

---

## 2. SellSmart — Farmer Revenue Calculator

**Purpose.** Answer "where should I sell to earn the most?" by comparing selling options.
**Inputs.** Listing (crop, quantity, quality, location), candidate channels (local mandi, specific buyers/FPO offers), current/expected prices, buyer requirements.
**Output.** Ranked options each with an estimated **farmer revenue** and the best pick + reason. Revenue = `product_price × quantity`.
**Data sources.** `price_history`, active `matches`/buyers, `demand_forecasts`.
**Algorithm.** For each option, estimate the achievable product price (from market data, buyer offers, and DemandSense), compute `revenue = price × qty`, rank, and explain the winner.
**Fallback.** Missing buyer offers ⇒ compare against market modal price only; lower confidence.
**Confidence.** From price-data freshness and forecast confidence.
**Business rules (critical).** **Never subtracts transport, platform, or any fee from the farmer's revenue** (R-002) — the farmer receives the full product price; delivery is the buyer's separate cost.
**Human override.** Advisory; farmer chooses.
**Privacy.** Uses aggregate/market data plus offers already visible to the farmer.
**Eval metric.** Realized vs estimated farmer revenue on completed sales.
**Failure modes.** Volatile prices → show a range not a point; no comparable market → mark low confidence.

---

## 3. SmartMatch — Buyer Matching

**Purpose.** Rank the best buyers for a listing so the farmer sells fast at a good price.
**Inputs.** Listing (crop, qty, quality, location, price), candidate buyers/demands, Maps distance, buyer reliability, delivery-time feasibility.
**Output.** Ranked buyers, each with `matchScore` (0–100), a `breakdown`, `recommendedPrice`, `reason`, `confidence`. Example: *"FreshMart — 94/100."*
**Data sources.** `buyer_demands`, `buyer_profiles` (reliability), `produce_listings`, Maps distance matrix.
**Algorithm (fixed weights — R-014).**
```
score = 100 × ( 0.30·price_fit + 0.25·distance_fit + 0.20·quantity_fit
              + 0.10·quality_fit + 0.10·delivery_time_fit + 0.05·buyer_reliability )
```
Each sub-score normalized to 0–1 (price_fit rises as the buyer's willingness/market meets or beats the ask; distance_fit falls with km; quantity_fit peaks when the buyer wants the full lot; etc.). Deterministic given inputs.
**Fallback.** Missing a sub-signal ⇒ neutral 0.5 for that factor, flagged; confidence reduced.
**Confidence.** From completeness of the six signals and data recency.
**Business rules.** Optimizes the farmer's product price while staying consistent with the buyer's lowest **total delivered cost** (product + delivery); weights sum to 100 and are versioned (R-014); output always explainable (R-016).
**Human override.** Farmer picks any buyer, not only the top match.
**Privacy.** Exposes only buyer info appropriate to a prospective transaction (R-020).
**Eval metric.** Match acceptance rate; realized price vs recommended.
**Failure modes.** No eligible buyers → return empty with guidance (post a demand / adjust price); ties → stable sort by score then distance.

---

## 4. SmartTransport — Transporter Matching ("Rapido for agri")

**Purpose.** Rank the best transporter for a delivery — nearby, right-sized, affordable, available, reliable.
**Inputs.** Transport request (pickup, drop, distance, required capacity, freshness deadline), candidate transporters (location, vehicle capacity, fare, availability, rating).
**Output.** Ranked transporters, each with `score` (0–100), `breakdown`, `estimatedFare`, `eta`, `freshnessStatus`; plus multi-vehicle pooling suggestions for large loads.
**Data sources.** `transporter_profiles`, `vehicles`, live location, Maps distance matrix; freshness from FreshRoute.
**Algorithm (fixed weights — R-015).**
```
score = 100 × ( 0.30·distance_to_pickup_fit + 0.25·capacity_fit
              + 0.20·fare_fit + 0.15·availability + 0.10·rating )
```
Dynamic load pooling: if load > a vehicle's capacity, evaluate multi-vehicle combinations and recommend the cheapest feasible split (e.g., *"2× mini ₹2,000 vs 1× large ₹2,400 → 2× mini, save ₹400"*).
**Fallback.** Sparse candidates ⇒ widen radius, lower confidence.
**Business rules.** Only **freshness-viable** options are acceptable (FreshRoute gate, R-009); the winning fare becomes the order's `delivery_fee` and the transporter's pay (R-003); weights sum to 100 and versioned (R-015).
**Human override.** Farmer/system can pick among ranked options; transporter chooses to accept.
**Privacy.** Pickup contact details revealed to a transporter only after acceptance (R-020).
**Eval metric.** On-time %, freshness-safe delivery %, fare competitiveness.
**Failure modes.** No transporter can meet the window → surface self-pickup or a later slot; all offline → queue and alert.

---

## 5. FreshRoute — Freshness Matching + Route Optimization

**Purpose.** Guarantee perishables are only routed on deliveries that arrive within their freshness window, and pick the best route.
**Inputs.** Listing freshness window, pickup/drop, candidate vehicles/routes, time windows, capacities, order quantities.
**Output.** Per-option `freshnessStatus` (`SAFE`/`AT_RISK`/`EXPIRED`) with window-remaining, plus the optimized route(s), total distance/cost, ETA, and pooling plan.
**Data sources.** `freshness_windows`, `transport_requests`, Maps directions/distance; OR-Tools solver.
**Algorithm.** (a) **Freshness gate:** compute projected arrival per option; exclude any with `eta > deadline`. (b) **Routing (VRP, OR-Tools):**
```
minimize  Σ ( distance + transport_cost + delay_penalty + freshness_penalty )
subject to  vehicle capacity ≥ load,  order quantity constraints,
            delivery time windows,  freshness window (HARD).
```
Dynamic load pooling combines nearby stops to raise utilization (illustratively 60%→92%).
**Fallback.** Solver timeout ⇒ nearest-feasible heuristic route, flagged; still enforces the hard freshness constraint.
**Confidence.** From ETA reliability (traffic/data quality).
**Business rules.** Freshness window is a **hard** constraint — a violating option is never acceptable (R-009); delay and freshness risk are penalties in the objective.
**Human override.** Operators can re-run or manually assign within feasible options.
**Privacy.** Location data used for routing only; not shared beyond the transaction.
**Eval metric.** Freshness-safe delivery %, average utilization, on-time %.
**Failure modes.** No feasible route within the window → recommend self-pickup / re-list / shorter-range buyer; Maps outage → cached distances, wider confidence.

---

## 6. Krishi AI Assistant — Voice-first Multilingual Assistant

**Purpose.** Let a farmer/buyer/transporter *speak* in their language to list produce, search, or ask questions — the lowest-friction entry point.
**Inputs.** Audio or text + language; user context (role, location, listings/orders).
**Output.** Transcription, extracted structured intent/slots (crop, quantity, quality, location, availability, or a question), and either a data-grounded answer or a proposed action (which the user confirms before it commits).
**Data sources.** BHASHINI (STT/translate/TTS), Gemini/Vertex (intent/slot extraction, NL generation), and AI MANDI's own data (listings, prices, orders, forecasts) for grounding.
**Algorithm.** Speak → Understand → Act: STT → normalize/translate → LLM extraction → map to a platform action or a grounded answer → respond in the user's language (TTS optional).
**Fallback.** Low STT confidence ⇒ ask to repeat or offer the manual form; extraction ambiguity ⇒ confirm each slot.
**Confidence.** STT + extraction confidence surfaced; low confidence forces confirmation.
**Business rules.** Answers only from platform data (not open-world guessing); **always confirms before creating/changing a record**; numeric forecasts still come from DemandSense, not the LLM (R-018).
**Human override.** Nothing is committed without explicit user confirmation.
**Privacy.** Audio processed for the request; sensitive identifiers never spoken back in full.
**Languages.** Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Gujarati, Punjabi, Odia, English. (Admin is English and does not use this.)
**Eval metric.** Task completion rate by voice; slot-extraction accuracy; confirmation-correction rate.
**Failure modes.** Dialect/noise → confirm/repeat; unsupported request → hand off to manual UI.

---

## 7. Differentiators (Phase-1.5) & Future

**MarketPilot** (AI selling strategy: "sell 70% now to B2B, freshness risk rising"), **AI Surplus-to-Demand matching** (regional balancing: District A surplus + District B shortage → recommend a move after checking transport cost and buyer price), **Freshness/Spoilage Risk score** (0–100 from crop/harvest/window/transit/distance/storage), **Smart Alerts** (per-role push driven by the models above), **Trust/Reliability score** (completion, cancellations, on-time %, ratings — feeds SmartMatch/SmartTransport), and a single **AI Opportunity Score** (0–100, 🟢/🟡/🔴, combining demand, price, buyer availability, distance, freshness, transport availability). **Future:** photo-based grade assist (advisory), Digital Produce Passport (LOT ID + QR), Price Spread Intelligence (farmer vs wholesale vs retail; DoCA's 22 commodities / 555 centres), predictive harvest planning, pre-harvest demand signals. All obey the same explainability/confidence/honesty rules.

---

## 8. Cross-cutting AI governance

Weights and model versions are documented and version-bumped via `DECISIONS.md`; every recommendation is stored in `ai_recommendations` for audit and explanation (R-016); confidence and `usedFallback` are always populated; projections are labelled simulations (R-017); the AI Service is called only server-to-server and never writes business state directly; and language models are confined to language tasks — the moment a *number* matters (forecast, score, fare, route), a deterministic model or optimizer produces it.
