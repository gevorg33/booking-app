'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

/**
 * Resolve clinic/tour vertical type for dashboard gates.
 * e2e-bug.61 — auth store may lack `settings` until re-login; fall back to
 * the shared `business-profile` query already fetched by the dashboard layout.
 */
export function useDashboardBusinessType(): string | undefined {
  const business = useAuthStore((s) => s.business);
  const token = useAuthStore((s) => s.token);

  const { data: businessProfile } = useQuery({
    queryKey: ['business-profile', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}`);
      return ((data as { data?: Record<string, unknown> })?.data ?? data) as Record<
        string,
        unknown
      >;
    },
    enabled: !!business?.id && !!token,
  });

  return resolveDashboardBusinessType(business, businessProfile);
}

export function resolveDashboardBusinessType(
  business: {
    settings?: Record<string, unknown>;
    businessType?: string;
  } | null | undefined,
  businessProfile?: Record<string, unknown> | null,
): string | undefined {
  const fromAuth = business?.settings?.businessType;
  if (typeof fromAuth === 'string' && fromAuth.trim()) return fromAuth.trim();

  const fromAuthTop = business?.businessType;
  if (typeof fromAuthTop === 'string' && fromAuthTop.trim()) {
    return fromAuthTop.trim();
  }

  const fromProfileSettings = (
    businessProfile?.settings as { businessType?: string } | undefined
  )?.businessType;
  if (typeof fromProfileSettings === 'string' && fromProfileSettings.trim()) {
    return fromProfileSettings.trim();
  }

  const fromProfileTop = businessProfile?.businessType;
  if (typeof fromProfileTop === 'string' && fromProfileTop.trim()) {
    return fromProfileTop.trim();
  }

  return undefined;
}
