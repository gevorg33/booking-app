'use client';

import { AlertTriangle, CheckCircle2, Headphones, Loader2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface EscalationAnalytics {
  periodDays?: number;
  totalCommands: number;
  escalationCount: number;
  escalationRate: number;
  targetRate: number;
  meetsTarget: boolean;
  impliedAccuracy: number;
  bySurface: Record<
    string,
    { total: number; escalationCount: number; escalationRate: number }
  >;
  recentEscalations: Array<{
    traceId: string;
    promptSnippet: string;
    action: string;
    surface: string;
    locale: string;
    clarifyKind: string | null;
    createdAt: string;
  }>;
}

export function AiEscalationAnalyticsPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-escalation-analytics', business?.id],
    queryFn: async () => {
      if (!business?.id) return null;
      const { data: payload } = await api.get(
        `/businesses/${business.id}/ai/accuracy/escalations?days=7&limit=10`,
      );
      return (payload.data ?? payload) as EscalationAnalytics;
    },
    enabled: !!business?.id,
  });

  if (isLoading || !data) {
    return (
      <div className="card flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('ai.loadingAnalytics')}
      </div>
    );
  }

  const pct = (value: number, digits = 2) => `${(value * 100).toFixed(digits)}%`;
  const surfaceRows = Object.entries(data.bySurface).sort(
    (a, b) => b[1].escalationRate - a[1].escalationRate,
  );

  return (
    <div className="card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold">{t('ai.escalationTitle')}</h2>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary text-sm flex items-center gap-1 self-start"
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {t('ai.reviewRefresh')}
        </button>
      </div>

      <p className="text-xs text-gray-500">{t('ai.escalationHint')}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.escalationRate')}</p>
          <p
            className={`text-xl font-semibold ${
              data.meetsTarget ? 'text-green-400' : 'text-amber-400'
            }`}
          >
            {pct(data.escalationRate)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t('ai.escalationTarget').replace('{target}', pct(data.targetRate, 0))}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.escalationImpliedAccuracy')}</p>
          <p className="text-xl font-semibold">{pct(data.impliedAccuracy, 1)}</p>
        </div>
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.escalationCount')}</p>
          <p className="text-xl font-semibold">{data.escalationCount}</p>
        </div>
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.escalationStatus')}</p>
          <p className="text-xl font-semibold flex items-center gap-1">
            {data.meetsTarget ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                {t('ai.escalationMet')}
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                {t('ai.escalationOverTarget')}
              </>
            )}
          </p>
        </div>
      </div>

      {surfaceRows.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
          <h3 className="text-sm font-medium text-gray-200">{t('ai.escalationBySurface')}</h3>
          <ul className="mt-2 text-sm text-gray-400 space-y-1">
            {surfaceRows.map(([surface, stats]) => (
              <li key={surface}>
                {surface}: {pct(stats.escalationRate)} ({stats.escalationCount}/{stats.total})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
        <h3 className="text-sm font-medium text-gray-200">{t('ai.escalationRecent')}</h3>
        {data.recentEscalations.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">{t('ai.reviewNone')}</p>
        ) : (
          <ul className="mt-2 text-sm text-gray-400 space-y-2">
            {data.recentEscalations.map((row) => (
              <li key={row.traceId} className="border-b border-gray-800/60 pb-2 last:border-0">
                <p>{row.promptSnippet.slice(0, 120)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {row.action} · {row.surface} · {row.locale} ·{' '}
                  {new Date(row.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
