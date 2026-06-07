import { useQuery } from '@tanstack/react-query';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';

export function useProviderLabFeaturesEnabled(): boolean {
  const business = useAuthStore((s) => s.business);

  const { data } = useQuery({
    queryKey: ['provider-context', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/context`,
      );
      return unwrap<{ labFeaturesEnabled?: boolean }>(res);
    },
    enabled: !!business?.id,
    staleTime: 5 * 60_000,
  });

  return data?.labFeaturesEnabled === true;
}
