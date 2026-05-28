'use client';

import { useCallback, useEffect } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOperationalEvents } from '@/lib/use-operational-events';
import type { AiPageContext } from '@/lib/ai-orchestration';

export interface AiSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  prompt: string;
  category: string;
}

const PRIORITY_COLOR = {
  high: 'border-red-500/30 bg-red-950/20',
  medium: 'border-amber-500/30 bg-amber-950/20',
  low: 'border-gray-600 bg-gray-800/40',
};

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

function fireOrchestrixPrompt(prompt: string) {
  window.dispatchEvent(new CustomEvent('orchestrix:prompt', { detail: { prompt } }));
  window.dispatchEvent(new CustomEvent('orchestrix:open'));
}

function SuggestionGrid({ suggestions }: { suggestions: AiSuggestion[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {suggestions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => fireOrchestrixPrompt(s.prompt)}
          className={`text-left p-3 rounded-lg border transition-colors hover:border-violet-500/50 ${PRIORITY_COLOR[s.priority]}`}
        >
          <p className="text-sm font-medium text-gray-200">{s.title}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Run with Orchestrix AI
          </p>
        </button>
      ))}
    </div>
  );
}

export function AiProactiveSuggestions() {
  const { business } = useAuthStore();

  const { data: suggestions = [] } = useQuery({
    queryKey: ['ai-suggestions', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/ai/suggestions`);
      return (data.data ?? data ?? []) as AiSuggestion[];
    },
    enabled: !!business?.id,
    staleTime: 60_000,
  });

  useRefreshAiSuggestions(business?.id);

  if (suggestions.length === 0) return null;

  return (
    <div className="card mb-6 border-violet-500/25">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-violet-400" />
        <h2 className="font-semibold text-gray-100">AI detected opportunities</h2>
      </div>
      <SuggestionGrid suggestions={suggestions} />
    </div>
  );
}

interface AiContextualSuggestionsProps {
  context: AiPageContext;
  title?: string;
}

/** Live suggestions filtered by page context (schedule gaps, conflicts, etc.) */
export function AiContextualSuggestions({
  context,
  title = 'AI opportunities on this page',
}: AiContextualSuggestionsProps) {
  const { business } = useAuthStore();
  const route = context.route ?? '';

  const { data: suggestions = [] } = useQuery({
    queryKey: ['ai-suggestions', business?.id, route, context.scheduleTab, context.viewMode],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (context.route) params.set('route', context.route);
      if (context.scheduleTab) params.set('scheduleTab', context.scheduleTab);
      if (context.viewMode) params.set('viewMode', context.viewMode);
      const qs = params.toString();
      const { data } = await api.get(
        `/businesses/${business!.id}/ai/suggestions${qs ? `?${qs}` : ''}`,
      );
      return (data.data ?? data ?? []) as AiSuggestion[];
    },
    enabled: !!business?.id && !!route,
    staleTime: 60_000,
  });

  useRefreshAiSuggestions(business?.id);

  if (suggestions.length === 0) return null;

  return (
    <div className="card border-violet-500/20 bg-gradient-to-br from-violet-950/15 to-gray-900/30 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-violet-200">{title}</h3>
      </div>
      <SuggestionGrid suggestions={suggestions} />
    </div>
  );
}

export function useOrchestrixEvents(handlers: {
  onPrompt?: (prompt: string) => void;
  onOpen?: () => void;
}) {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      const prompt = (e as CustomEvent<{ prompt: string }>).detail?.prompt;
      if (prompt && handlers.onPrompt) handlers.onPrompt(prompt);
    };
    const onOpen = () => handlers.onOpen?.();

    window.addEventListener('orchestrix:prompt', onPrompt);
    window.addEventListener('orchestrix:open', onOpen);
    return () => {
      window.removeEventListener('orchestrix:prompt', onPrompt);
      window.removeEventListener('orchestrix:open', onOpen);
    };
  }, [handlers.onPrompt, handlers.onOpen]);
}
