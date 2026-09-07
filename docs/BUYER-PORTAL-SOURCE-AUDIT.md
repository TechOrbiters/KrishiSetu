# KISANSETU / AI MANDI — BUYER PORTAL SOURCE AUDIT
**Document Reference**: `docs/BUYER-PORTAL-SOURCE-AUDIT.md`  
**Classification Standard**: CORE, SUPPORTING, OPTIONAL, DEMO-ONLY, MOCKED, REAL, OBSOLETE  
**Auditor**: Principal Full-Stack & Systems Architect  

---

## 1. Executive Summary

This audit catalogs every feature, component, user interaction, data dependency, and business rule within the reference KISANSETU / AI MANDI Buyer Portal. The reference codebase was evaluated to extract functional requirements, identify legacy/mocked elements to replace, and establish the target architecture for the canonical KrishiSetu application.

---

## 2. Comprehensive Source Feature Audit & Classification

| # | Feature / Subsystem | Source Location | Classification | Description & Functional Intent | Target Migration Strategy |
|---|---|---|---|---|---|
| **1** | **Buyer Command Center / Home** | `src/components/buyer/BuyerPortal.tsx` (Home tab), `BuyerHomeView.tsx` | **CORE** | Hero banner, seasonal trust badges, category quick-filters, nearby produce recommendations, market price snapshot, active farmer filter banner. | Native target component `BuyerHomeView.tsx` backed by live Supabase `produce_listings` and `market_prices`. |
| **2** | **Multi-Item Shopping Cart** | `BuyerPortal.tsx` (cart state), right rail | **CORE** | Add to cart, quantity stepper increment/decrement, remove item, subtotal calculation, delivery fee calculation, savings calculation, checkout CTA. | Persistent cart backed by Supabase `buyer_cart_items` + `localStorage` with server-side stock revalidation. |
| **3** | **Marketplace Crop Discovery & Search** | `BuyerPortal.tsx`, `ProduceCard.tsx`, `CategoryFilter.tsx` | **CORE** | Search crop by English/Hindi names, category filtering (Veg, Fruit, Grains, Pulses), price sort, distance sort, quality filters. | Dynamic marketplace query against `/api/listings` with multi-attribute filtering and zero fake fallback data. |
| **4** | **Voice-Activated Search (STT)** | `BuyerPortal.tsx` (topbar mic button) | **SUPPORTING** | Speech-to-text voice search in Hindi/English using Web Speech API with fallback to AI assistant. | Integrate browser `webkitSpeechRecognition` / Sarvam AI audio endpoint into search bar. |
| **5** | **Produce Detail View & Modal** | `BuyerPortal.tsx`, `ProduceCard.tsx` | **CORE** | Full crop specifications: grade, harvest date, location, shelf life, farmer details, asking vs mandi benchmark price, minimum order enforcement. | Dedicated Produce Detail modal/view displaying live listing attributes, seller verification, and real-time stock. |
| **6** | **Farmer & FPO Directory** | `BuyerPortal.tsx`, `BuyerFarmersView.tsx` | **CORE** | Verified directory of farmers and FPOs, member count, crop varieties, on-time delivery rate, district, direct telephone dialer, "View Produce" shortcut. | Query Supabase `fpo_profiles`, `farmer_profiles`, and `users` with verified status badges and direct filtering. |
| **7** | **Suggest FPO Submission Form** | `BuyerFarmersView.tsx` | **SUPPORTING** | Form allowing buyers to recommend local FPOs (name, district, contact, commodities) for onboarding. | Dedicated interactive modal submitting directly to backend demand/lead capture. |
| **8** | **Delivery Vikalp (Method Selection)** | `BuyerDeliveryVikalpView.tsx`, right rail | **CORE** | Choice between "Smart Delivery Partner" (calculated fee) and "Self Pick-up" (₹0 fee). | Domain Rule R-001/R-004 compliant checkout flow with strict separation of produce subtotal and transport fee. |
| **9** | **Carrier Comparison & Selection** | `BuyerDeliveryVikalpView.tsx`, `BuyerPortal.tsx` | **CORE** | Transporter cards showing vehicle type, capacity, rating, estimated delivery time (ETA), trip charge, and verification status. | Dynamic query to `/api/transport/transporters` or `/api/transport/options` filtering active duty vehicles. |
| **10** | **FreshRoute Shelf-Life Feasibility** | `BuyerDeliveryVikalpView.tsx`, `src/lib/domain-rules.ts` | **CORE** | Enforces that transporter ETA <= produce shelf-life buffer. Flags SAFE, AT_RISK, or INELIGIBLE. | Server-side validation rejecting checkout if chosen transporter exceeds crop perishability deadline. |
| **11** | **Order Creation & Inventory Reservation** | `BuyerDeliveryVikalpView.tsx`, `src/lib/globalOrderManager.ts` | **CORE** | Checkout confirmation creating order record, deducting reserved stock from listing, broadcasting creation event. | Transactional atomic database mutation via `/api/orders` preventing overselling and race conditions. |
| **12** | **Buyer Order Lifecycle & History** | `BuyerOrdersView.tsx`, `BuyerPortal.tsx` | **CORE** | Categorized list of orders (All, Placed, Packed, In Transit, Delivered, Cancelled) with order number, items, prices, and status. | Authoritative query to `/api/orders` filtered by authenticated `buyer_id`. |
| **13** | **Live Logistics & GPS Telemetry** | `BuyerOrdersView.tsx`, `OrderStepper.tsx`, `GoogleMandiMap.tsx` | **CORE** | Step-by-step delivery progress, transporter contact modal, vehicle registration, driver phone link, live map visualization. | Leaflet / OpenStreetMap / Firebase RTDB live telemetry with Proof of Delivery (PoD) OTP display. |
| **14** | **Bazaar Bhav (Mandi Benchmark Prices)** | `BuyerPricesView.tsx`, `src/components/mandi/*` | **CORE** | Live mandi prices per commodity across Uttar Pradesh districts (min, max, modal), 24h trend delta, platform direct price comparison. | Real Government/AGMARKNET data from `/api/market-prices` with district and commodity dropdown filters. |
| **15** | **Historical Price Trends Chart** | `BuyerPricesView.tsx` (`trendDataMap`) | **MOCKED** (Source) -> **REAL** (Target) | 7-day, 15-day, 1-month, 3-month commodity price trend visualization. | Render SVG line charts using real historical price observations; display clean fallback when historical data is sparse. |
| **16** | **Price Threshold Alerts** | `BuyerPricesView.tsx` | **SUPPORTING** | Modal to configure target commodity price alerts with notification triggers. | Supabase `price_alerts` entity with persistent buyer preferences and alert notifications. |
| **17** | **Buyer Profile & Business Info** | `BuyerPortal.tsx` (Settings), `src/types/index.ts` | **CORE** | Buyer name, business/mandi name, phone verification, delivery addresses, preferred delivery time slots. | `/api/buyer/profile` backed by Supabase `users` and `buyer_profiles`. |
| **18** | **Saved Addresses Management** | `BuyerPortal.tsx` (Settings) | **SUPPORTING** | List, add, edit, delete, and set default delivery address (street, pincode, district, recipient phone). | Backend entity `buyer_addresses` with complete CRUD and checkout integration. |
| **19** | **Saved Products / Bookmarks** | `BuyerPortal.tsx` (Saved tab), `ProduceCard.tsx` | **SUPPORTING** | Bookmark/favorite produce listings for quick access, unsave, add saved item directly to cart. | Backend table `saved_listings` persisted across browser sessions. |
| **20** | **Notification Center** | `BuyerPortal.tsx` (Notifications dropdown) | **CORE** | Notifications for order updates, price changes, system alerts; unread counters, mark as read, mark all read. | Authoritative query to `/api/notifications` with real-time SSE / Supabase listener. |
| **21** | **Payment Ledger & Wallet** | `BuyerPortal.tsx` (Payments tab) | **CORE** | Overview of transaction history, escrow payments, payment methods (UPI, Bank Transfer, Escrow), downloadable receipts. | Real ledger state from `/api/payments/ledger` associating authoritative orders and escrow status. |
| **22** | **Invoice & Receipt Generation** | `InvoiceModal.tsx`, `CheckoutConfirmation.tsx` | **SUPPORTING** | Printable/downloadable tax invoice with Order ID, Buyer details, Farmer details, line items, delivery fee, GSTIN. | Dynamic client-side invoice modal populated strictly from authoritative order entity. |
| **23** | **Multilingual Localization** | `LanguageContext.tsx`, `LanguageSelector.tsx`, `src/lib/i18n.ts` | **CORE** | Seamless language switching between Hindi and English across all UI labels, filters, tabs, headers, and toasts. | Integrate with KrishiSetu canonical `LanguageContext` ensuring zero hardcoded UI strings. |
| **24** | **Krishi AI Market Assistant** | `KrishiAIAssistantModal.tsx` | **SUPPORTING** | Conversational assistant to help buyers find cheapest produce, check mandi rates, and track orders. | Connect modal to `/api/ai/assistant` with verified prompt context and real catalog tools. |
| **25** | **Hardcoded Demo State (Rohit Verma, etc.)** | `mockData.ts`, `BuyerPortal.tsx` | **OBSOLETE** | Hardcoded initial orders, fixed wallet balances (`₹12,450`), static phone numbers, fake transporters. | Completely eliminate from normal mode (`DEMO_MODE=false`). Support controlled deterministic demo fixtures only when flag is set. |

---

## 3. Critical Findings & Architectural Directives

1. **Monolithic Splitting**:
   - In the reference project, `BuyerPortal.tsx` was ~1,400 lines containing mixed state for navigation, cart, modals, orders, and tabs.
   - Target architecture divides this into distinct, single-responsibility components: `BuyerHomeView`, `BuyerFarmersView`, `BuyerOrdersView`, `BuyerPricesView`, `BuyerDeliveryVikalpView`, `BuyerPaymentsView`, `BuyerSavedView`, `BuyerSettingsView`, `BuyerNotificationCenter`, and `BuyerDetailModal`.

2. **Money & Domain Rule Enforcement**:
   - Farmer revenue must equal `unit_price × quantity` without deducting transporter fees.
   - Delivery fee must be borne separately by the Buyer.
   - Platform fee is initialized to ₹0 for MVP.
   - Transporters must satisfy FreshRoute shelf-life constraints: $\text{ETA} \le \text{freshnessWindowHours} - 4\text{h}$.

3. **Data Integrity & Server-Side Identity**:
   - Client requests must never supply arbitrary `buyer_id` or `role`.
   - Buyer identity is extracted server-side via `authenticateRequest` using verified Firebase/Supabase JWT claims.
   - Cart stock and prices must be validated atomically upon order checkout.
