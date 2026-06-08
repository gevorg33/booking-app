'use client';

import { AlertTriangle, ClipboardList, Loader2, Mail, RefreshCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface ReviewDigest {
  generatedAt: string;
  periodDays: number;
  lastPublishedAt?: string;
  headline: {
    totalCommands: number;
    accurateRate: number;
    escalationRate: number;
    weeklyAccuracyDelta?: number;
  };
  regressions: string[];
  newFailures: Array<{
    promptSnippet: string;
    action: string;
    failureCount: number;
    locale: string;
  }>;
  topConfusedIntents: Array<{ from: string; to: string; count: number }>;
  localesBelowTarget: Array<{
    locale: string;
    accuracy: number;
    gapFromBest: number;
    total: number;
  }>;
  recommendedActions: string[];
  escalationSummary?: {
    meetsTarget: boolean;
    recentEscalations: Array<{
      traceId: string;
      promptSnippet: string;
      action: string;
      surface: string;
      locale: string;
      createdAt: string;
    }>;
  };
}

export function AiAccuracyReviewPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-accuracy-review-digest', business?.id],
    queryFn: async () => {
      if (!business?.id) return null;
      const { data: payload } = await api.get(
        `/businesses/${business.id}/ai/accuracy/review?days=7`,
      );
      return (payload.data ?? payload) as ReviewDigest;
    },
    enabled: !!business?.id,
  });

  const publishReview = useMutation({
    mutationFn: async () => {
      const { data: payload } = await api.post(
        `/businesses/${business!.id}/ai/accuracy/review/publish`,
      );
      return payload.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-accuracy-review-digest'] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="card flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('ai.loadingAnalytics')}
      </div>
    );
  }

  const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

  return (
    <div className="card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold">{t('ai.reviewTitle')}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {t('ai.reviewRefresh')}
          </button>
          <button
            type="button"
            onClick={() => publishReview.mutate()}
            disabled={publishReview.isPending}
            className="btn-primary text-sm flex items-center gap-1"
          >
            {publishReview.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {t('ai.reviewPublish')}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {t('ai.reviewPeriod').replace('{days}', String(data.periodDays))}
        {data.lastPublishedAt
          ? ` · ${t('ai.reviewLastPublished').replace(
              '{date}',
              new Date(data.lastPublishedAt).toLocaleString(),
            )}`
          : ''}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.reviewCommands')}</p>
          <p className="text-xl font-semibold">{data.headline.totalCommands}</p>
        </div>
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.reviewAccurateRate')}</p>
          <p className="text-xl font-semibold">{pct(data.headline.accurateRate)}</p>
        </div>
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.reviewEscalationRate')}</p>
          <p
            className={`text-xl font-semibold ${
              (data.escalationSummary?.meetsTarget ?? data.headline.escalationRate <= 0.01)
                ? 'text-green-400'
                : 'text-amber-400'
            }`}
          >
            {pct(data.headline.escalationRate, 2)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.reviewWeeklyDelta')}</p>
          <p
            className={`text-xl font-semibold ${
              (data.headline.weeklyAccuracyDelta ?? 0) >= 0
                ? 'text-green-400'
                : 'text-amber-400'
            }`}
          >
            {data.headline.weeklyAccuracyDelta != null
              ? `${data.headline.weeklyAccuracyDelta >= 0 ? '+' : ''}${(
                  data.headline.weeklyAccuracyDelta * 100
                ).toFixed(1)} pts`
              : '—'}
          </p>
        </div>
      </div>

      {data.regressions.length > 0 && (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-3">
          <p className="text-sm font-medium flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4" />
            {t('ai.reviewRegressions')}
          </p>
          <ul className="mt-2 text-sm text-amber-100/90 list-disc pl-5 space-y-1">
            {data.regressions.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReviewList
          title={t('ai.reviewNewFailures')}
          empty={t('ai.reviewNone')}
          items={data.newFailures.map(
            (row) =>
              `${row.promptSnippet.slice(0, 100)} (${row.action}, ${row.failureCount}×, ${row.locale})`,
          )}
        />
        <ReviewList
          title={t('ai.reviewConfusedIntents')}
          empty={t('ai.reviewNone')}
          items={data.topConfusedIntents.map(
            (row) => `${row.from} → ${row.to} (${row.count}×)`,
          )}
        />
        <ReviewList
          title={t('ai.reviewLocalesBelowTarget')}
          empty={t('ai.reviewNone')}
          items={data.localesBelowTarget.map(
            (row) =>
              `${row.locale}: ${pct(row.accuracy)} (${(row.gapFromBest * 100).toFixed(1)} pts behind, n=${row.total})`,
          )}
        />
        <ReviewList
          title={t('ai.reviewEscalationRecent')}
          empty={t('ai.reviewNone')}
          items={(data.escalationSummary?.recentEscalations ?? []).map(
            (row) =>
              `${row.promptSnippet.slice(0, 100)} (${row.action}, ${row.surface}, ${row.locale})`,
          )}
        />
        <ReviewList
          title={t('ai.programRecommendedActions')}
          empty={t('ai.reviewNone')}
          items={data.recommendedActions}
        />
      </div>
    </div>
  );
}

function ReviewList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <h3 className="text-sm font-medium text-gray-200">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="mt-2 text-sm text-gray-400 space-y-1 list-disc pl-5">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
