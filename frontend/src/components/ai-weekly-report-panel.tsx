'use client';

import { FileBarChart, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { fireOrchestrixRun } from '@/lib/orchestrix-events';

interface WeeklyReportSection {
  heading: string;
  body: string;
}

interface WeeklyReportResponse {
  title: string;
  sections: WeeklyReportSection[];
  generated?: boolean;
  snapshot?: Record<string, unknown>;
}

export function AiWeeklyReportPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-weekly-report', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/ai/weekly-report`);
      return (res.data ?? res) as WeeklyReportResponse;
    },
    enabled: !!business?.id,
    staleTime: 300_000,
  });

  if (!business) return null;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-violet-400" />
          {t('ai.weeklyReportTitle')}
        </h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary text-sm"
        >
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : t('ai.weeklyReportRefresh')}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">{t('ai.weeklyReportLoading')}</p>
      ) : (
        <>
          <p className="text-sm text-gray-400">{data?.title ?? t('ai.weeklyReportTitle')}</p>
          {!data?.generated && (
            <p className="text-xs text-amber-500/90">{t('ai.weeklyReportFallback')}</p>
          )}
          <div className="space-y-3">
            {(data?.sections ?? []).map((section) => (
              <div key={section.heading} className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                <h3 className="text-sm font-medium text-gray-200">{section.heading}</h3>
                <p className="mt-1 text-sm text-gray-400 whitespace-pre-wrap">{section.body}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              fireOrchestrixRun(
                'Fill schedule gaps for all providers this week between 9-19',
                true,
              )
            }
            className="btn-primary text-sm"
          >
            {t('ai.weeklyReportActionGaps')}
          </button>
        </>
      )}
    </div>
  );
}
