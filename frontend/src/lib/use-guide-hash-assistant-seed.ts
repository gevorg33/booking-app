'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from '@/i18n';
import {
  fireGuideAssistantSeedFromHash,
  readGuidePageHashAnchor,
} from './dashboard-guide-hash.util';

/** Auto-seed Orchestrix in guide mode when `/dashboard/guide#anchor` is opened or hash changes. */
export function useGuideHashAssistantSeed(): void {
  const { t } = useI18n();
  const lastSeededAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    const trySeed = () => {
      const anchor = readGuidePageHashAnchor();
      if (!anchor) {
        lastSeededAnchorRef.current = null;
        return;
      }
      if (lastSeededAnchorRef.current === anchor) return;
      if (fireGuideAssistantSeedFromHash(t, `#${anchor}`)) {
        lastSeededAnchorRef.current = anchor;
      }
    };

    trySeed();
    window.addEventListener('hashchange', trySeed);
    return () => window.removeEventListener('hashchange', trySeed);
  }, [t]);
}
