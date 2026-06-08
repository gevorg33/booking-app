'use client';

import { Loader2, Sparkles, UserRound } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface AliasSuggestion {
  id: string;
  alias: string;
  entry: Record<string, string>;
  correctionCount: number;
  source?: string;
  lastSeenAt?: string;
}

export function AiAliasSuggestionsPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: aliasSuggestions, isLoading } = useQuery({
    queryKey: ['ai-alias-suggestions', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data: payload } = await api.get(
        `/businesses/${business.id}/ai/entity-memory/alias-suggestions`,
      );
      return (payload.data ?? payload ?? []) as AliasSuggestion[];
    },
    enabled: !!business?.id,
  });

  const harvestMutation = useMutation({
    mutationFn: async () => {
      const { data: payload } = await api.post(
        `/businesses/${business!.id}/ai/entity-memory/alias-suggestions/harvest?days=30`,
      );
      return payload.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-alias-suggestions', business?.id] });
    },
  });

  const approveAlias = useMutation({
    mutationFn: async (suggestionId: string) => {
      await api.post(
        `/businesses/${business!.id}/ai/entity-memory/alias-suggestions/${suggestionId}/approve`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-alias-suggestions', business?.id] });
    },
  });

  if (isLoading) {
    return (
      <div className="card flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('ai.loadingAnalytics')}
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserRound className="w-5 h-5 text-cyan-400" />
            {t('ai.aliasSuggestionsTitle')}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{t('ai.aliasSuggestionsHint')}</p>
        </div>
        <button
          type="button"
          onClick={() => harvestMutation.mutate()}
          disabled={harvestMutation.isPending}
          className="btn-secondary text-sm flex items-center gap-1"
        >
          {harvestMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {t('ai.aliasSuggestionsHarvest')}
        </button>
      </div>

      {harvestMutation.data && (
        <p className="text-xs text-green-400">
          {t('ai.aliasSuggestionsHarvestDone', {
            events: String(harvestMutation.data.correctionEvents ?? 0),
            suggestions: String(harvestMutation.data.newSuggestions ?? 0),
          })}
        </p>
      )}

      {!aliasSuggestions?.length ? (
        <p className="text-sm text-gray-500">{t('ai.aliasSuggestionsEmpty')}</p>
      ) : (
        <div className="space-y-2">
          {aliasSuggestions.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{row.alias}</span>
                <span className="text-gray-500">
                  {' '}
                  → {Object.values(row.entry).filter(Boolean).join(', ')} (
                  {row.correctionCount}×)
                </span>
              </span>
              <button
                type="button"
                onClick={() => approveAlias.mutate(row.id)}
                disabled={approveAlias.isPending}
                className="text-xs px-2 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
              >
                {t('ai.approveAlias')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
