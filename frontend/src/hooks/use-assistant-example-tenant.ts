'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  mapDashboardServicesForAssistantExamples,
  type AssistantExampleTenantInput,
} from '@/lib/assistant-example-tenant.util';

export function useAssistantExampleTenant(): AssistantExampleTenantInput {
  const business = useAuthStore((state) => state.business);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', business?.id, 'assistant-examples'],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/employees`);
      return (data.data || data || []) as Array<{
        id: string;
        name: string;
        serviceIds?: string[];
        isActive?: boolean;
      }>;
    },
    enabled: !!business?.id,
    staleTime: 60_000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', business?.id, 'assistant-examples'],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/services`);
      return (data.data || data || []) as Array<{
        id: string;
        name: string;
        isActive?: boolean;
        category?: { name?: string | null } | null;
      }>;
    },
    enabled: !!business?.id,
    staleTime: 60_000,
  });

  return useMemo(
    () => ({
      employees,
      services: mapDashboardServicesForAssistantExamples(services),
    }),
    [employees, services],
  );
}
