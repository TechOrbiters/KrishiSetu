# KISANSETU / AI MANDI — BUYER FEATURE PARITY MATRIX
**Document Reference**: `docs/BUYER-FEATURE-PARITY.md`  
**Classification Rules**: Every source feature must be labeled as `IMPLEMENTED`, `INTENTIONALLY EXCLUDED WITH REASON`, or `PLANNED WITH EXPLICIT PHASE`.  
**Architecture Source of Truth**: Canonical KrishiSetu Target Architecture  

---

## Feature Parity Table

| Source Feature | Target Route | Target Component | API Endpoint | Database Entity | Authorization | Status | Test Status |
|---|---|---|---|---|---|---|---|
| **Buyer Command Dashboard** | `/buyer` | `BuyerPortal.tsx`, `BuyerHomeView.tsx` | `GET /api/listings`, `GET /api/market-prices` | `produce_listings`, `market_prices` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Marketplace Crop Discovery** | `/buyer` (Tab: BROWSE) | `BuyerHomeView.tsx` | `GET /api/listings` | `produce_listings` | Public / Buyer | **IMPLEMENTED** | PASSED |
| **Produce Filters & Category Pills** | `/buyer` | `BuyerHomeView.tsx` | Client & `GET /api/listings` | `produce_listings` | None / Public | **IMPLEMENTED** | PASSED |
| **Produce Sorting (Price, Distance)** | `/buyer` | `BuyerHomeView.tsx` | Client & `GET /api/listings?sort=...` | `produce_listings` | None / Public | **IMPLEMENTED** | PASSED |
| **Produce Card & Safe Imagery** | `/buyer` | `ProduceCard.tsx` (inlined & modular) | `GET /api/listings` | `produce_listings` | None / Public | **IMPLEMENTED** | PASSED |
| **Produce Detail View Modal** | `/buyer` | `BuyerPortal.tsx` (Produce Modal) | `GET /api/listings/:id` | `produce_listings`, `users` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Voice Search (Speech-to-Text)** | `/buyer` (Header) | `BuyerPortal.tsx` | Web Speech API / `/api/sarvam` | None (Client/Streaming) | Buyer UI | **IMPLEMENTED** | PASSED |
| **Multi-Item Shopping Cart** | `/buyer` (Right Rail) | `BuyerPortal.tsx` (Cart Rail) | `GET /api/buyer/cart`, `POST /api/buyer/cart`, `DELETE /api/buyer/cart/:id` | `buyer_cart_items`, `localStorage` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Cart Quantity Stepper** | `/buyer` (Right Rail) | `BuyerPortal.tsx` | `PATCH /api/buyer/cart/:id` | `buyer_cart_items` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Cart Stock Validation** | `/buyer` (Checkout) | `BuyerDeliveryVikalpView.tsx` | `POST /api/orders` | `produce_listings` (available_quantity) | Server Validation | **IMPLEMENTED** | PASSED |
| **Delivery Vikalp (Delivery / Pickup)** | `/buyer` (Tab: DELIVERY_VIKALP) | `BuyerDeliveryVikalpView.tsx` | `GET /api/transport/transporters` | `transporter_profiles` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Transporter Selection & Comparison** | `/buyer` | `BuyerDeliveryVikalpView.tsx` | `GET /api/transport/options` | `transporter_profiles`, `vehicles` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **FreshRoute Shelf-Life Feasibility** | `/buyer` | `BuyerDeliveryVikalpView.tsx` | Server validation in `/api/orders` | `produce_listings.shelf_life_days` | Server Validation | **IMPLEMENTED** | PASSED |
| **Price Breakdown & Money Separation** | `/buyer` (Right Rail & Modal) | `BuyerDeliveryVikalpView.tsx` | `POST /api/orders/calculate-pricing` | `orders` (unit_price, delivery_fee) | Domain Rule R-001 | **IMPLEMENTED** | PASSED |
| **Atomic Order Creation & Reservation** | `/buyer` | `BuyerDeliveryVikalpView.tsx` | `POST /api/orders` | `orders`, `produce_listings` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Buyer Order History & Status Tabs** | `/buyer` (Tab: ORDERS) | `BuyerOrdersView.tsx` | `GET /api/orders` | `orders` | Authenticated Buyer (`buyer_id`) | **IMPLEMENTED** | PASSED |
| **Order Detail & 12h Acceptance Window** | `/buyer` | `BuyerOrdersView.tsx` | `GET /api/orders/:id` | `orders` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Buyer Order Cancellation** | `/buyer` | `BuyerOrdersView.tsx` | `POST /api/orders/:id/cancel` | `orders`, `produce_listings` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Live Delivery Tracking & Telemetry** | `/buyer` (Tracking Modal) | `BuyerOrdersView.tsx`, `GoogleMandiMap.tsx` | `/api/shipments/:id`, Firebase RTDB | `shipments`, `transport_requests` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Proof of Delivery (PoD) OTP Modal** | `/buyer` | `BuyerOrdersView.tsx` | Server-generated OTP / RTDB | `shipments` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Farmers & FPOs Directory** | `/buyer` (Tab: FARMERS) | `BuyerFarmersView.tsx` | `GET /api/users?role=FARMER`, `fpo_profiles` | `users`, `fpo_profiles` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **FPO Detail & Inventory Filter** | `/buyer` | `BuyerFarmersView.tsx` | `GET /api/listings?farmerId=...` | `produce_listings` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Suggest FPO Submission** | `/buyer` | `BuyerFarmersView.tsx` | Client form modal / demand capture | `buyer_demands` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Mandi Market Prices (Bazaar Bhav)** | `/buyer` (Tab: PRICES) | `BuyerPricesView.tsx` | `GET /api/market-prices` | `market_prices` (AGMARKNET) | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Marketplace Historical Price Trends** | `/buyer` | `BuyerPricesView.tsx` | `GET /api/market-prices` | `market_prices` (Observed) | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Price Threshold Alerts** | `/buyer` | `BuyerPricesView.tsx` | `GET & POST /api/buyer/price-alerts` | `price_alerts` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Payment Ledger & Transaction View** | `/buyer` (Tab: PAYMENTS) | `BuyerPortal.tsx` (Payments View) | `GET /api/payments/ledger` | `payments`, `orders` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Invoice / Tax Receipt Generation** | `/buyer` | `BuyerOrdersView.tsx` (Invoice Modal) | Client dynamic generation from Order | `orders`, `users` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Saved Listings / Bookmarks** | `/buyer` (Tab: SAVED) | `BuyerPortal.tsx` (Saved View) | `GET, POST, DELETE /api/buyer/saved` | `saved_listings` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Notification Center Dropdown** | `/buyer` (Header) | `BuyerPortal.tsx` (Notification Modal) | `GET /api/notifications`, `PATCH /api/notifications/:id/read` | `notifications` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Buyer Profile & Identity Settings** | `/buyer` (Tab: SETTINGS) | `BuyerPortal.tsx` (Settings View) | `GET & PATCH /api/buyer/profile` | `users`, `buyer_profiles` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Saved Addresses Management** | `/buyer` (Settings & Checkout) | `BuyerPortal.tsx`, `BuyerDeliveryVikalpView.tsx` | `GET, POST, PATCH, DELETE /api/buyer/addresses` | `buyer_addresses` | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **24x7 Help Center & Helpline** | `/buyer` (Tab: HELP) | `BuyerPortal.tsx` (Help View) | Direct contact & FAQ accordion | Static / Config | Public / Buyer | **IMPLEMENTED** | PASSED |
| **Multilingual Localization (HI/EN)** | Global | `LanguageContext.tsx` | Client context + i18n tokens | Static Dictionary | All Roles | **IMPLEMENTED** | PASSED |
| **Krishi AI Market Assistant Entry** | Global (`/buyer`) | `KrishiAIAssistantModal.tsx` | `POST /api/ai/assistant` | Realtime AI Router | Authenticated Buyer | **IMPLEMENTED** | PASSED |
| **Arbitrary Status Overrides by Buyer** | N/A | N/A | Server-guarded state transitions | N/A | Restricted | **INTENTIONALLY EXCLUDED WITH REASON** (Violates security and role separation) | N/A |
| **Biometric FaceID Sensor Faking** | `/buyer` (Settings) | N/A | Browser WebAuthn if available | N/A | Device-dependent | **INTENTIONALLY EXCLUDED WITH REASON** (No fake security guarantees in production) | N/A |
| **Hardcoded Rohit Verma Initial State** | N/A | N/A | N/A | N/A | N/A | **INTENTIONALLY EXCLUDED WITH REASON** (Replaced by authenticated user state & demo toggle) | PASSED |

---

## Parity Summary
- **Total Features Assessed**: 38
- **Implemented Features**: 35
- **Intentionally Excluded with Reason**: 3 (Client status tampering, simulated biometrics, hardcoded mock profiles)
- **Planned with Explicit Phase**: 0 (Full production scope delivered in current phase)
- **Feature Parity Ratio**: 100% of legitimate business, UX, and domain features migrated.
