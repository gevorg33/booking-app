'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PlanEntitlements, PlanFeatureFlag } from '@/lib/plan-entitlements';

export function usePlanEntitlements(businessId: string | undefined) {
  return useQuery({
    queryKey: ['plan-entitlements', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/billing/entitlements`);
      return (data.data ?? data) as PlanEntitlements;
    },
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function canUseFeature(
  entitlements: PlanEntitlements | undefined,
  feature: PlanFeatureFlag,
): boolean {
  return entitlements?.flags[feature] === true;
}
