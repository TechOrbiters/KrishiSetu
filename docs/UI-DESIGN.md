# UI-DESIGN.md — AI MANDI
### Design system + exact screen-by-screen specification

**Read first:** `CLAUDE.md` §12 (UI rules), `docs/WEB-FLOW.md`, `docs/RBAC.md`, `notes/screens-inventory.md` (the raw mockup transcription this doc formalizes).

> **Prime directive — R-023/CLAUDE.md §12:** the UI *must match the provided mockups*. This document is the contract: colors, layout, labels, and values below are transcribed from the 20 supplied screens. Where a screen shows Hindi copy, that copy is reproduced verbatim because the interface is Hindi-first for Farmer/Buyer/Transporter and English-only for Admin. Do not "improve", translate away, or re-theme the mockups.

This spec covers the **18 relevant mockups** — **16 UI screens** across the 4 roles (Farmer 7 · Buyer 7 · Transporter 1 · Admin 1; scr-002 and scr-014 are two variants of the one Market-Prices screen) plus **2 planning notes** (scr-006, scr-020). Two supplied pages (**scr-017, scr-018**) belong to a *different* problem statement (ID 26139, skill-development/employment tracking) and are **excluded** — see §14.

---

## 1. How to use this document

- **§2–§8** define the shared design system (tokens, layout shells, components). Build these once as reusable primitives.
- **§9–§11** specify each screen: its shell, exact regions, and the literal content shown in the mockup. Reproduce them faithfully.
- Every screen names the **role** that sees it, its **route** (`docs/WEB-FLOW.md`), and the **source mockup** id.
- When a value here looks oddly specific (e.g., "₹3,935", "82 km", "★4.8 (128)"), it is the mockup's own sample data — use it as seed/demo data so the built screen visually equals the image.

---

## 2. Design principles

1. **Match the mockups exactly** — same layout, same colors, same Hindi/English copy.
2. **Hindi-first for field users, English for admin.** Farmer/Buyer/Transporter surfaces lead in Hindi (Devanagari) with English in parentheses or as a small grey subtitle; the Admin panel is entirely English.
3. **Voice is a first-class entry point** on farmer/buyer/transporter surfaces — a persistent mic affordance (sidebar CTA on desktop, center FAB in the mobile bottom tab bar).
4. **Trust is visible** — verified ✓ chips on farmers/FPOs, ratings, "सीधे किसान से / Direct from Farmer" framing, and market-comparison "आप ₹X बचा रहे हैं" savings strips.
5. **Money is always itemized** — product subtotal, delivery charge, and total appear as *separate lines* everywhere they are shown (R-001/R-004). No screen ever blends delivery into the product price.
6. **Photographic produce, outline icons.** Crops/products use real photo thumbnails; all UI glyphs are outline (Lucide-style).
7. **Calm, card-based surfaces.** White cards on a light-grey page, generous radius, soft shadows, one clear primary action per card.

---

## 3. Color tokens

| Token | Hex | Use |
|---|---|---|
| `--green-primary` | **#15803D** (range #1A7F4B–#15803D) | primary buttons, active states, brand |
| `--green-deep` | **#14532D** | wordmark, headings on light |
| `--green-sidebar-dark` | **#0F5132 / #14532D** | filled dark-green sidebar (scr-008 buyer portal) |
| `--green-tint` | **#E8F5EE** | light active-nav pill (farmer scr-001/002), chip backgrounds |
| `--success` | **#16A34A** | up-trend, positive delta, "verified", savings |
| `--negative` | **#DC2626** | down-trend, cancel, low-stock, errors |
| `--warning` | **#F59E0B** | pending, "accept within 12h", delayed, low-stock note |
| `--info` | **#2563EB** | tracking/live actions, admin market-price line, info notes |
| `--purple` | **#6366F1** | admin "Exception" tile accent |
| `--surface` | **#FFFFFF** | cards |
| `--bg` | **#F7F8FA** | page background |
| `--border` | **#E5E7EB** | card & table borders, dividers |
| `--text` | **#111827** | primary text |
| `--text-muted` | **#6B7280** | secondary/English subtitles, meta |

**Active-nav rule (matches mockups):** Buyer, Admin, and Transporter use a **solid primary-green pill with white text**; the Farmer app uses a **light-green tint pill (`--green-tint`) with green text**. The scr-008 buyer *portal* variant uses a **filled dark-green sidebar** with a lighter-green active pill.

**Trend/status color mapping:** up ↗ = `--success`; down ↘ = `--negative`; pending/at-risk = `--warning`; in-transit/live = `--info`. Freshness: `SAFE`=green, `AT_RISK`=amber, `EXPIRED`=red.

---

## 4. Typography, spacing, shape

- **Devanagari + Latin** typeface pairing; a font with strong Hindi coverage (e.g., Noto Sans / Noto Sans Devanagari class). Hindi is the primary weight; English subtitles are smaller and `--text-muted`.
- **Scale:** page H1 ~24–28px bold; section titles ~18–20px semibold; card titles ~16px; body ~14px; meta/English-subtitle ~12–13px.
- **Bilingual label pattern:** Hindi primary line **bold**, English secondary line small/grey directly beneath (sidebar nav, quick actions), or English in parentheses inline: `बाजार भाव (Baazar Bhav)`.
- **Spacing:** 8px base grid; card padding 16–20px; section gaps 20–24px.
- **Radius:** cards & inputs **12–16px**; pills/chips fully rounded; buttons ~10–12px.
- **Shadow:** single soft shadow on cards (`0 1px 3px rgba(0,0,0,.06)`), slightly stronger on hover/active job cards.
- **Borders:** 1px `--border`; highlighted "best match" cards get a 1.5–2px `--green-primary` border.

---

## 5. Iconography & imagery

- **Icons:** outline/Lucide throughout (pin 📍, bell 🔔, cart 🛒, mic 🎤, truck 🚚, chart 📊, phone 📞, gear ⚙, trash 🗑, pencil ✏, refresh ⟳, globe 🌐). Emoji in this doc denote the icon's meaning, not literal emoji rendering.
- **Produce/products:** photographic crop thumbnails (tomato, potato, wheat, onion…), never icons.
- **Avatars:** circular; farmer profile avatar has a green camera FAB overlay for photo upload.
- **Trust marks:** green ✓ verified chips on farmer/FPO names; ★ rating with review count in parentheses, e.g. `★4.8 (128)`.
- **Maps:** rounded map card with a green route polyline, pickup pin → truck marker → drop pin.

---

## 6. Localization rules

- **Farmer / Buyer / Transporter:** Hindi-first bilingual. All primary labels Hindi; English as secondary. Numerals may render Latin (₹, kg, km) as in the mockups.
- **Admin:** English only (scr-005). No Hindi in the admin panel.
- **Language switcher:** globe + "हिंदी ▾" in the sidebar footer (farmer) or topbar (buyer/transporter); buyer portal shows "हिन्दी / English ▾".
- **Krishi AI Assistant** speaks the 10 supported languages (`docs/AI-SYSTEM.md` §6); admin does not use it.
- Copy in §9–§11 is transcribed from the mockups and must be preserved verbatim.

---

## 7. Layout shells

Four shell variants (all: fixed left sidebar + topbar + scrollable content).

**A. Farmer shell (2-column).** Sidebar ~220px (brand *Kisan Setu* + "आपका अपना बाजार", or farmer avatar at top on some screens) → nav → footer (globe/language, voice CTA on some, Logout in red). Topbar: optional ← back, page title, **location pill** (गाँव/जिला ▾), **weather pill** (32°C, हल्की धूप). Content: cards. **No right rail.** On mobile/tablet, a **bottom tab bar** appears with a center voice FAB (scr-010, scr-019).

**B. Buyer shell (3-column).** Sidebar (avatar + "Buyer" chip + city, nav, bottom promo/impact card) → main content → **right rail** (cart summary, delivery method, SmartMatch options, current-order tracking). Topbar: search with 🎤 mic, location ▾, language ▾, 🔔 badge, green cart button showing count + ₹total. The scr-008 **portal variant** renders inside browser chrome with a dark-green sidebar.

**C. Transporter shell (3-column).** Sidebar (truck avatar + vehicle reg + vehicle-type chip, nav, AI-साथी promo). Topbar: location ▾, **● Online** toggle chip, language ▾, 🔔, avatar + ★rating. Main: greeting + KPI cards + job/trip sections. **Right rail:** earnings, vehicle capacity, performance, live location, support.

**D. Admin shell (2-column, English).** White sidebar, solid-green active pill; nav in English. Topbar: page title, date ▾, 🔔 badge, "Admin / Super Admin" avatar. Content: KPI cards + charts + tables. No voice, no Hindi.

**Mobile bottom tab bar (farmer):** 5 items with a center green **voice FAB** — 🏠 डैशबोर्ड · 🌿 मेरी उपज/लिस्टिंग · 🎤 बोलकर लिस्ट करें (center FAB) · 🛒 ऑर्डर · 👤 मेरा प्रोफाइल. Buyer/Transporter mobile use a blue mic FAB variant (scr-015).

---

## 8. Shared component library

**Sidebar nav item** — icon + Hindi label (bold) + English sublabel (small grey); active = green pill (solid or tint per §3); optional count badge (e.g., "नोटिफिकेशन (3)").

**Location pill** — 📍 + "गाँव: … / जिला: …, राज्य" with ▾. **Weather pill** — sun icon + "32°C" + "हल्की धूप".

**KPI stat card** — pastel circular icon, big value, label, and (where shown) a colored delta with ↑/↓ and %. Used on every dashboard (farmer earnings, transporter trips, admin totals, listings counts).

**Search bar (buyer/transporter)** — rounded input, placeholder in Hindi ("क्या खोज रहे हैं? …"), inline 🎤 mic, optional green 🔍 button.

**Price table** — columns per screen; produce **photo thumbnail** + bilingual name in the first column; trend cell = small circular badge with green ↗ / red ↘; "अंतिम अपडेट …" meta + ⟳ refresh in the card header; full-width "और फसलें देखें ▾" footer button.

**Produce/product card (buyer)** — photo, distance chip (top-left "12 km दूर"), heart/save (top-right), "🌾 सीधे किसान से" chip, title (bilingual), seller + ✓ + ★rating, available qty, **price + struck market price** (`₹45/kg` ~~`₹52/kg`~~), qty stepper `[− 20kg +]`, green **"कार्ट में जोड़ें"**.

**Listing card (farmer, scr-016)** — produce thumb, name, qty·₹/kg, 📍 खेती स्थान, लिस्ट किया date, **status chip** (सक्रिय/कम स्टॉक/ऑर्डर प्राप्त/समाप्त), कुल व्यू N, उपलब्ध मात्रा + कम से कम ऑर्डर, actions **[✏ संपादित करें] [🗑 हटाएं]** (or [फिर से लिस्ट करें] when sold out).

**Order card (farmer, scr-010)** — status chip, produce thumb, qty·₹/kg, खरीदार + location, delivery-mode note (डिलीवरी चाहिए / स्वयं लेने आएगा), **कुल राशि**, primary action per state ([✓ ऑर्डर स्वीकार करें]/[📍 डिलीवरी ट्रैक करें]/[विवरण देखें]); new orders show amber "⏱️ 12 घंटे के अंदर स्वीकार करें".

**Order card (buyer, scr-012)** — item thumbs with "N आइटम" badge, order ID + date, 📍 FPO, ₹ total, status chip, [ट्रैक करें]/[विवरण देखें], **inline horizontal stepper** for active orders.

**Job card (transporter, scr-004)** — optional "★ आपके लिए बेस्ट मैच" badge (green border), produce thumb, "500 kg Potato", seller ✓, 📍pickup → 🏁drop, km, ETA, **₹ डिलीवरी कमाई**, green "पिकअप N घंटे के अंदर" chip, **[एक्सेप्ट करें]** (solid) **[रिजेक्ट करें]** (outline).

**Delivery-option row (buyer, scr-007)** — truck thumb, transporter name (+ green "BEST MATCH" chip on the top pick), tagline, trust chips (📍GPS ट्रैकिंग · 🛡️बीमा उपलब्ध · ✅सुरक्षित डिलीवरी), ETA, distance, ★rating(count), **price + struck price**, radio select.

**Stepper** — vertical (order/delivery tracking; ✓ completed, ● active-highlighted, ○ pending, with timestamps) or horizontal inline (order cards). Active step highlighted green.

**Right-rail card** — titled white card with optional "[सभी देखें →]" link; used for cart summary, SmartMatch, earnings, performance donut, live-location map, AI assistant.

**Voice FAB / AI assistant** — sidebar CTA "🎤 बोलकर लिस्ट करें"/"AI साथी से बात करें"/"AI Market Assistant"; mobile center FAB; a chat-style "कृषि साथी (AI सहायक)" card with a robot avatar and "🎤 बोलकर पूछें".

**Trust strip** — a row of 4 small tiles at the bottom of a page (icon + Hindi title + sub), e.g. buyer home: 📊 बाजार से सस्ता · 🔵 AI-स्मार्ट मैच · 🌿 कृषक से सीधी खरीद · 💧 ट्रांसपोर्ट पूलिंग.

**Chips & buttons** — status chips (green/amber/red/blue tints); primary button = solid `--green-primary` white text; secondary = green outline; destructive = red text/outline; tracking = blue.

**Savings strip** — green banner "🌿 आप ₹495 बचा रहे हैं / बाजार मूल्य की तुलना में", shown in cart/checkout.

---

# 9. Farmer screens — *Kisan Setu* (Hindi-first)

Shell **A**. Sidebar brand: leaf logo + **"Kisan Setu"** / "आपका अपना बाजार" (some screens show the farmer avatar at the top instead). Canonical nav order: **डैशबोर्ड · मेरी उपज/मेरी लिस्टिंग · मेरे ऑर्डर · डिलीवरी स्थिति · भुगतान · बाज़ार भाव · सहायता केंद्र · मेरा प्रोफाइल · सेटिंग**, footer globe/language "हिंदी ▾" + लॉगआउट (red). Voice CTA "🎤 बोलकर लिस्ट करें" in the sidebar footer on listing-centric screens.

### 9.1 scr-019 — डैशबोर्ड (Dashboard, the farmer landing) · route `/farmer`
- **Sidebar:** brand *Kisan Setu* / "आपका अपना बाजार"; nav with डैशबोर्ड **active**; promo "बोलो और बेचो / अपनी उपज वॉयस से लिस्ट करें" + [🎤 बोलकर लिस्ट करें] + हिंदी ▾ + लॉगआउट.
- **Topbar:** "नमस्ते रामेश जी 👋" + "स्वागत है आपके किसान डैशबोर्ड पर"; location pill "गाँव: बैजनाथपुर / जिला: बाराबंकी, उत्तर प्रदेश"; weather "32°C हल्की धूप".
- **Hero banner** (farmer holding phone): "अपनी उपज सीधे खरीदारों को बेचें / बेहतर दाम पाएं, ज्यादा कमाएं" + [उपज लिस्ट करें ⊕].
- **Quick Actions (जल्दी करें)** — 4 tiles: 🎤 बोलकर लिस्ट करें / Voice Listing · 📷 फोटो से लिस्ट करें / Photo Listing · 🌿 नई उपज जोड़ें / Manual Listing · 📖 मार्केट भाव देखें / Check Prices.
- **मेरी लिस्ट की गई उपज** [सभी देखें]: गेहूँ 500kg ₹22/kg [सक्रिय] 12 ऑर्डर (आज अपडेट) › · आलू 300kg ₹18/kg [सक्रिय] 8 ऑर्डर › · टमाटर 200kg ₹24/kg [कम स्टॉक] 5 ऑर्डर (1 दिन पहले) ›; [+ नई उपज लिस्ट करें].
- **हाल के ऑर्डर** [सभी देखें]: #ORD1234 · 20मई 10:30AM · गेहूँ 200kg · कृषि भंडार ट्रेडर्स, लखनऊ · ₹4,400 [पूर्ण] डिलीवरी: 22मई › · #ORD1233 · 19मई · आलू 100kg · फूड प्लाजा, कानपुर · ₹1,800 [पूर्ण] डिलीवरी: 21मई ›; [मेरे सभी ऑर्डर देखें].
- **Right rail:** "मेरी कमाई (इस माह)" **₹28,450** कुल कमाई + green "पिछले माह से ↑18% ज्यादा" + bar sparkline; कुल बिक्री 1,350 kg · कुल ऑर्डर 24. "आज का बाज़ार भाव": गेहूँ ₹22–₹24/kg ↑₹1 · आलू ₹17–₹19/kg ↓₹1 · टमाटर ₹22–₹26/kg ↑₹2; [सभी भाव देखें]. "कृषि साथी (AI सहायक)": robot "नमस्ते रामेश जी! मैं आपकी कैसे मदद कर सकता हूँ?" + [🎤 बोलकर पूछें] + chat FAB.
- **Bottom tab bar** (mobile): 🏠 डैशबोर्ड · 🌿 लिस्टिंग · 🎤 बोलकर लिस्ट करें (center FAB) · 🛒 ऑर्डर · 👤 मेरा प्रोफाइल.

### 9.2 scr-016 — मेरी लिस्टिंग (My Listings) · route `/farmer/listings`
- Sidebar farmer avatar (रामेश जी); **मेरी लिस्टिंग active**; footer [🎤 बोलकर लिस्ट करें] + हिंदी ▾.
- **H1** "🌿 मेरी लिस्टिंग (My Listings)" + "आपके द्वारा बेचे जा रहे सभी उत्पाद"; top-right green **[+ नया उत्पाद लिस्ट करें]**.
- **4 KPI cards:** 🌿 कुल लिस्टिंग **12** (सभी उत्पाद) · 👁 कुल व्यू **245** (पिछले 7 दिन में) · 🛒 कुल ऑर्डर **8** (सभी समय) · ₹ कुल बिक्री मूल्य **₹28,450** (सभी समय).
- **Filter tabs:** सभी (12) | सक्रिय (8) | कम स्टॉक (2) | ऑर्डर प्राप्त (2) | समाप्त (2); [⚙ फ़िल्टर].
- **Listing cards** (see §8 component): गेहूँ 500kg ₹22/kg · कृषि भंडार स्टोर, लखनऊ · 20मई · [सक्रिय] व्यू 45 · उपलब्ध 500kg (कम से कम 50kg) · [✏ संपादित करें][🗑 हटाएं] · आलू 300kg ₹18/kg · कानपुर · 19मई · [सक्रिय] व्यू 32 · टमाटर 200kg ₹24/kg · होटल ग्रीन लीफ, लखनऊ · 18मई · **[कम स्टॉक]** व्यू 28 · **50kg (लाल)** (20kg) + amber "⏱ स्टॉक कम है, जल्दी भरें…" [स्टॉक बढ़ाएं] · भिंडी 100kg ₹30/kg · 16मई · [सक्रिय] व्यू 20 · प्याज 400kg ₹16/kg · किसान मंडी · 15मई · **[समाप्त]** व्यू 18 · 0kg "संपूर्ण बेचा जा चुका है" · [फिर से लिस्ट करें] (हटाएं disabled).
- **Bottom AI banner:** "🤖 लिस्टिंग को बेहतर बनाएं / अच्छी फोटो और सही मूल्य से अधिक खरीदार जुड़ते हैं।" [💡 सुझाव देखें].
- **Add-new / Voice / Photo listing** are flows launched from the [+ नया उत्पाद लिस्ट करें] and Quick-Action tiles (draft-then-confirm; voice/photo → editable draft per `docs/API-DESIGN.md` §7).

### 9.3 scr-010 — मेरे ऑर्डर (Orders) · route `/farmer/orders`
- Sidebar farmer avatar; **ऑर्डर active**. **H1** "🛍️ मेरे ऑर्डर (Orders)" + "यहाँ आपके सभी ऑर्डर की जानकारी देखें"; right "🎧 सहायता चाहिए? हमसे बात करें".
- **Filter tabs:** सभी ऑर्डर (12) | नए ऑर्डर (3) | स्वीकार किए (5) | डिलीवरी में (3) | पूरे हुए (8) | रद्द (1).
- **Order cards:**
  - **नया ऑर्डर** #ORD1245 · 20मई 10:30AM · गेहूँ 500kg ₹22/kg · खरीदार: कृषि भंडार स्टोर, लखनऊ · "डिलीवरी चाहिए" · **₹11,000** · **[✓ ऑर्डर स्वीकार करें]** (green) [✕ रद्द करें] + amber "⏱️ कृपया 12 घंटे के अंदर ऑर्डर स्वीकार करें".
  - **स्वीकार किया गया** #ORD1243 · आलू 300kg ₹18/kg · फूड प्लाजा, कानपुर · "स्वयं लेने आएगा" · **₹5,400** · [ऑर्डर विवरण देखें] + "✓ ऑर्डर स्वीकार हो चुका है".
  - **डिलीवरी में** #ORD1241 · टमाटर 200kg ₹24/kg · होटल ग्रीन लीफ · **₹4,800** · **[📍 डिलीवरी ट्रैक करें]** (blue) + "आपका सामान रास्ते में है".
  - **पूरा हुआ** #ORD1239 · भिंडी 100kg ₹30/kg · बीमार्ट स्टोर · **₹3,000** · [पूर्ण विवरण देखें] + ★★★★★.
- **Help banner:** "कोई मदद चाहिए? हमारी सपोर्ट टीम…" [📞 कॉल करें] [🟢 WhatsApp पर बात करें].
- **Bottom tab bar** present. The **accept/self-pickup/delivery** branch here is the UI of the order state machine (`docs/WEB-FLOW.md`, scr-020).

### 9.4 scr-013 — डिलीवरी ट्रैक करें (Delivery Tracking) · route `/farmer/delivery/:orderId`
- Sidebar farmer avatar; **डिलीवरी active**. ← "डिलीवरी ट्रैक करें" + "अपने ऑर्डर की लाइव जानकारी देखें"; [🎧 सहायता चाहिए?].
- **Order header card:** टमाटर (Tomato) 200kg · ₹24/kg · ऑर्डर ID #ORD1241 · ऑर्डर दिनांक 18मई 11:20AM · कुल राशि **₹4,800** · भुगतान: ऑनलाइन ✓ · green chip "डिलीवरी में है".
- **डिलीवरी की स्थिति** + "अपडेट होगा: हर 2 मिनट में ⟳". **Vertical stepper:** ✓ ऑर्डर कंफर्म हुआ 18मई 11:20AM · ✓ पिकअप के लिए निर्धारित 01:15PM · **🚚 पिकअप हो गया 01:45PM** (active green, लखनऊ UP) · ○ डिलीवरी के लिए रवाना (अनुमानित 03:30PM) · ○ डिलीवर किया जाएगा (अनुमानित 05:00PM).
- **लाइव ट्रैकिंग** [देखें मानचित्र पर 🗺️]: map, green route "आपका स्थान बैजनापुर, बाराबंकी → 🚚 → डिलीवरी स्थान आलमबाग, लखनऊ".
- **Driver card:** संदीप कुमार · UP32 AB 1234 · पिकअप वाहन (छोटा ट्रक) · [📞 कॉल करें] [💬 मैसेज करें].
- **3 stat tiles:** 📏 दूरी बाकी **32 km** · 🕐 अनुमानित समय **1घं 45मि** · 📅 अनुमानित डिलीवरी समय **आज, 05:00PM**.
- **Info bar:** "ℹ️ किसी भी सहायता के लिए हमें कॉल करें या चैट करें ›".

### 9.5 scr-002 & scr-014 — बाजार भाव (Market Prices) · route `/farmer/prices`
Two variants of the same screen; **बाज़ार भाव active**; farmer avatar at top of sidebar ("रामेश जी / बेजनापुर, बाराबंकी ▾").
- **Header:** 📊 "बाजार भाव" + "ताज़ा मंडी भाव जानें और सही दाम पर बेचें". scr-014 adds top-right [🔔 भाव अलर्ट सेट करें] and sidebar nav items मंडीबारी & समाचार + a green [🎤 बोलकर पूछें] footer CTA.
- **Filter row (3 selects):** 📍 लखनऊ, उत्तर प्रदेश · सभी फसलें · 📅 आज का भाव.
- **4 KPI crop cards** (circular icon + trend arrow, name, ₹/क्विंटल, delta): गेंहूं ₹2,225 ↑25 (1.14%) · आलू ₹1,450 ↓30 (2.03%) · धान (साधारण) ₹2,050 ↑18 (0.88%) · सरसों ₹5,350 ↑65 (1.23%).
- **Table card** "मंडी के ताज़ा भाव" + "आखिरी अपडेट: आज, 08:30 AM" + ⟳. Columns: फसल | मंडी | न्यूनतम भाव | अधिकतम भाव | औसत भाव | बदलाव (₹) | रुझान. Rows (all मंडी = लखनऊ मंडी, crop thumbnails): गेंहूं 2,150/2,300/2,225/+25 ↗ · आलू 1,350/1,550/1,450/−30 ↘ · धान (साधारण) 1,950/2,150/2,050/+18 ↗ · सरसों 5,150/5,550/5,350/+65 ↗ · टमाटर 800/1,100/950/−20 ↘ · प्याज 1,200/1,500/1,350/+10 ↗ · चना 5,400/5,900/5,650/+40 ↗ · लहसुन 10,500/11,500/11,000/+100 ↗.
- **Footer:** full-width green outline "और फसलें देखें ▾". Trend cell = circular badge (green ↗ / light-red ↘).
- **scr-014 bottom info card** "बाजार भाव की जानकारी" (3 tiles): 📊 सही समय पर बेचें · 🔔 भाव अलर्ट पाएं · 📖 मंडी की पूरी जानकारी; blue note "ℹ️ नोट: सभी भाव संबंधित मंडी समिति से प्राप्त जानकारी पर आधारित हैं।"
- **Data note:** these figures are display seeds; live values come from AGMARKNET/DoCA PMS (`docs/AI-SYSTEM.md`, price feeds). Farmer prices are shown, never blended with any fee.

### 9.6 scr-001 — मेरा प्रोफाइल (My Profile) · route `/farmer/profile`
- Sidebar brand *Kisan Setu*; **मेरा प्रोफाइल active**; footer globe "हिंदी ▾" + लॉगआउट.
- **Topbar:** ← back · title "मेरा प्रोफाइल" · location pill (गाँव: बैजनाथपुर / जिला: धारावंकी, उत्तर प्रदेश ▾) · weather (32°C, हल्की धूप).
- **Profile hero card:** circular avatar with green camera FAB overlay; name **"रामेश जी"**; green verified chip **"✓ सत्यापित किसान"**; 📞 98765 43210; 📅 "पंजीकरण तिथि: 20 मई 2024".
- **Tab strip:** "व्यक्तिगत जानकारी" (active, green underline).
- **2-column cards:**
  - व्यक्तिगत जानकारी [संपादित करें]: पूरा नाम = रामेश जी · पिता/पति का नाम = श्याम लाल · मोबाइल नंबर = 98765 43210 · जन्म तिथि = 15/06/1985 · लिंग = पुरुष.
  - स्थान विवरण [संपादित करें]: गाँव/शहर = बैजनाथपुर · पोस्ट ऑफिस = बैजनाथपुर · जिला = धारावंकी · राज्य = उत्तर प्रदेश · पिन कोड = 221204.
- **पहचान सत्यापन card:** Aadhaar logo · "Aadhaar से सत्यापित" · "आधार नंबर **XXXX XXXX 1234**" (masked — R-019) · "सत्यापित दिनांक: 20 मई 2024" · green chip "सत्यापित" · chevron →.

---

# 10. Buyer screens — *Kisan Bazaar / किसान-क्रेता पोर्टल* (Hindi-first)

Shell **B** (3-column). Two brand skins appear in the mockups: **"Kisan Bazaar / Direct from Farmer"** (light sidebar, scr-003/009/011/012) and the **"किसान-क्रेता पोर्टल"** browser portal (dark-green sidebar, scr-008). Topbar always: search + 🎤 mic, 📍 location ▾, language ▾, 🔔 badge, green **cart button (count · ₹total)**.

### 10.1 scr-009 — होम (Home, full) · route `/buyer`
- **Sidebar:** avatar "Rohit Verma / रोहित वर्मा" + "Buyer" chip + "Lucknow, UP". Nav: होम **active** · ब्राउज़ प्रोडक्ट्स · मेरे ऑर्डर · सेव्ड लिस्ट · फार्मर / FPOs · बाजार भाव [नया badge] · डिलीवरी विकल्प · सेटिंग्स · हेल्प & सपोर्ट. Bottom stat card "आपका इस माह का योगदान": 12 ऑर्डर · ₹840 पैसे बचाए · 6 फार्मर समर्थित · 42 km औसत डिलीवरी.
- **Topbar:** 📍 लखनऊ, उत्तर प्रदेश ▾ · search "क्या खोज रहे हैं? जैसे – 20 किलो टमाटर, गेहूं, आलू…" + 🎤 · हिंदी ▾ · 🔔3 · cart "3 · ₹2,435".
- **Hero banner** (farmer photo): "सीधे किसानों से, बेहतर दाम में, भरोसे के साथ" + 3 chips: ✓ न्यायपूर्ण मूल्य · 🌿 ताज़ा और गुणवत्तापूर्ण · 🚚 स्मार्ट डिलीवरी.
- **श्रेणी के अनुसार खोजें** [सभी देखें →] — 6 tiles: सब्जियों · अनाज · दालें · फल · तेल & मसाले · डेयरी उत्पाद.
- **आपके आस-पास उपलब्ध (Near You)** [सभी देखें →] — product cards (distance chip "12 km दूर", heart, "🌾 सीधे किसान से" chip): टमाटर (Tomato) · Sharma FPO, मोहनलालगंज · ★4.7 (48) · उपलब्ध 500kg · **₹45/kg** ~~बाजार भाव ₹52/kg~~ · [− 20kg +][कार्ट में जोड़ें] · आलू (Potato) · Verma FPO · ★4.8 (210) · 800kg · ₹28/kg ~~₹34/kg~~ · गेहूँ (Wheat) · Kisan Utpadak FPO · 25 Quintal · ₹2,225/Quintal ~~₹2,450~~ · प्याज (Onion) · Green Fields FPO · 600kg · ₹26/kg ~~₹32/kg~~.
- **Trust strip (4):** 📊 बाजार से सस्ता (औसत 10–20% कम दाम) · 🔵 AI-स्मार्ट मैच · 🌿 कृषक से सीधी खरीद · 💧 ट्रांसपोर्ट पूलिंग.
- **आज का बाज़ार भाव (प्रति kg)** [सभी देखें →] mini price chips: टमाटर ₹52 (₹48–₹55 ↑) · आलू ₹34 (₹30–₹36 ↑) · प्याज ₹32 (₹28–₹34 ↑) · गेहूं ₹2,450 (2,350–2,600 ↑) · चना दाल ₹120 (₹110–₹125 ↑) · सोयाबीन ₹55 (₹50–₹58 ↑).
- **Right rail:** "आपकी टोकरी (3 आइटम)" [सभी देखें →] टमाटर 20kg ₹900 🗑 · आलू 20kg ₹560 🗑 · गेहूँ 1 Quintal ₹2,225 🗑 — **Subtotal ₹3,685 · Delivery (SmartMatch) ₹250 · कुल राशि ₹3,935**; green [चेकआउट करें →]; savings strip "🌿 आप ₹495 बचा रहे हैं". "डिलीवरी कैसे चाहिए?": ◉ डिलीवरी पार्टनर (₹250 से शुरू, 2–6 घंटे में) · ○ Self Pick-up (मुफ्त, फार्म/FPO से उठाएं). "SmartMatch (3 सर्वश्रेष्ठ विकल्प)" [सभी देखें →]: ★ "सिफारिश किया गया" Raj Transport (मिनी ट्रक · 1,000kg तक) ETA 2h30m · 82km · ₹1,250 "सबसे कम" · Shakti Logistics ETA 3h10m ₹1,480 · FastMove Cargo ETA 2h45m ₹1,620; green [डिलीवरी विकल्प चुनें]. "मेरा वर्तमान ऑर्डर (ORD5678)" [विवरण देखें →] 500kg आलू / Sharma FPO; stepper ●Ordered 10:30 ●Packed 11:15 ●In Transit 1:15 ○Delivered Est. 3:00PM; mini map Sharma FPO → आपका स्थान; ड्राइवर Ravi Kumar 📞 9876543210; green [लाइव ट्रैक करें].
- **Money rule:** Subtotal, Delivery, and कुल राशि are three separate lines here — never merge (R-001/R-004).

### 10.2 scr-008 — किसान-क्रेता पोर्टल (home, portal variant) · route `/buyer` (portal skin)
- Rendered inside **browser chrome**, URL `portal.kisanbazaar.in`. **Dark-green filled sidebar** (§3): brand "किसान-क्रेता पोर्टल"; user "प्रीति जी (Preeti Ji) / खरीदार (Buyer) / 📍 लखनऊ, उत्तर प्रदेश"; nav 🏠 होम **(active, lighter-green pill)** · उत्पाद श्रेणियाँ · मेरे ऑर्डर · किसान सूची · डिलीवरी पार्टनर · सेटिंग्स · सहायता; footer logo "Kisan Bazaar" + outline [लॉगआउट].
- **Topbar:** 📍 लखनऊ, उत्तर प्रदेश · "हिन्दी / English ▾" · search "मल्टीलिंगुअल खोजें / Search Multilingually… (गेहूँ, टमाटर)" + 🎤 + green 🔍.
- **Category tiles (4):** ताज़ी सब्ज़ियां · अनाज · दालें · फल.
- **आस-पास उपलब्ध (Available Nearby)** — product cards (photo, "आस-पास उपलब्ध" chip, title, price, [− 1 +] stepper, green [कार्ट में जोड़ें]): गेहूँ (Wheat) ₹2,225/Quintal · ताज़ा टमाटर (Tomato) ₹45/kg · अरहर दाल (Arhar Dal) ₹120/kg (+ a partially visible second row).
- **Right rail:** "🛒 मेरा कार्ट (My Cart) (3)": गेहूँ 1 Qty ₹2225 🗑 · टमाटर 2 Qty ₹90 🗑 · दाल 1 Qty ₹120 🗑 — **Subtotal ₹2435 · Total ₹2435**. "डिलीवरी मेथड चुनें": ◉ डिलीवरी पार्टनर द्वारा (By Partner) · ○ किसान द्वारा स्व-सेवा (Self-Service); green [चेकआउट]. "हालिया आदेश ट्रैकिंग" ORD5678 vertical stepper ●Ordered 10:30AM · ●Packed 11:15AM · ○In Transit 1:15PM · ○Delivered Est. 3:00PM. Mini map "लखनऊ मंडी → 🚚 → Buyer's location" + "मार्ग में है (In Transit) – 4km शेष".

### 10.3 scr-011 — All Farmers & FPOs (directory) · route `/buyer/farmers`
- Topbar search "Search by product, farmer, FPO…". **H1** "All Farmers & FPOs" + "सीधे किसानों और FPOs से जुड़ें और ताज़ा, शुद्ध उत्पाद प्राप्त करें".
- **Filter chips:** All (42) **active** | Farmers (28) | FPOs (14) | Followed (6); search "Search farmer or FPO…"; [⚙ Filter].
- **Grid of seller cards** (cover image + logo, orange "Farmer" / green "FPO" tag, name + ✓ verified, 📍 location, 3 stats, ★rating (orders), [View Profile] + ♡): Verma FPO ✓ Mohanlalganj · 250+ Farmers · 20+ Products · 98% On-time · ★4.6 (96) · Kisan Sangh FPO ✓ Barabanki · 180+ · 15+ · 96% · ★4.5 (78) · Ramesh Yadav ✓ (Farmer) Malihabad · 5+ Years · 12+ Products · 95% · ★4.7 (62) · Green Field FPO ✓ Sitapur · 220+ · 18+ · 97% · ★4.6 (85) · Suresh Singh ✓ Raebareli · 8+ Years · 10+ · 94% · ★4.4 (38) · Shree Ram FPO ✓ Gosaiganj · 160+ · 14+ · 96% · ★4.3 (55) · Arvind Kumar ✓ Sitapur · 6+ Years · 9+ · 93% · ★4.5 (41) · Sakhi Mahila FPO ✓ Unnao · 120+ · 16+ · 95% · ★4.2 (48). Pagination «‹ 1 2 3 4 5 ›».
- **Right rail:** "FPO & Farmer Overview" 42 Total · 28 Farmers · 14 FPOs · 6 Followed. "Why Buy from Our Farmers/FPOs?" (✓ Direct from source · Fresh & quality checked · Fair prices · 100% transparency · Support local farmers). "Top Categories": Vegetables 18 · Grains 16 · Pulses 12 · Fruits 10 · Oil & Spices 8. "Recently Joined" [View All]: New Hope FPO (Hardoi) · Mahesh Kumar (Lucknow, Farmer) · Krishi Vikas FPO (Barabanki), each [View]; [👤 Suggest a Farmer/FPO].
- This screen mixes English headings with Hindi subcopy exactly as shown — preserve both.

### 10.4 scr-012 — मेरे ऑर्डर (Orders, buyer history) · route `/buyer/orders`
- Sidebar avatar रोहित वर्मा ★4.6 (128); nav adds "मेरा प्रभाव (My Impact)"; **मेरे ऑर्डर active**; same bottom stat card (12 ऑर्डर / ₹840 / 6 / 42km). **H1** "मेरे ऑर्डर" + "अपने सभी ऑर्डर्स की स्थिति और विवरण देखें"; [⚙ फ़िल्टर].
- **Status tabs:** सभी ऑर्डर्स **active** | Ordered | Packed | In Transit | Delivered | Cancelled.
- **Order cards** (buyer variant, §8): ORD5678 · 12मई 10:30AM · Sharma FPO · ₹3,685 · 3 items · **In Transit · ETA 1:15PM** · inline stepper ✓Ordered 10:30 ✓Packed 11:15 ●In Transit 1:15 ○Delivered Est 3:00 · [ट्रैक करें] · ORD5567 · Kisan Utpadak FPO · ₹2,225 · **Delivered** (10मई 2:45PM) · [विवरण देखें] · ORD5456 · Green Fields FPO · ₹1,340 · **Packed** · Expected 08मई 6:00PM · [ट्रैक करें] · ORD5345 · Verma FPO · ₹1,820 · **Cancelled** (06मई 1:30PM) · [विवरण देखें] · ORD5234 · Sharma FPO · ₹980 · **Delivered** (04मई 1:20PM) · [विवरण देखें].
- **Right rail:** "ऑर्डर समरी (इस माह)" 12 कुल · 6 In Transit · 5 Delivered · 1 Cancelled. "Smart Delivery का लाभ" ₹840 पैसे बचाए · 42km औसत डिलीवरी दूरी · 6 फार्मर्स को सपोर्ट किया. "कोई मदद चाहिए?" ऑर्डर से संबंधित समस्या › · डिलीवरी में देरी? › · रिटर्न/रिफंड ›. "स्थानीय किसानों से जुड़ें" [फार्मर्स देखें].

### 10.5 scr-015 — खरीदार डैशबोर्ड (Buyer Dashboard / farmer-match, mobile) · route `/buyer/orders/:id` (match+confirm)
- Sidebar avatar "प्रीति जी / खरीदार (Buyer)". Compact nav (icon+label): होम **active** · किसान · ऑर्डर · डिलीवरी · सेटिंग्स · सहायता; bottom **blue mic FAB** "आवाज़ से सर्च/खरीदें"; लॉगआउट.
- **H1** "🚜 खरीदार डैशबोर्ड (Buyer Dashboard)"; [🎧 सहायता चाहिए?].
- **Left column — "✓ किसान से मिलान"** (green): farmer card रमेश जी / बैजनापुर, बाराबंकी / green "✓ सत्यापित किसान"; produce गेहूँ (Wheat) 500kg ₹22/kg; कुल राशि **₹11,000**. **"बाज़ार भाव की तुलना"** गेहूँ: वर्तमान भाव (Ramesh Ji) **₹22/kg** VS मंडी औसत भाव ₹2,225/Quintal (≈₹22.25/kg); green info "ℹ️ फ़ायदेमंद मिलान (Advantageous Match) – You are paying slightly below average market price".
- **Right column — card "#ORD5678"** (green header): गेहूँ 500kg · ₹22/kg · कुल राशि **₹11,000** · blue **[⊙ पुष्टि और भुगतान]** · [✕ निरस्त करें] [💬 मैसेज करें]. **"डिलीवरी विवरण":** ✓ किसान द्वारा स्वीकार 18मई · 📦 अनुमानित पिकअप 20मई 11:30AM · 🚚 लाइव ट्रैकिंग: शुरू; map बैजनापुर, बाराबंकी → आलमबाग, लखनऊ.
- This is the buyer-side view of a single accepted match/order (self-pickup here → no delivery fee, R-013).

### 10.6 scr-003 — बाजार भाव (Baazar Bhav, buyer) · route `/buyer/prices`
- Brand "Kisan Bazaar / Direct from Farmer". Sidebar avatar "Rohit Verma" + Buyer chip; nav **बाजार भाव active** (solid-green pill); bottom promo card "AI सहायक से जानें किस फसल का भाव कब बढ़ेगा?" + robot + dark [AI Market Assistant].
- **Topbar:** search + 🎤 ("क्या ढूंढ रहे हैं? (टमाटर, गेहूं, आलू…)") · 📍 Lucknow, UP ▾ · हिंदी ▾ · 🔔3 · green cart "3 · ₹3,935".
- **H1** "बाजार भाव (Baazar Bhav)" + "ताज़ा मंडी भाव देखें और पिछले रुझान, सही समय पर खरीदें".
- **Pill tabs:** आज का भाव **(active green)** | रुझान (Trends) | मंडी तुलना | फसल अलर्ट; right "अंतिम अपडेट: आज, 09:30 AM" + [⟳ रिफ्रेश करें].
- **Filters:** 📍 Lucknow मंडी ▾ · 📅 आज, 4 जून 2024 ▾ · ₹/क्विंटल ▾.
- **Table** columns: फसल/उत्पाद | न्यूनतम भाव | अधिकतम भाव | औसत भाव | पिछले दिन से बदलाव | किसान बाज़ार मूल्य | आपकी बचत | (bookmark). Rows (thumb + Hindi/English): टमाटर/Tomato 1,200 | 1,850 | 1,525 | ↓₹50 (3.2%) | ₹1,250/क्विंटल (₹12.5/kg) | **₹275 (18.0%)** · आलू/Potato 1,000 | 1,550 | 1,275 | ↓₹30 (2.3%) | ₹1,050 (₹10.5/kg) | ₹225 (17.6%) · प्याज/Onion 1,100 | 1,600 | 1,300 | ↑₹40 (3.2%) | ₹1,080 (₹10.8/kg) | ₹220 (16.9%) · गेहूँ/Wheat 2,050 | 2,450 | 2,225 | ↑₹25 (1.1%) | ₹2,000 (₹20/kg) | ₹225 (10.1%) · धान (सामान्य)/Paddy 1,800 | 2,150 | 1,975 | ↑₹35 (1.8%) | ₹1,780 (₹17.8/kg) | ₹195 (9.9%). Centered [और फसलें देखें ▾].
- **Bottom banner** "सही समय पर खरीदें, ज्यादा बचत करें!" — 3 tiles: 🔔 भाव अलर्ट सेट करें · 📊 रुझान के आधार पर निर्णय लें · 🪙 किसान बाज़ार से हर दिन बचत करें.
- **Right rail:** "मेरी पसंदीदा फसलें" [सभी देखें] — टमाटर ₹1,525 ↓3.2% · आलू ₹1,275 ↓2.3% · गेहूं ₹2,225 ↑1.1% · प्याज ₹1,300 ↑3.2%. "⚡ भाव अलर्ट्स" [सभी अलर्ट देखें] — ⚠️ "टमाटर का भाव ₹1,600/क्विंटल से ऊपर हो जाए" [सक्रिय] · ⚠️ "आलू का भाव ₹1,100/क्विंटल से नीचे आ जाए" [सक्रिय] · dashed [+ नया अलर्ट बनाएं]. "टमाटर का भाव रुझान (7 दिन)" line chart, y ₹/क्विंटल 1,000–2,000, x 29 मई→4 जून, green line with markers, tooltip "₹1,525"; range pills 7 दिन **(active)** | 15 दिन | 1 महीना | 3 महीने.
- The **"आपकी बचत"** column is the consumer-side of the price-spread story — buyer sees savings vs mandi; farmer still receives full product price.

### 10.7 scr-007 — डिलीवरी विकल्प चुनें (Delivery Vikalp / checkout) · route `/buyer/checkout/delivery`
- Buyer shell; **Delivery vikalp active**; topbar identical to scr-003. "← Back to Cart" · **H1** "डिलीवरी विकल्प चुनें (Delivery Vikalp)" + "हम आपके लिए सबसे अच्छा, तेज़ और किफ़ायती डिलीवरी विकल्प चुनकर लाए हैं".
- **Green info banner:** "🌟 SmartMatch आपके ऑर्डर के लिए सबसे उपयुक्त डिलीवरी सुझा रहा है".
- **2 mode cards (radio):** **Smart Delivery (सुझाया गया) ₹250 · "आज डिलीवरी"** — "हम आपके लिए बेस्ट ट्रांसपोर्टर चुनेंगे" · chips "तेज़ · भरोसेमंद · ट्रैकिंग उपलब्ध" **(SELECTED, green border)** · **Self Pick-up (स्वयं पिकअप करें) FREE · "जब चाहें पिकअप करें"** — "FPO स्थान से स्वयं सामान उठाएं / कोई डिलीवरी चार्ज नहीं".
- **Table "सभी डिलीवरी विकल्प"** columns: (transporter) | अनुमानित समय | दूरी | रेटिंग | कीमत | (radio). Rows: **Raj Transport** + green "BEST MATCH" · "SmartMatch द्वारा सुझाया गया" · chips 📍GPS · 🛡️बीमा · ✅सुरक्षित · 2h 30m (आज, 3:00 PM तक) · 82 km · ★4.6 (128) · **₹250** ~~₹320~~ · ◉ SELECTED · Shakti Logistics · 3h 10m · 95 km · ★4.4 (96) · ₹280 ~~₹350~~ · FastMove Cargo · 2h 45m · 78 km · ★4.5 (74) · ₹260 ~~₹330~~ · Kisan Express · 4h 20m · 110 km · ★4.2 (53) · ₹220 · Bharat Roadways · 5h 30m · 125 km · ★4.1 (41) · ₹240. [और विकल्प देखें ▾].
- **Trust strip (4):** 🛡️ सुरक्षित डिलीवरी की गारंटी · ⚠️ क्षति होने पर मुआवजा · 📍 ऑर्डर ट्रैकिंग · 🌾 किसान से सीधे आपके घर तक.
- **Right rail:** "आपका ऑर्डर सारांश" (3 आइटम): टमाटर 20 kg ₹900 · आलू 20 kg ₹560 · गेहूं 1 Quintal ₹2,225 — **उप-योग ₹3,685 · Delivery Charges ₹250 · कुल राशि ₹3,935**; savings "🌿 आप ₹495 बचा रहे हैं". "Smart Delivery के फायदे" (✓×5). "डिलीवरी में मदद चाहिए?" [📞 कॉल करें][चैट करें]; collapsible FAQ.
- **Sticky bottom action bar:** "चयनित विकल्प: [Raj Transport]" · "ETA: आज, 3:00 PM तक" · "कुल डिलीवरी चार्ज ₹250 ~~₹320~~" · big green **[इस विकल्प से आगे बढ़ें →]**.
- **Money rule (critical):** उप-योग (product) and Delivery Charges are shown on separate lines; self-pickup sets delivery to FREE/₹0 (R-004/R-013). This screen is the canonical demonstration of price separation.

---

# 11. Transporter screen — *Kisan Bazaar* (Hindi-first)

Shell **C** (3-column). Sidebar: truck avatar card "Raj Transport / UP32 AB 1234" + grey "Mini Truck" chip. Topbar: 📍 Lucknow, UP ▾ · green **"● Online"** toggle · हिंदी ▾ · 🔔3 · avatar "Raj Transport / ★4.8 (128)" ▾.

### 11.1 scr-004 — डैशबोर्ड (Transporter Dashboard) · route `/transporter`
- **Sidebar nav:** डैशबोर्ड **active** · उपलब्ध डिलीवरी · मेरी ट्रिप्स · वर्तमान डिलीवरी · मेरे वाहन · आय / कमाई · ट्रिप हिस्ट्री · रेटिंग और समीक्षा · नोटिफिकेशन (3) · सहायता और सपोर्ट · सेटिंग्स. Bottom promo "AI साथी आपकी मदद के लिए / बेहतर कमाई और स्मार्ट ट्रिप के सुझाव पाएं" + [AI साथी से बात करें].
- **Main header:** "👋 नमस्ते, Raj Transport" + "आज आपके लिए ये बेहतरीन डिलीवरी के मौके हैं"; right "⟳ स्थान अपडेट करें" + "2 min पहले अपडेट हुआ".
- **4 KPI cards:** 🚚 आज की ट्रिप्स **3** (कुल ट्रिप्स) · 📦 कुल लोड **1,250 kg** (सभी ट्रिप्स का वजन) · ₹ आज की कमाई **₹3,850** (कुल अनुमानित आय) · 🕐 ड्यूटी समय **8h 45m** (ऑनलाइन समय).
- **Section "🌾 उपलब्ध डिलीवरी (SmartMatch)"** + "आपके स्थान और वाहन के अनुसार सुझाए गए डिलीवरी" [सभी देखें →]. 3 job cards (horizontal scroll):
  1. badge **"★ आपके लिए बेस्ट मैच"** (green border) · thumb · "500 kg Potato" · "Sharma FPO ✓" · 📍 Lucknow, UP → 🏁 Kanpur, UP · 82 km · ETA 2h 30m · **₹1,250 डिलीवरी कमाई** · green "पिकअप 1 घंटे के अंदर" · **[एक्सेप्ट करें]** (solid) [रिजेक्ट करें] (outline).
  2. "1,000 kg Wheat" · Verma FPO ✓ · Barabanki → Lucknow · 45 km · ETA 1h 45m · ₹900 · "पिकअप 2 घंटे के अंदर".
  3. "300 kg Tomato" · Green Field FPO ✓ · Unnao → Lucknow · 60 km · ETA 2h 15m · ₹800 · "पिकअप 3 घंटे के अंदर".
- **Section "मेरी ट्रिप्स"** [सभी ट्रिप्स देखें →] · tabs **वर्तमान (1) active** | आने वाली (2) | पूर्ण (12). Trip row: ORD5678 · amber "In Transit" · 500 kg Potato / Sharma FPO · 📍 Lucknow —🚚→ 🏁 Kanpur · "पिकअप हो चुका है" · ETA "आज, 3:00 PM" · **₹1,250 कमाई** · [📞 कॉल करें] · ⋮. Stepper: ✅ ऑर्डर एक्सेप्ट किया 10:30 AM — ✅ पिकअप किया 11:15 AM — ● रास्ते में (In Progress) — ○ डिलीवरी.
- **Bottom strip (4):** 😊 स्मार्ट मैचिंग · 🛣️ बेहतर मार्ग · 💳 समय पर भुगतान · 🎧 24x7 सपोर्ट.
- **Right rail:** "मेरी कमाई (इस महीने)" [सभी देखें →] **₹42,850** कुल कमाई; 28 कुल ट्रिप्स · 98% समय पर डिलीवरी · ₹1,530 औसत प्रति ट्रिप. "वाहन क्षमता": truck image, **Mini Truck**, UP32 AB 1234, "500 / 1,000 kg उपयोग में", progress bar ~50%, [वाहन विवरण देखें]. "डिलीवरी परफॉरमेंस" [सभी देखें →]: 98% donut (समय पर) · ★4.8 (128 समीक्षाएं) · 0 कैंसिल ट्रिप्स · 24x7 सपोर्ट. "लाइव लोकेशन" [सभी देखें →]: map, green route Lucknow → Kanpur with truck marker. "ड्राइवर सपोर्ट": [📞 कॉल करें].
- **Freshness/accept behavior:** the **[एक्सेप्ट करें]** action goes through the FreshRoute gate — a job whose ETA exceeds the freshness window is not offered here, and accepting one that violates it returns `FRESHNESS_VIOLATION` (R-009, `docs/API-DESIGN.md` §11/§19). The accepted **₹ डिलीवरी कमाई** becomes the order's delivery fee and the transporter's pay (R-003).

---

# 12. Admin screen — *Kisan Setu · Admin Panel* (English-only)

Shell **D** (2-column, English). White sidebar, solid-green active pill. Topbar: page title "Dashboard" · 📅 "20 May 2024" ▾ · 🔔5 · avatar "Admin / Super Admin" ▾. **No Hindi, no voice.**

### 12.1 scr-005 — Dashboard · route `/admin`
- **Sidebar nav (English):** Dashboard **active** · Farmers · FPOs · Buyers · Orders · Transport & Delivery · Market Prices · Reports & Analytics · Support & Disputes · System Settings · Logout.
- **5 KPI cards** (pastel circular icons, value, delta vs last month): 👥 Total Farmers **12,345** ↑8.6% · 🏢 Total FPOs **842** ↑5.3% · 🛒 Total Orders **3,256** ↑12.5% · 🚚 Active Deliveries **248** ↑10.2% · ₹ Farmer Earnings **₹1.78 Cr** ↑18.7%.
- **Card "Order Status"** [Today ▾]: donut, center "3,256 Total"; legend: ● Pending 523 (16%) · ● Accepted 896 (28%) · ● Dispatched 1,124 (35%) · ● Delivered 653 (20%) · ● Cancelled 60 (1%).
- **Card "Delivery Overview"** [View all]: 🚚 **120** On Time · 🕐 **15** In Transit · ⚠️ **6** Delayed · 🚩 **2** Exception (purple); full-width [📍 Live Tracking Map].
- **Card "Top Selling Produce (This Month)"** [View all]: Tomato 1,245 Orders ↑15.4% · Potato 1,025 ↑10.3% · Wheat 845 ↑7.8% · Onion 620 ↓2.1%.
- **Card "Price Trend (Average per kg)"** [This Week ▾]: **2-line chart** — legend "Farmer Price (₹)" (green) vs "Market Price (₹)" (blue), y 0–40, x 14 May→20 May. **This is the price-spread visual** — the core "farmers earn more, consumers pay less" evidence for DoCA.
- **Card "Recent Alerts"** [View all]: 🔴 "6 deliveries are delayed" 2 min ago · 🟠 "12 orders are pending assignment" 15 min ago · 🔵 "Tomato price high in Kanpur" 1 hr ago · 🟢 "Payment of ₹2.4L credited to farmers" 2 hr ago.
- Admin sub-pages (Farmers/FPOs/Buyers/Orders/Transport/Prices/Reports/Disputes) follow the same English card+table language and are **region-scoped** (`docs/RBAC.md` §4, `docs/API-DESIGN.md` §18).

---

# 13. Planning artifacts (author's handwritten notes — encode, don't render)

**scr-006 — Site-flow note.** Landing Page → {Farmer, Buyer, Transporter, Admin}. Farmer: Signup/login → Dashboard → My Listing → Add new; then Orders · Delivery · Market Prices · Profile. **"Payments" and "Help Center" are bracketed "Future"** — an explicit MVP de-scope signal (reflected in `DECISIONS.md`/MVP scope; keep those nav items visible but non-blocking). Role #3 is named "Transporter" (= Delivery Partner).

**scr-020 — Smart Transportation order flow (authoritative state model).** User orders a product (choosing **Self-service** or **Delivery**) → Farmer End (gets order notification) → Farmer **accepts** → after accepting, two branches: **Self-service → no further steps**; **Delivery → shown nearby delivery-partner options**. This is the order/fulfilment state machine encoded in `docs/WEB-FLOW.md` and `docs/BACKEND-DESIGN.md` §6, and it is what scr-007/scr-008 (delivery-method choice) and scr-015 (accept → pickup → live tracking) render.

---

# 14. Excluded mockups (flag to user)

**scr-017 and scr-018** are handwritten notes for a **different problem statement — ID 26139** (skill development / employment tracking: trainee profile, training/employment/career tracking, resume→AI→mock test+interview, government dashboard, placement analysis). They have **nothing to do with AI MANDI / SIH 26033** and are **excluded** from all product docs. They appear to have slipped into `Details.zip` by mistake — recommend the user confirm and remove them from the project asset set.

---

# 15. Screen → route → role map (18 relevant mockups)

| Mockup | Screen | Role | Route | Shell |
|---|---|---|---|---|
| scr-019 | डैशबोर्ड (home) | Farmer | `/farmer` | A + bottom tabs |
| scr-016 | मेरी लिस्टिंग | Farmer | `/farmer/listings` | A |
| scr-010 | मेरे ऑर्डर | Farmer | `/farmer/orders` | A + bottom tabs |
| scr-013 | डिलीवरी ट्रैक करें | Farmer | `/farmer/delivery/:orderId` | A |
| scr-002 | बाजार भाव | Farmer | `/farmer/prices` | A |
| scr-014 | बाजार भाव (fuller) | Farmer | `/farmer/prices` | A |
| scr-001 | मेरा प्रोफाइल | Farmer | `/farmer/profile` | A |
| scr-009 | होम (full) | Buyer | `/buyer` | B |
| scr-008 | किसान-क्रेता पोर्टल (home) | Buyer | `/buyer` (portal skin) | B (dark sidebar) |
| scr-011 | All Farmers & FPOs | Buyer | `/buyer/farmers` | B |
| scr-012 | मेरे ऑर्डर (history) | Buyer | `/buyer/orders` | B |
| scr-015 | खरीदार डैशबोर्ड (match) | Buyer | `/buyer/orders/:id` | B (compact/mobile) |
| scr-003 | बाजार भाव (Baazar Bhav) | Buyer | `/buyer/prices` | B |
| scr-007 | डिलीवरी विकल्प चुनें | Buyer | `/buyer/checkout/delivery` | B |
| scr-004 | डैशबोर्ड | Transporter | `/transporter` | C |
| scr-005 | Dashboard | Admin | `/admin` | D (English) |
| scr-006 | Site-flow note | Planning | — | — |
| scr-020 | Order-flow note | Planning | — | — |
| ~~scr-017~~ | ~~26139 (excluded)~~ | — | — | — |
| ~~scr-018~~ | ~~26139 (excluded)~~ | — | — | — |

**Coverage:** all 4 RBAC roles have their mockup(s) specified; every relevant screen maps to a route in `docs/WEB-FLOW.md`; money-separation and freshness UI rules are called out on the screens that show them (scr-007, scr-009, scr-004). Build to these specs to satisfy "UI design (Must be same as the given images)".

