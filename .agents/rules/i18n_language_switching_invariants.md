# i18n & Multi-Language Switching Invariants

These architectural invariants ensure smooth, error-free, and crash-resistant multi-lingual operations across all KrishiSetu portals (**हिंदी, English, मराठी, తెలుగు, தமிழ், বাংলা**).

---

## 1. WeakMap-Based Base Text Preservation
- **Invariant**: UI text nodes and input placeholders must have their original base strings preserved in module-scoped `WeakMap<Node, string>` and `WeakMap<Element, string>` references before translation.
- **Rationale**: Direct string mutation without base text caching causes cumulative corruption when switching between multiple non-Hindi languages (e.g., Hindi $\to$ Marathi $\to$ Telugu). WeakMap allows garbage collection of unmounted DOM nodes and prevents React Fiber reconciliation crashes (`NotFoundError: Failed to execute 'removeChild' on 'Node'`).
- **Check**: Always translate from `baseTextMap.get(node)` or restore original text when target is `'hi'`.

## 2. Complete Hindi Switch-Back Restoration
- **Invariant**: Switching back to Hindi (`targetLang === 'hi'`) must actively restore every visited text node and placeholder to its original base Hindi value.
- **Anti-Pattern**: Never use `if (targetLang === 'hi') return;`. Early return traps the interface in whatever foreign language was previously chosen.

## 3. Loop-Free DOM MutationObserver
- **Invariant**: The `MutationObserver` watching for dynamic DOM updates (tabs, modals, new listings) must NEVER observe `characterData: true`.
- **Configuration**:
  ```ts
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false,
  });
  ```
- **Rationale**: Observing `characterData: true` while mutating `node.nodeValue` inside the callback creates an infinite loop that freezes the browser UI thread and crashes the page.
- **Debounce**: Always debounce translation callbacks with a 150–200ms timer.

## 4. Single-Pass Regex Replacement (Zero Cascading or Runaway Duplication)
- **Invariant**: NEVER use sequential loop replacements like `for (rule of rules) { str = str.split(rule.src).join(rule.target); }`.
- **Anti-Pattern Rationale**: Sequential in-place string replacement causes re-entrant cascading corruption. When one rule translates `"Orders"` $\to$ `"ऑर्डर्स"`, a subsequent rule matching `"ऑर्डर"` will match inside the newly generated `"ऑर्डर्स"`, repeatedly appending characters and halants (`्स्स्स्स्स्स्स्स्स्स्स्स्`), or splitting multi-byte Indic conjuncts and leaving orphaned vowel marks (`◌ॆ`).
- **Solution**: Always compile all translation phrases into a single regular expression with length-descending alternation:
  ```ts
  const sortedKeys = Array.from(phraseMap.keys()).sort((a, b) => b.length - a.length);
  const regex = new RegExp(sortedKeys.map(escapeRegex).join('|'), 'g');
  return str.replace(regex, (match) => phraseMap.get(match) || match);
  ```
- **Guarantee**: JavaScript's regex engine advances its scan pointer past each replacement, guaranteeing that translated text is NEVER inspected or re-matched again in the same pass.

## 5. Universal Selector Availability
- **Invariant**: Every role portal and authentication page MUST have a visible `<LanguageSelector />` rendered in its top bar or header:
  - Buyer Portal (`src/components/buyer/BuyerPortal.tsx`)
  - Farmer Dashboard (`src/components/layout/FarmerTopbar.tsx` and `FarmerSidebar.tsx`)
  - Transporter Portal (`src/components/transporter/TransporterPortal.tsx`)
  - Admin Portal (`src/components/admin/AdminHeader.tsx`)
  - Public Landing Page (`src/app/page.tsx`)
  - All Auth Pages: `/auth/farmer`, `/auth/buyer`, `/auth/transporter`, `/admin/login`
- **Exclusion**: All language selector containers must include `data-no-translate="true"` and child dropdown menus must include the `.language-dropdown-menu` class so language names are never erroneously re-translated.
