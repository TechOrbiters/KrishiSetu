'use client';

import { useEffect } from 'react';
import { initializeRtdbData } from '@/lib/firebase/initializeRtdb';

/**
 * AppInitializer — Seeds Firebase RTDB with cross-portal data on first load.
 * Runs silently in the background; does not block rendering.
 */
export function AppInitializer() {
  useEffect(() => {
    // Seed RTDB in background on first load
    initializeRtdbData().catch((err) =>
      console.warn('[AppInitializer] RTDB init (non-critical):', err)
    );
  }, []);

  return null; // Renders nothing — pure side-effect component
}
