'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AiPageContext } from '@/lib/ai-orchestration';
import type { AiSuggestion } from '@/lib/ai-client.types';
import { useOperationalEvents } from '@/lib/use-operational-events';
import {
  isSuggestionAllowedByCapabilities,
  useAiCapabilities,
} from '@/lib/use-ai-capabilities';
import { subscribeOrchestrixEvents } from '@/lib/orchestrix-events';

const REFRESH_EVENT_TYPES = new Set([
  'booking.created',
  'booking.updated',
  'booking.cancelled',
  'booking.completed',
  'booking.rescheduled',
  'availability.updated',
]);

function useRefreshAiSuggestions(businessId: string | undefined) {
  const queryClient = useQueryClient();

  const onEvent = useCallback(
    (type: string) => {
      if (REFRESH_EVENT_TYPES.has(type)) {
        queryClient.invalidateQueries({ queryKey: ['ai-suggestions', businessId] });
      }
    },
    [businessId, queryClient],
  );

  useOperationalEvents(businessId, onEvent);
}

function filterSuggestions(
  suggestions: AiSuggestion[],
  capabilities: ReturnType<typeof useAiCapabilities>['data'],
): AiSuggestion[] {
  return suggestions.filter((s) => isSuggestionAllowedByCapabilities(s, capabilities));
}

export function useAiSuggestions(businessId: string | undefined) {
  const capabilitiesQuery = useAiCapabilities(businessId);

  const query = useQuery({
    queryKey: ['ai-suggestions', businessId, capabilitiesQuery.data?.planTierId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/ai/suggestions`);
      const raw = (data.data ?? data ?? []) as AiSuggestion[];
      return filterSuggestions(raw, capabilitiesQuery.data);
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });

  useRefreshAiSuggestions(businessId);

  return query;
}

export function useContextualAiSuggestions(
  businessId: string | undefined,
  context: AiPageContext,
) {
  const route = context.route ?? '';
  const capabilitiesQuery = useAiCapabilities(businessId);

  const query = useQuery({
    queryKey: [
      'ai-suggestions',
      businessId,
      route,
      context.scheduleTab,
      context.viewMode,
      capabilitiesQuery.data?.planTierId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (context.route) params.set('route', context.route);
      if (context.scheduleTab) params.set('scheduleTab', context.scheduleTab);
      if (context.viewMode) params.set('viewMode', context.viewMode);
      const qs = params.toString();
      const { data } = await api.get(
        `/businesses/${businessId}/ai/suggestions${qs ? `?${qs}` : ''}`,
      );
      const raw = (data.data ?? data ?? []) as AiSuggestion[];
      return filterSuggestions(raw, capabilitiesQuery.data);
    },
    enabled: !!businessId && !!route,
    staleTime: 60_000,
  });

  useRefreshAiSuggestions(businessId);

  return query;
}

export function useOrchestrixEvents(handlers: {
  onPrompt?: (prompt: string) => void;
  onRun?: (prompt: string, autoSubmit: boolean) => void;
  onOpen?: () => void;
}) {
  useEffect(
    () =>
      subscribeOrchestrixEvents({
        onPrompt: handlers.onPrompt,
        onRun: handlers.onRun,
        onOpen: handlers.onOpen,
      }),
    [handlers.onPrompt, handlers.onRun, handlers.onOpen],
  );
}
