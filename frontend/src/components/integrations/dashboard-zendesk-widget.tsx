'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { ZendeskWidget } from '@/components/integrations/zendesk-widget';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

export function DashboardZendeskWidget() {
  const { business } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['integrations-zendesk-widget', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/integrations/zendesk/widget`,
      );
      return unwrap<{ widgetKey: string | null }>(res);
    },
    enabled: !!business?.id,
    staleTime: 60_000,
  });

  return <ZendeskWidget widgetKey={data?.widgetKey} />;
}
