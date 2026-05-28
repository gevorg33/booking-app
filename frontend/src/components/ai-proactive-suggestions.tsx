'use client';

import { Sparkles, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

interface AiSuggestion {
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

  if (suggestions.length === 0) return null;

  const firePrompt = (prompt: string) => {
    window.dispatchEvent(new CustomEvent('orchestrix:prompt', { detail: { prompt } }));
    window.dispatchEvent(new CustomEvent('orchestrix:open'));
  };

  return (
    <div className="card mb-6 border-violet-500/25">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-violet-400" />
        <h2 className="font-semibold text-gray-100">AI detected opportunities</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => firePrompt(s.prompt)}
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
