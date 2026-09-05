# WEB-FLOW.md — AI MANDI
### Site Flow · Navigation · User Journeys · State Machines

**Read first:** `CLAUDE.md`, `docs/PRD.md`, `docs/UI-DESIGN.md`.

> "WEB FLOW" here means the **site and navigation flow** — the sitemap, what each role can navigate to, how screens connect, and the order/transport state machine. It is derived from the product owner's handwritten site map (mockup scr-006) and order-flow note (scr-020), and from the role screens. It is **not** about the Webflow website builder (`DECISIONS.md` D-010).

---

## 1. Top-level site map

```
Landing (public)
├── About / How it works
├── Login  ── (role detected from account)
└── Register ──► choose role: Farmer/FPO · Buyer · Transporter · Admin(by invite)
        │
        ▼  (authenticated, routed by role)
┌───────────────┬───────────────┬────────────────────┬───────────────┐
│  FARMER/FPO   │    BUYER       │   TRANSPORTER      │    ADMIN       │
│  "Kisan Setu" │ "Kisan Bazaar" │  "Kisan Bazaar"    │ "Kisan Setu    │
│  (Hindi-first)│ (Hindi-first)  │  (Hindi-first)     │  Admin Panel"  │
│               │                │                    │  (English)     │
└───────────────┴───────────────┴────────────────────┴───────────────┘

[Payments] and [Help Center] exist as entry points but are marked "Future"
in the owner's site map (scr-006) — stubbed in the MVP (DECISIONS.md D-013).
```

The landing page branches to the four roles exactly as in the owner's handwritten flow (scr-006: "Landing Page → Farmer / Buyer / Transporter / Admin"). After login, the account's role decides which app shell renders; there is no role switching within a session.

---

## 2. Route map (per role)

Routes are grouped by role and guarded server-side by the session role (`docs/TRD.md` §8). Paths are illustrative; the navigation *labels* match the mockups.

### 2.1 Farmer / FPO — `/farmer/*` (brand: Kisan Setu · "आपका अपना बाजार")
Sidebar navigation (bilingual; Hindi primary):

| Label (Hindi / English) | Route | Source screen |
|---|---|---|
| डैशबोर्ड / Dashboard | `/farmer` | scr-019 |
| मेरी उपज · मेरी लिस्टिंग / My Listings | `/farmer/listings` | scr-016 |
| — नया उत्पाद लिस्ट करें / Add Listing (manual · voice · photo) | `/farmer/listings/new` | flow off scr-016/scr-019 |
| मेरे ऑर्डर / Orders | `/farmer/orders` | scr-010 |
| डिलीवरी स्थिति / Delivery Status | `/farmer/delivery` | scr-013 |
| भुगतान / Payments *(Future)* | `/farmer/payments` | scr-006 (Future) |
| बाज़ार भाव / Market Prices | `/farmer/prices` | scr-002, scr-014 |
| सहायता केंद्र / Help Center *(Future)* | `/farmer/help` | scr-006 (Future) |
| मेरा प्रोफाइल / My Profile | `/farmer/profile` | scr-001 |
| Settings · Language · Logout | — | scr-019 |

Mobile: bottom tab bar — 🏠 डैशबोर्ड · 🌿 लिस्टिंग · 🎤 बोलकर लिस्ट करें (center FAB) · 🛒 ऑर्डर · 👤 प्रोफाइल (scr-010, scr-019).

### 2.2 Buyer — `/buyer/*` (brand: Kisan Bazaar / किसान-क्रेता पोर्टल)
Sidebar navigation:

| Label (Hindi / English) | Route | Source screen |
|---|---|---|
| होम / Home | `/buyer` | scr-009, scr-008 |
| ब्राउज़ प्रोडक्ट्स · उत्पाद श्रेणियाँ / Browse | `/buyer/browse` | scr-008, scr-009 |
| मेरे ऑर्डर / Orders | `/buyer/orders` | scr-012 |
| Saved List · सेव्ड लिस्ट | `/buyer/saved` | scr-009 |
| फार्मर / FPOs / Farmers & FPOs | `/buyer/farmers` | scr-011 |
| बाज़ार भाव / Baazar Bhav | `/buyer/prices` | scr-003 |
| डिलीवरी विकल्प / Delivery Vikalp (checkout) | `/buyer/checkout/delivery` | scr-007 |
| मेरा प्रभाव / My Impact | `/buyer/impact` | scr-012 |
| Notifications · Settings · Help & Support | — | scr-003 |

Buyer Dashboard / order-match view (scr-015) is reached from an order (`/buyer/orders/:id`). Mobile: bottom bar with a blue voice FAB ("आवाज़ से सर्च/खरीदें", scr-015).

### 2.3 Transporter / Delivery Partner — `/transporter/*` (brand: Kisan Bazaar)
Sidebar navigation (scr-004):

| Label (Hindi / English) | Route |
|---|---|
| डैशबोर्ड / Dashboard | `/transporter` |
| उपलब्ध डिलीवरी / Available Deliveries (SmartMatch) | `/transporter/available` |
| मेरी ट्रिप्स / My Trips | `/transporter/trips` |
| वर्तमान डिलीवरी / Current Delivery | `/transporter/current` |
| मेरे वाहन / My Vehicles | `/transporter/vehicles` |
| आय / कमाई / Earnings | `/transporter/earnings` |
| ट्रिप हिस्ट्री / Trip History | `/transporter/history` |
| रेटिंग और समीक्षा / Ratings & Reviews | `/transporter/ratings` |
| नोटिफिकेशन · सहायता · सेटिंग्स | — |

Online/Offline toggle in the topbar ("● Online").

### 2.4 Admin — `/admin/*` (brand: Kisan Setu Admin Panel · English only)
Sidebar navigation (scr-005):

| Label | Route |
|---|---|
| Dashboard | `/admin` |
| Farmers | `/admin/farmers` |
| FPOs | `/admin/fpos` |
| Buyers | `/admin/buyers` |
| Orders | `/admin/orders` |
| Transport & Delivery | `/admin/transport` |
| Market Prices | `/admin/prices` |
| Reports & Analytics | `/admin/reports` |
| Support & Disputes | `/admin/disputes` |
| System Settings · Logout | — |

---

## 3. Screen-to-screen journeys

### 3.1 Farmer: list produce and sell
```
/farmer (Dashboard, scr-019)
  └─ Quick Action "🎤 बोलकर लिस्ट करें"  ─► /farmer/listings/new (voice)
        speak → confirm extracted {crop, qty, quality, location} → set freshness window → publish
        └─► /farmer/listings (scr-016) shows the new active listing
              └─ open listing ─► AI panel: DemandSense (where needed) · SellSmart (revenue) · SmartMatch (ranked buyers)
                    └─ accept a matched offer ─► order created (buyer notified)
/farmer/orders (scr-010)
  └─ "नया ऑर्डर" card ─► [✓ ऑर्डर स्वीकार करें]  (within 12h accept window)
        ├─ buyer chose Self-Service ─► done (buyer picks up; delivery fee ₹0)
        └─ buyer chose Delivery ─► platform auto-creates transport request
              └─► /farmer/delivery (scr-013) live tracking through Delivered
```

### 3.2 Buyer: browse, checkout, track
```
/buyer (Home, scr-009/008)
  └─ search (typed or 🎤) or category tile ─► product cards (price vs market, savings, "🌾 सीधे किसान से")
        └─ [कार्ट में जोड़ें] (qty stepper) ─► right-rail cart (subtotal · delivery(SmartMatch) · total · savings)
              └─ choose delivery method: ◉ डिलीवरी पार्टनर  |  ○ Self Pick-up (free)
                    └─ [चेकआउट] ─► /buyer/checkout/delivery (Delivery Vikalp, scr-007)
                          modes: Smart Delivery (recommended) · Self Pick-up (FREE)
                          + full transporter table (ETA · distance · rating · price, strikethrough original)
                          └─ pick option ─► sticky bar "इस विकल्प से आगे बढ़ें →"
                                └─► order placed (product price + delivery charge shown SEPARATELY + total)
/buyer/orders (scr-012)
  └─ active order card ─► [ट्रैक करें] ─► /buyer/orders/:id (tracking + stepper + live map)
        (order-match / confirm-and-pay detail = scr-015)
```

### 3.3 Transporter: accept and complete a job
```
/transporter (Dashboard, scr-004)
  └─ "🌾 उपलब्ध डिलीवरी (SmartMatch)" job cards (★ बेस्ट मैच, load, pickup→drop, km, ETA, ₹ earning, pickup window)
        └─ [एक्सेप्ट करें]  (only if FreshRoute says ETA ≤ freshness window)
              └─► /transporter/current  stepper: ✅ Accepted → ✅ Picked up → ● In Transit → ○ Delivered
                    └─ update status at each step · live location streamed to buyer & farmer
/transporter/earnings — running total (₹42,850 this month), per-trip average, on-time %
```

### 3.4 Admin: verify and monitor
```
/admin (Dashboard, scr-005) — KPIs · Order Status donut · Delivery Overview · Top Produce · Price-Spread chart · Alerts
  ├─ /admin/farmers ─► pending verification ─► approve/reject (masked Aadhaar)
  ├─ /admin/orders ─► drill into any order's state & parties
  ├─ /admin/transport ─► Live Tracking Map · delayed/exception deliveries
  ├─ /admin/prices ─► farmer-vs-market spread (DoCA relevance)
  └─ /admin/disputes ─► resolve delivery/quality/payment disputes
```

---

## 4. Order & fulfilment state machine (authoritative — from scr-020)

The product owner's handwritten "Smart Transportation" note (scr-020) is the canonical flow:

> User orders product (choosing Self-service or Delivery) → Farmer gets notification → Farmer accepts → then two options: **Self-Service** ("no other steps") or **Delivery** ("getting options of choosing nearby delivery partners").

Encoded as a state machine:

```
        ┌────────┐  buyer places order
        │ PLACED │◄──────────────────────
        └───┬────┘
            │ farmer/FPO accepts (within accept window)         ┌───────────┐
            ▼                                        any state → │ CANCELLED │
        ┌──────────┐                                 (per rules) └───────────┘
        │ ACCEPTED │
        └────┬─────┘
     ┌───────┴────────────────────────┐
     │ buyer chose SELF-SERVICE        │ buyer chose DELIVERY
     ▼                                 ▼
┌──────────────┐              (platform auto-creates Transport Request;
│ SELF_PICKUP  │               SmartTransport ranks; FreshRoute filters)
│ (fee ₹0,     │                        │ transporter accepts (ETA ≤ freshness window)
│  no shipment)│                        ▼
└──────┬───────┘                   ┌────────┐
       │ buyer collects            │ PACKED │
       ▼                           └───┬────┘
   ┌───────────┐                       ▼
   │ DELIVERED │                 ┌────────────┐
   └───────────┘                 │ DISPATCHED │
                                 └─────┬──────┘
                                       ▼
                                 ┌────────────┐
                                 │ IN_TRANSIT │  (live tracking)
                                 └─────┬──────┘
                                       ▼
                                 ┌───────────┐
                                 │ DELIVERED │  settle: farmer←product price, transporter←delivery fee
                                 └───────────┘
```

**Rules on this machine** (see `DOMAIN-RULES.md`): no fulfilment before farmer acceptance (R-012); self-service creates no shipment and zero delivery fee (R-013); a transporter can only accept freshness-viable jobs (R-009); transitions are forward-only except cancellation (R-011).

### 4.1 Shipment stepper (UI mapping)
The buyer/farmer tracking steppers map to the delivery branch:

`Order confirmed → Scheduled for pickup → Picked up → Out for delivery → Delivered`
(Hindi: `ऑर्डर कंफर्म हुआ → पिकअप के लिए निर्धारित → पिकअप हो गया → डिलीवरी के लिए रवाना → डिलीवर किया गया` — scr-013).

Transporter-side stepper (scr-004): `ऑर्डर एक्सेप्ट किया → पिकअप किया → रास्ते में → डिलीवरी`.

---

## 5. Checkout / delivery-choice flow (buyer)

```
Cart (right rail) ─► choose delivery method:
   ◉ डिलीवरी पार्टनर द्वारा (By delivery partner)  ─► Delivery Vikalp (scr-007)
   ○ किसान द्वारा स्व-सेवा (Self-Service)          ─► delivery fee ₹0, pickup at farm/FPO

Delivery Vikalp (scr-007):
   mode cards:  Smart Delivery (recommended, e.g. ₹250, "आज डिलीवरी")   |   Self Pick-up (FREE)
   full options table (SmartTransport-ranked): transporter · ETA · distance · rating · price(strikethrough original)
   → order summary always shows:  Subtotal (product)  +  Delivery Charges  =  Total   (+ savings vs market)
   → sticky action bar: selected option · ETA · total delivery charge · CTA "इस विकल्प से आगे बढ़ें →"
```

This flow is where `DOMAIN-RULES.md` R-001/R-004 are most visible: product subtotal and delivery charge are always separate lines with a total.

---

## 6. Voice / multilingual entry points

Voice is a navigation entry point, not just an input widget:
- Farmer dashboard voice FAB and "बोलकर लिस्ट करें" → jump straight into the listing flow with fields pre-filled from speech.
- Buyer search mic → runs a multilingual search and lands on results.
- Krishi AI Assistant (farmer/buyer/transporter) → answers or routes the user to the relevant screen/action.
- Every farmer/buyer/transporter screen exposes the language switch; admin is English-only.

---

## 7. Notification-driven navigation

Notifications deep-link into the flow: a farmer's "new order" notification opens `/farmer/orders` on that card; a transporter's "new job N km away" opens the job card in `/transporter/available`; a buyer's "out for delivery" opens the tracking view; an admin's "6 deliveries delayed" opens the delayed list in `/admin/transport`. See `docs/TRD.md` §16.

---

## 8. Guarding & redirects

Unauthenticated access to any role route → Landing/Login. A session whose role doesn't match the route group → 403/redirect to that role's home (`DOMAIN-RULES.md` R-007). "Future" routes (Payments, Help Center) render a clean "coming soon" stub rather than a broken page (`DECISIONS.md` D-013). Deep links to a specific order/listing/job resolve to the owning role's detail screen and re-check ownership.
