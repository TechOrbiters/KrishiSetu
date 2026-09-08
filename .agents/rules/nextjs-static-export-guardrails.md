# Next.js Static Export & Hydration Guardrails

Universal behavioral guardrails and architectural invariants for Next.js static exports (`output: 'export'`), Firebase Hosting deployments, and resilient external API integrations.

## 1. Hydration Determinism
- `useState` initializers must NEVER read `localStorage`, `sessionStorage`, `window`, or non-deterministic values (e.g. `new Date().toISOString()`, `Math.random()`) during initial render.
- Always initialize state with server-consistent defaults (e.g. base language `'hi'`), and defer local storage or browser-specific synchronization to `useEffect` post-mount.
- Never use DOM traversal (`TreeWalker`) or `MutationObserver` to mutate DOM text nodes (`nodeValue`) during initial hydration, as this triggers React Minified Errors #425, #418, and #423.

## 2. Client-Only Subsystems (`ssr: false`)
- For components utilizing browser-only APIs (Google Maps, Leaflet, Web Speech, MediaDevices, Canvas), isolate the component in a dedicated client view file and import it via `dynamic(() => import(...), { ssr: false })` at page level.
- This emits the official Next.js client bailout boundary (`<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">`), completely preventing SSR hydration diffing.

## 3. Firebase Hosting SPA Rewrites & Stale Chunk Auto-Recovery
- Catch-all rewrites in `firebase.json` MUST exclude `_next/**` static chunks:
  ```json
  "rewrites": [
    {
      "source": "!/@(_next|favicon.svg|favicon.ico)/**",
      "destination": "/index.html"
    }
  ]
  ```
- Serving `/index.html` for missing `.js` chunk requests causes the browser to parse HTML as JavaScript, resulting in `SyntaxError: Unexpected token '<'` and fatal `ChunkLoadError`.
- Maintain a global window error listener in `AppInitializer.tsx` for `ChunkLoadError` and `Unexpected token '<'` to automatically reload stale client browser sessions upon new deployments.

## 4. Resilient Public API Integrations
- High-latency public/government APIs (e.g., `data.gov.in`) must use resilient timeouts (>= 12,000–15,000ms).
- UI error banners should only display when both live data AND fallback data fail, not when high-fidelity verified backup datasets are actively and safely serving the user.
