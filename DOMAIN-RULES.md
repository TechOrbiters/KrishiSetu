# DOMAIN-RULES.md — AI MANDI

> The business **invariants**. These are not preferences — they are properties that must hold in the schema, the API, the AI, and the UI at all times. Each rule is written so it can be turned into a validation check or a test. If code can violate one of these, the code is wrong.

Legend: **R-xxx** rule · **Enforced in** where it lives · **Test** how to prove it holds.

---

## Money & value flow

### R-001 · Product price and delivery charge are always separate
The product price and the transportation/delivery charge are distinct values. They are never merged, blended, or averaged into a single number in storage, API responses, or the UI.
**Enforced in:** DB (`orders.product_amount`, `orders.delivery_fee` as separate columns), API (responses return both fields), UI (separate line items with a visible total).
**Test:** No code path produces a single "price" that includes delivery. Every buyer-facing total renders ≥ 2 lines (product, delivery) + total.

### R-002 · The farmer/FPO receives the full product price
`farmer_revenue = product_price × quantity`. Transportation, platform fees, or any other charge are **never** subtracted from the farmer's revenue.
**Enforced in:** payment/settlement logic; SellSmart revenue calculation.
**Test:** For any completed order, amount credited to the farmer == product_amount. Assert no deduction terms in the farmer settlement formula.

### R-003 · The transporter receives the delivery fee
`transporter_pay = delivery_fee` for the assigned shipment (adjusted only by explicit, itemized pooling splits).
**Enforced in:** settlement logic; SmartTransport fare handling.
**Test:** For any delivered shipment, amount credited to the transporter == the order's delivery_fee (or its documented pooled share).

### R-004 · Buyer total is the sum of the parts
`buyer_total = (product_price × quantity) + delivery_fee`. Self Pick-up ⇒ `delivery_fee = 0`.
**Enforced in:** order totals; checkout.
**Test:** buyer_total == product_amount + delivery_fee for every order; self-pickup orders have delivery_fee == 0.

### R-005 · Platform service fee is ₹0 in MVP and always itemized if introduced
The MVP charges no platform service fee. If one is ever added, it must be a separate, explicitly labelled line item — never a hidden markup folded into product price or delivery.
**Enforced in:** order model, pricing display.
**Test:** No implicit margin exists between what the buyer pays and (farmer product price + transporter fee) other than a visible, named fee line.

---

## Roles & access

### R-006 · Exactly four active roles
`role ∈ { FARMER_FPO, BUYER, TRANSPORTER, ADMIN }` for all live users. `LOGISTICS_PARTNER` is reserved and has no MVP user-facing flows.
**Enforced in:** `role` enum; registration; RBAC middleware.
**Test:** No live user is created with `LOGISTICS_PARTNER`; enum contains exactly these five values, four assignable.

### R-007 · Authorization is server-enforced
Every protected action checks the caller's role and permission on the server. Hiding UI is not access control.
**Enforced in:** API middleware / route guards.
**Test:** Calling a role-restricted endpoint with a wrong-role token returns 403, regardless of UI state.

### R-008 · A user acts only within their role's permission set
A farmer cannot access buyer/transporter/admin actions and vice-versa. FPO abilities are permission flags on `FARMER_FPO`. Admin may be scoped to a region.
**Enforced in:** RBAC permission matrix (`docs/RBAC.md`).
**Test:** Each endpoint's allowed roles match the matrix; cross-role calls are rejected.

---

## Freshness & fulfilment

### R-009 · A transporter may accept a delivery only if it fits the freshness window
Acceptance is allowed only when estimated arrival time ≤ the listing's freshness window. Options that miss the window are shown as "cannot meet window" and are non-acceptable by that vehicle.
**Enforced in:** FreshRoute filter; transport-request acceptance API; VRP hard constraint.
**Test:** An accept attempt where ETA > freshness window is rejected (422/409); such options never appear as acceptable in SmartTransport results.

### R-010 · Every perishable listing has a freshness window
The freshness window is set by the farmer/FPO at listing time and is required for perishables.
**Enforced in:** listing creation validation.
**Test:** Creating a perishable listing without a freshness window fails validation.

### R-011 · Order lifecycle follows the canonical state machine
Allowed transitions only: `PLACED → ACCEPTED`; `ACCEPTED → SELF_PICKUP` (self-service) or `ACCEPTED → PACKED → DISPATCHED → IN_TRANSIT → DELIVERED` (delivery); any non-terminal state `→ CANCELLED` per cancellation rules. No skipping or backward transitions.
**Enforced in:** order state service.
**Test:** Illegal transitions (e.g., `PLACED → DELIVERED`) are rejected.

### R-012 · The farmer/FPO must accept before fulfilment
No shipment or transport request is created until the farmer/FPO accepts the order. On acceptance of a delivery order, the platform auto-creates the transport request.
**Enforced in:** order-accept handler.
**Test:** No transport request exists for an order still in `PLACED`; accepting a delivery order creates exactly one transport request.

### R-013 · Self-service means no logistics and no delivery fee
If the buyer chooses Self-Service (self pick-up), no transport request is created and `delivery_fee = 0`.
**Enforced in:** checkout + order-accept branch.
**Test:** Self-service orders have no shipment and zero delivery fee.

---

## AI behavior

### R-014 · SmartMatch uses the fixed weighting
Buyer match score = 30% price + 25% distance + 20% quantity fit + 10% quality fit + 10% delivery-time fit + 5% buyer reliability. Weights are documented and versioned.
**Enforced in:** SmartMatch scorer.
**Test:** Weights sum to 100%; changing them requires a version bump + `DECISIONS.md` note.

### R-015 · SmartTransport uses the fixed weighting
Transporter rank score = 30% distance-to-pickup + 25% vehicle capacity + 20% fare + 15% availability + 10% rating.
**Enforced in:** SmartTransport scorer.
**Test:** Weights sum to 100%; deterministic given the same inputs.

### R-016 · Every AI output is explainable and confidence-bounded
Each recommendation returns `score` (0–100), a `breakdown`, a human-readable `reason`, and a `confidence`. Thin data ⇒ heuristic fallback with reduced confidence, never a fabricated number.
**Enforced in:** AI service response schema.
**Test:** No recommendation is returned without all four fields; low-data cases carry lower confidence and a fallback flag.

### R-017 · Projections are labelled as simulations
Any projected gain/saving figure shown to users (e.g., "Farmer Gain +₹3.90/kg", "you save ₹495") is labelled as an illustrative simulation, not a measured pilot result.
**Enforced in:** UI copy; API metadata flag on projected values.
**Test:** Projected-value UI components render the "illustrative simulation" label.

### R-018 · Demand forecasting is statistical, not LLM-guessed
Numeric demand forecasts come from statistical/ML models. LLMs are used only for language understanding and explanation.
**Enforced in:** AI service architecture.
**Test:** The forecasting endpoint's numbers originate from the forecasting model, not a text-generation prompt.

---

## Data, privacy & integrity

### R-019 · Sensitive identifiers are masked and protected
Aadhaar and phone numbers are stored securely and shown masked (e.g., `XXXX XXXX 1234`). Raw Aadhaar is never returned to another user or logged in plaintext.
**Enforced in:** user/profile model; serializers; logging.
**Test:** API responses and logs never contain an unmasked Aadhaar number.

### R-020 · Cross-user PII is disclosed only as a transaction requires
A transporter sees pickup contact details only after accepting a job; a buyer sees the farmer/FPO identity relevant to their order; no role can enumerate another role's PII wholesale (except Admin, for operations).
**Enforced in:** API authorization + response shaping.
**Test:** Pre-acceptance transport responses omit contact PII; buyer endpoints don't expose unrelated farmers' private data.

### R-021 · No secrets in the repository
No API keys, passwords, DB credentials, or tokens in any file, doc, or commit. Secrets live only in environment/secret storage.
**Enforced in:** code review; secret scanning; `.gitignore`.
**Test:** Secret scanner finds nothing; `docs/` and `CLAUDE.md` contain no credentials.

### R-022 · Currency math is exact
Monetary amounts use a consistent, non-lossy representation (integer minor units or decimal), never binary floats in business/settlement logic.
**Enforced in:** DB column types; money utilities.
**Test:** Settlement sums reconcile exactly (buyer_total == farmer_credit + transporter_credit + explicit_fee).

---

## Positioning guardrails (product integrity)

### R-023 · Do not replace public rails; layer above them
AI MANDI integrates with / references AGMARKNET, DoCA PMS, e-NAM, ONDC, BHASHINI; it does not attempt to replace them.
**Enforced in:** product/architecture decisions.
**Test:** No feature duplicates a public rail's core function as a "replacement"; integrations treat them as sources.

### R-024 · Do not eliminate intermediaries — coordinate them
Aggregation, grading, and logistics are real, paid services rendered visible and efficient; the product does not pretend these steps or their costs don't exist.
**Enforced in:** value-chain transparency UI; pricing model.
**Test:** The value-chain breakdown accounts for every rupee between farmer price and consumer landed price.
