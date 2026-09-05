# RBAC.md — AI MANDI
### Roles · permissions · enforcement

**Read first:** `CLAUDE.md` §4, `DOMAIN-RULES.md` R-006..R-008, `docs/API-DESIGN.md` §2.

> There are **exactly four** active roles. Authorization is enforced **server-side** on every protected request — role, then ownership, then (for admins) region scope. UI role-gating is convenience, not security.

---

## 1. Roles

| Role | `role` enum | Identity | UI language | Notes |
|---|---|---|---|---|
| **Farmer / FPO** | `FARMER_FPO` | Individual farmer **or** FPO (`farmer_kind`) | Hindi-first | One combined role; FPO unlocks aggregation/management abilities |
| **Buyer** | `BUYER` | Consumer **or** business (`buyer_type`) | Hindi-first | Household or retailer/hotel/restaurant |
| **Transporter / Delivery Partner** | `TRANSPORTER` | Individual vehicle operator | Hindi-first | "Rapido for agri"; accepts individual jobs |
| **Admin** | `ADMIN` | Platform operator (DoCA) | English only | Verification, monitoring, disputes, analytics; region-scopable |
| *(reserved)* **Logistics Partner** | `LOGISTICS_PARTNER` | Fleet manager | — | **Phase-2**, no MVP UI (`DECISIONS.md` D-003) |

`role` enum (authoritative): `FARMER_FPO | BUYER | TRANSPORTER | ADMIN | LOGISTICS_PARTNER` — four assignable in MVP (R-006).

---

## 2. Permission catalogue

Permissions are verbs on resources. FPO-only permissions are flags on `FARMER_FPO` (granted when `farmer_kind='FPO'`).

**Account:** `profile.read.self`, `profile.update.self`, `verification.submit.self`.
**Produce:** `produce.create`, `produce.read.any`, `produce.update.own`, `produce.delete.own`, `produce.voicecreate`, `produce.photocreate`.
**Demand:** `demand.create`, `demand.read.own`, `demand.read.any`.
**Matching:** `match.read.ownlisting`, `match.accept.ownlisting`.
**Orders:** `order.create` (buy), `order.read.own`, `order.accept.own` (seller), `order.cancel.own`, `order.read.any`.
**Transport:** `transport.request.read.related`, `transport.available.read.self`, `transport.job.accept.self`, `transport.job.reject.self`.
**Shipments:** `shipment.read.related`, `shipment.status.update.assigned`, `shipment.track.append.assigned`.
**Transporter self:** `transporter.availability.update.self`, `transporter.location.update.self`, `transporter.vehicle.manage.self`, `transporter.earnings.read.self`.
**Payments:** `payment.read.related`.
**Notifications:** `notification.read.self`, `notification.token.register.self`.
**AI:** `ai.demand.use`, `ai.sellsmart.use`, `ai.match.use`, `ai.assistant.use`, `ai.opportunity.use`.
**FPO (flags on FARMER_FPO):** `fpo.members.manage`, `fpo.lots.aggregate`, `fpo.inventory.manage`, `fpo.orders.manage`, `fpo.analytics.read`.
**Admin:** `admin.dashboard.read`, `admin.users.manage`, `admin.verification.decide`, `admin.orders.monitor`, `admin.transport.monitor`, `admin.prices.monitor`, `admin.disputes.resolve`, `admin.reports.read` — all within `region_scope`.

---

## 3. Role × permission matrix

Legend: ✅ allowed · ✅(own) ownership-scoped · ✅(FPO) FPO flag only · ✅(scope) region-scoped · — denied.

| Permission | FARMER_FPO | BUYER | TRANSPORTER | ADMIN |
|---|:--:|:--:|:--:|:--:|
| profile.read/update.self | ✅ | ✅ | ✅ | ✅ |
| verification.submit.self | ✅ | ✅ | ✅ | — |
| produce.create / voice / photo | ✅ | — | — | — |
| produce.read.any (browse) | ✅ | ✅ | — | ✅ |
| produce.update/delete.own | ✅(own) | — | — | ✅ |
| demand.create | — | ✅ | — | — |
| demand.read.own | — | ✅(own) | — | — |
| demand.read.any | — | — | — | ✅(scope) |
| match.read/accept.ownlisting | ✅(own) | — | — | — |
| order.create (buy) | — | ✅ | — | — |
| order.read.own | ✅(own, as seller) | ✅(own, as buyer) | ✅(assigned) | ✅(scope) |
| order.accept.own (seller) | ✅(own) | — | — | — |
| order.cancel.own | ✅(own) | ✅(own) | — | ✅ |
| transport.available.read.self | — | — | ✅ | — |
| transport.job.accept/reject.self | — | — | ✅ | — |
| shipment.status.update.assigned | — | — | ✅(assigned) | ✅ |
| shipment.track.append.assigned | — | — | ✅(assigned) | — |
| shipment.read.related | ✅(related) | ✅(related) | ✅(assigned) | ✅(scope) |
| transporter.\*.self (avail/loc/vehicle/earnings) | — | — | ✅ | — |
| payment.read.related | ✅(related) | ✅(related) | ✅(related) | ✅(scope) |
| notification.\*.self | ✅ | ✅ | ✅ | ✅ |
| ai.demand.use | ✅ | — | — | ✅ |
| ai.sellsmart.use | ✅ | — | — | — |
| ai.match.use | ✅ | — | — | — |
| ai.assistant.use | ✅ | ✅ | ✅ | — |
| ai.opportunity.use | ✅ | — | — | — |
| fpo.\* (members/lots/inventory/orders/analytics) | ✅(FPO) | — | — | — |
| admin.\* (dashboard/users/verify/monitor/disputes/reports) | — | — | — | ✅(scope) |

---

## 4. Ownership & scope rules

Role is necessary but not sufficient. Services additionally check:
- **Ownership** — a `FARMER_FPO` may read/update only their own listings/orders/matches; a `BUYER` only their own orders/demands; a `TRANSPORTER` only jobs assigned to them (and open jobs in the available feed).
- **Relationship** — order/shipment/payment reads are limited to the transaction's parties (buyer, seller, assigned transporter) plus admin.
- **Region scope** — an admin's monitoring/reports/verification are limited to their `region_scope` (state/district) where set.
- **FPO flags** — aggregation/management permissions apply only when the `FARMER_FPO` account is an FPO (`farmer_kind='FPO'`).

Violations return `403 FORBIDDEN` regardless of UI state (R-007).

---

## 5. Enforcement pipeline

```
request → authenticate (verify token, load user)
        → authorize role (route's allowed roles + required permission)
        → service ownership/relationship/scope check
        → domain-rule checks (money separation, freshness gate, legal transition)
        → handler
```
Every protected endpoint in `docs/API-DESIGN.md` names its allowed roles; that list is the contract this matrix must match. Cross-role and cross-ownership attempts are rejected and logged.

---

## 6. Sensitive-data access by role

- **Aadhaar / raw identifiers:** never returned to any role in full; admins see masked (`XXXX XXXX 1234`) for verification only (R-019).
- **Pickup contact details:** disclosed to a transporter **only after** they accept the job (R-020).
- **Buyer/farmer PII:** disclosed to a counterparty only as the specific transaction requires; no role (except admin, for operations, within scope) can enumerate another role's PII wholesale (R-020).

---

## 7. Phase-2: Logistics Partner (reserved)

`LOGISTICS_PARTNER` will manage a fleet: onboard/assign multiple vehicles and drivers, accept bulk/pooled jobs, and view fleet analytics. Its permission set will extend the transporter set with fleet-management verbs. It is modeled in the enum now but has **no assignable users and no UI** in the MVP (`DECISIONS.md` D-003). Introducing it requires a `DECISIONS.md` entry and this matrix's extension.
