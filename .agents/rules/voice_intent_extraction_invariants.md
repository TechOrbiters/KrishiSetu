# Voice Intent Extraction & Indic Number Normalization Rules

## Critical Voice Input & STT Constraints
1. **Zero Hallucinated Numeric Defaults**:
   - Never fabricate numeric values for fields such as `minOrder`, `price`, or `quantity` based on formulaic calculations (e.g., `Math.min(50, Math.round(quantity / 5))`) when the speaker did not mention them.
   - If a field is not explicitly spoken by the user in multi-field speech, it must remain `undefined` (or unchanged in existing form state).

2. **Indic Number Word & Devanagari Normalization**:
   - Speech parsers and STT handlers must normalize spoken Hindi/Hinglish number words (*एक*, *दो*, *तीन*, *चार*, *पांच/पाँच*, *छह*, *सात*, *आठ*, *नौ*, *दस*, *बीस*, *पच्चीस*, *तीस*, *चालीस*, *पचास*, *सौ*, *हज़ार*, etc.) and Devanagari numerals (*०-९*) to standard numeric integers before assigning them to React state.
   - HTML `<input type="number">` elements reject non-numeric string values (like `"बीस"` or `"20 किलो"`), causing the input to appear blank. Parsers must guarantee that the value passed to state is a clean integer/number.

3. **Field-Targeted Priority**:
   - When a user activates a dedicated field microphone (e.g., clicking the mic on the `minOrder` input):
     - The parser must prioritize any spoken number directly for that field (e.g., "20", "बीस", "20 किलो", "कम से कम 20").
     - Even if a generic phrase like "20 किलो" is categorized as quantity by a global heuristic, the dedicated target field must take precedence.

4. **Conversational Regex Robustness**:
   - Regex extractors for minimum order or pricing must accommodate natural Indian conversational phrasing including filler words (e.g., *"कम से कम का आर्डर"*, *"न्यूनतम खरीद"*, *"कम से कम बीस किलो"*, *"minimum order 50"*).
   - Support both prefix (*"कम से कम 20 किलो"*) and suffix (*"20 किलो न्यूनतम"*) patterns.

5. **Compound Phrase i18n Invariants**:
   - Technical form labels and field titles that contain common words like *"ऑर्डर"* must be translated as complete compound phrases (e.g., `"न्यूनतम ऑर्डर मात्रा*"` → `"Minimum Order Quantity*"`, `"किमान ऑर्डर प्रमाण*"`) in translation dictionaries.
   - Substring-only translations must never prematurely mutate part of a Hindi compound phrase into English (e.g., preventing hybrid corruptions like *"न्यूनतम Orders मात्रा* "*).

6. **Single-Field Mic Routing Isolation (CRITICAL)**:
   - When a user clicks a **specific field microphone** (`cropName`, `quantity`, `price`, `minOrder`), the voice `onSuccess` handler must **always** route to the single-field logic branch — **never** the multi-entity / global path.
   - The `hasMultipleEntities` check must be gated by `!isSpecificField`:
     ```ts
     const isSpecificField = result.field && result.field !== 'global';
     const hasMultipleEntities = !isSpecificField && (...);
     ```
   - **Root cause of bug (2026-09-09):** `parseMandiIntent("24 रुपये")` returns both `quantity=24` AND `pricePerKg=24` because "24" matches the fallback quantity assignment as well as the price regex. Without the `isSpecificField` gate, `hasMultipleEntities` was `true`, causing the global multi-entity path to run — which set **both** quantity and price to 24, contaminating the quantity field when the user only intended to fill the price field.
   - **Rule:** Multi-entity branch (populating all detected fields at once) is ONLY for `result.field === 'global'` or `result.field === undefined`.
   - **Price field fallback chain:** `intent.pricePerKg || parseSpokenNumber(transcript) || intent.quantity` — ensures any spoken number reaches the price field even when no price keyword (रुपये, भाव, etc.) is detected.
   - **Quantity field fallback chain:** `parseSpokenNumber(transcript) || intent.quantity` — prioritizes word-based parsing over intent for plain Hindi number words.
