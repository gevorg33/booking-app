'use client';

import { useEffect } from 'react';
import { isCapacitorNative } from '@/lib/capacitor';

export function ProviderServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (isCapacitorNative()) return;

    navigator.serviceWorker
      .register('/provider-sw.js', { scope: '/provider/' })
      .catch(() => {
        /* offline install optional */
      });
  }, []);

  return null;
}
