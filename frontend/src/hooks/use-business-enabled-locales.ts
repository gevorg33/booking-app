'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import {
  readBusinessDefaultLocale,
  readBusinessEnabledLocales,
  type AppLocale,
} from '@/lib/business-locale';

export function useBusinessEnabledLocales(): {
  enabledLocales: AppLocale[];
  defaultLocale: AppLocale;
} {
  const business = useAuthStore((s) => s.business);

  return useMemo(
    () => ({
      enabledLocales: readBusinessEnabledLocales(
        business?.settings as Record<string, unknown> | undefined,
      ),
      defaultLocale: readBusinessDefaultLocale(
        business?.settings as Record<string, unknown> | undefined,
      ),
    }),
    [business?.settings],
  );
}
