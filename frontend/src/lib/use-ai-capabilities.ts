'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AiCapabilities } from '@/lib/ai-client.types';

export function useAiCapabilities(businessId: string | undefined) {
  return useQuery({
    queryKey: ['ai-capabilities', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/ai/capabilities`);
      return (data.data ?? data) as AiCapabilities;
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function isSuggestionAllowedByCapabilities(
  suggestion: { intentHint?: string },
  capabilities: AiCapabilities | undefined,
): boolean {
  if (!suggestion.intentHint || !capabilities) return true;
  return capabilities.allowedIntents.includes(suggestion.intentHint);
}
