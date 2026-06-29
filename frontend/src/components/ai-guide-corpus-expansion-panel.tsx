'use client';

import Link from 'next/link';
import { BookOpen, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { buildDashboardGuideTopicUrl } from '@/lib/dashboard-guide-corpus.util';
import {
  formatGuideCompletionRate,
  resolveGuideTopicLabel,
  type GuideTelemetryAnalyticsResponse,
} from '@/lib/guide-corpus-expansion.util';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

function reasonLabel(
  reason: 'low_completion' | 'grounding_failure' | 'missing_topic',
  t: (key: string) => string,
): string {
  switch (reason) {
    case 'low_completion':
      return t('ai.guideCorpusExpansionReasonLowCompletion');
    case 'grounding_failure':
      return t('ai.guideCorpusExpansionReasonGrounding');
    case 'missing_topic':
      return t('ai.guideCorpusExpansionReasonMissingTopic');
    default:
      return reason;
  }
}

export function AiGuideCorpusExpansionPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-guide-telemetry-analytics', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/ai/guide-telemetry/analytics?days=30`,
      );
      return unwrap<GuideTelemetryAnalyticsResponse>(res);
    },
    enabled: Boolean(business?.id),
    staleTime: 120_000,
  });

  if (!business) return null;

  const topics = data?.topUnansweredTopics ?? [];

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-400" />
          {t('ai.guideCorpusExpansionTitle')}
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

      <p className="text-sm text-gray-400">{t('ai.guideCorpusExpansionHint')}</p>

      {isLoading ? (
        <p className="text-sm text-gray-500">{t('ai.analyticsLoading')}</p>
      ) : topics.length === 0 ? (
        <p className="text-sm text-gray-500">{t('ai.guideCorpusExpansionEmpty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="py-2 pr-4 font-medium">{t('ai.guideCorpusExpansionTopic')}</th>
                <th className="py-2 pr-4 font-medium">{t('ai.guideCorpusExpansionOpened')}</th>
                <th className="py-2 pr-4 font-medium">{t('ai.guideCorpusExpansionCompletion')}</th>
                <th className="py-2 pr-4 font-medium">{t('ai.guideCorpusExpansionGrounding')}</th>
                <th className="py-2 pr-4 font-medium">{t('ai.guideCorpusExpansionReasons')}</th>
                <th className="py-2 font-medium">{t('ai.guideCorpusExpansionAction')}</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((row) => (
                <tr key={row.topicId} className="border-b border-gray-900/80">
                  <td className="py-3 pr-4 align-top">
                    <div className="font-medium text-gray-100">
                      {resolveGuideTopicLabel(row, t)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{row.topicId}</div>
                  </td>
                  <td className="py-3 pr-4 align-top text-gray-300">{row.opened}</td>
                  <td className="py-3 pr-4 align-top text-gray-300">
                    {formatGuideCompletionRate(row.completionRate)}
                  </td>
                  <td className="py-3 pr-4 align-top text-gray-300">{row.groundingFailures}</td>
                  <td className="py-3 pr-4 align-top">
                    <div className="flex flex-wrap gap-1">
                      {row.reasons.map((reason) => (
                        <span
                          key={`${row.topicId}-${reason}`}
                          className="inline-flex rounded-full bg-amber-950/40 border border-amber-700/40 px-2 py-0.5 text-[11px] text-amber-200"
                        >
                          {reasonLabel(reason, t)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 align-top">
                    <Link
                      href={buildDashboardGuideTopicUrl(row.topicId)}
                      className="text-xs text-violet-300 hover:text-violet-200 underline"
                    >
                      {t('ai.guideCorpusExpansionExpandGuide')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
