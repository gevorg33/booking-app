'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { unwrapBusinessApiPayload } from '@/lib/business-query';
import {
  readBusinessDefaultLocale,
  readBusinessEnabledLocales,
  type AppLocale,
} from '@/lib/business-locale';

export function readSettingsFromAuthBusiness(
  business: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!business) return undefined;

  const nested = business.settings;
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>;
  }

  if (Array.isArray(business.enabledLocales)) {
    return {
      enabledLocales: business.enabledLocales,
      defaultLocale: business.defaultLocale ?? business.locale,
      locale: business.locale,
    };
  }

  return undefined;
}

export function useBusinessEnabledLocales(): {
  enabledLocales: AppLocale[];
  defaultLocale: AppLocale;
} {
  const business = useAuthStore((s) => s.business);
  const businessId = business?.id;

  const { data: businessData } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
    },
    enabled: Boolean(businessId),
    staleTime: 30_000,
  });

  const settings = useMemo(
    () =>
      businessData?.settings ??
      readSettingsFromAuthBusiness(
        business as unknown as Record<string, unknown> | null | undefined,
      ),
    [business, businessData?.settings],
  );

  const enabledLocales = useMemo(
    () => readBusinessEnabledLocales(settings),
    [settings],
  );
  const defaultLocale = useMemo(
    () => readBusinessDefaultLocale(settings),
    [settings],
  );

  return { enabledLocales, defaultLocale };
}
