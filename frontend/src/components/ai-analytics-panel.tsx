'use client';

import { BarChart3, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface AiCommandMetrics {
  periodDays: number;
  totalCommands: number;
  successRate: number;
  clarifyRate: number;
  approvalRate: number;
  autoExecuteRate: number;
  targets: {
    completionRate: number;
    clarifyRecoveryRate: number;
    autoExecuteRate: number;
    approvalExecuteRate: number;
  };
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function MetricCard({ label, value, target }: { label: string; value: number; target?: number }) {
  const meets = target == null || value >= target;
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${meets ? 'text-green-400' : 'text-amber-400'}`}>
        {pct(value)}
      </p>
      {target != null && (
        <p className="text-xs text-gray-600 mt-1">Target {pct(target)}</p>
      )}
    </div>
  );
}

export function AiAnalyticsPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-analytics', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/ai/analytics?days=30`);
      return (res.data ?? res) as AiCommandMetrics;
    },
    enabled: !!business?.id,
    staleTime: 120_000,
  });

  if (!business) return null;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          {t('ai.analyticsTitle')}
        </h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary text-sm"
        >
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : t('ai.analyticsRefresh')}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">{t('ai.analyticsLoading')}</p>
      ) : (
        <>
          <p className="text-sm text-gray-400">
            {t('ai.analyticsPeriod', { days: String(data?.periodDays ?? 30), total: String(data?.totalCommands ?? 0) })}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label={t('ai.analyticsSuccessRate')}
              value={data?.successRate ?? 0}
              target={data?.targets.completionRate}
            />
            <MetricCard
              label={t('ai.analyticsClarifyRate')}
              value={data?.clarifyRate ?? 0}
            />
            <MetricCard
              label={t('ai.analyticsApprovalRate')}
              value={data?.approvalRate ?? 0}
            />
            <MetricCard
              label={t('ai.analyticsAutoExecuteRate')}
              value={data?.autoExecuteRate ?? 0}
              target={data?.targets.autoExecuteRate}
            />
          </div>
        </>
      )}
    </div>
  );
}
