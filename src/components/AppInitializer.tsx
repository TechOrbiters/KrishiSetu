'use client';

import { useEffect } from 'react';
import { initializeRtdbData } from '@/lib/firebase/initializeRtdb';

/**
 * AppInitializer — Seeds Firebase RTDB with cross-portal data on first load.
 * Runs silently in the background; does not block rendering.
 */
export function AppInitializer() {
  useEffect(() => {
    // 1. Stale deployment chunk load error auto-recovery
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      const isChunkError =
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        (msg.includes("Unexpected token '<'") && (event.filename || '').includes('.js'));

      if (isChunkError && typeof window !== 'undefined') {
        const lastReload = sessionStorage.getItem('last_chunk_reload');
        const now = Date.now();
        // Prevent infinite reload loop: max 1 auto-reload per 10s
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('last_chunk_reload', String(now));
          console.warn('[AppInitializer] New app version detected. Refreshing assets...');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleError);

    // 2. Seed RTDB in background on first load
    initializeRtdbData().catch((err) =>
      console.warn('[AppInitializer] RTDB init (non-critical):', err)
    );

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // Renders nothing — pure side-effect component
}
