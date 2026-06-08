'use client';

import { GitBranch, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface ConfusionMatrixEntry {
  from: string;
  to: string;
  count: number;
  share: number;
  retryCount: number;
  undoCount: number;
}

interface ConfusionMatrixExport {
  periodDays: number;
  totalCorrections: number;
  pairs: ConfusionMatrixEntry[];
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatActionLabel(action: string) {
  return action.replace(/_/g, ' ');
}

export function AiConfusionMatrixPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-confusion-matrix', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/ai/accuracy/confusion-matrix?days=30&limit=25`,
      );
      return (res.data ?? res) as ConfusionMatrixExport;
    },
    enabled: !!business?.id,
    staleTime: 120_000,
  });

  if (!business) return null;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-400" />
            {t('ai.accuracyConfusionTitle')}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{t('ai.accuracyConfusionHint')}</p>
        </div>
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
      ) : !data?.pairs?.length ? (
        <p className="text-sm text-gray-500">{t('ai.accuracyConfusionEmpty')}</p>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            {t('ai.accuracyConfusionSummary', {
              days: String(data.periodDays),
              total: String(data.totalCorrections),
            })}
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
                  <th className="px-3 py-2 text-left font-medium">
                    {t('ai.accuracyConfusionClassified')}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t('ai.accuracyConfusionCorrected')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('ai.accuracyConfusionCount')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('ai.accuracyConfusionShare')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('ai.accuracyConfusionRetry')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('ai.accuracyConfusionUndo')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.pairs.map((row) => (
                  <tr key={`${row.from}-${row.to}`} className="border-b border-gray-800/60 last:border-0">
                    <td className="px-3 py-2 text-gray-300">{formatActionLabel(row.from)}</td>
                    <td className="px-3 py-2 text-gray-300">{formatActionLabel(row.to)}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{row.count}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{pct(row.share)}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{row.retryCount}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{row.undoCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
