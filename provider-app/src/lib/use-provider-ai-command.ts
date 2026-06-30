import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api, { unwrap } from '../services/api';
import type { AiChatMessage, AiCommandResult, AssistantMode } from './ai-client.types';

const PROVIDER_INVALIDATION_KEYS = [
  'provider-bookings-today',
  'provider-bookings-upcoming',
  'provider-context',
  'provider-ai-suggestions',
] as const;

export function useProviderAiCommand(businessId: string) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const invalidate = useCallback(() => {
    for (const key of PROVIDER_INVALIDATION_KEYS) {
      queryClient.invalidateQueries({ queryKey: [key, businessId] });
    }
  }, [businessId, queryClient]);

  const runCommand = useCallback(
    async (
      prompt: string,
      history: AiChatMessage[],
      context?: Record<string, unknown>,
      assistantMode?: AssistantMode,
    ): Promise<AiCommandResult | null> => {
      if (!prompt.trim()) return null;
      setLoading(true);
      try {
        const { data: res } = await api.post(`/businesses/${businessId}/provider/ai/command`, {
          prompt: prompt.trim(),
          history,
          context: assistantMode ? { ...context, assistantMode } : context,
          ...(assistantMode ? { assistantMode } : {}),
        });
        const result = unwrap(res) as AiCommandResult;
        if (result.success) invalidate();
        return result;
      } finally {
        setLoading(false);
      }
    },
    [businessId, invalidate],
  );

  const confirmAction = useCallback(
    async (body: {
      action: string;
      bookingIds: string[];
      params?: Record<string, unknown>;
    }) => {
      const { data: res } = await api.post(
        `/businesses/${businessId}/provider/ai/command/confirm`,
        body,
      );
      const result = unwrap(res) as AiCommandResult;
      if (result.success) invalidate();
      return result;
    },
    [businessId, invalidate],
  );

  return { loading, runCommand, confirmAction, invalidate };
}
