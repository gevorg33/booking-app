'use client';

import { AlertCircle, ClipboardCopy, Download, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface WorstPromptFailureSignals {
  suspected_miss: number;
  wrong_execution: number;
  clarify_abandoned: number;
  thumbs_down: number;
  failed_outcome: number;
  low_confidence: number;
}

interface WorstPromptEntry {
  rank: number;
  promptHash: string;
  promptSnippet: string;
  action: string;
  surface: string;
  locale: string;
  failureCount: number;
  avgConfidence: number | null;
  failureSignals: WorstPromptFailureSignals;
  correctedAction: string | null;
  lastSeenAt: string;
}

interface WorstPromptsExport {
  periodDays: number;
  totalFailures: number;
  prompts: WorstPromptEntry[];
}

function pct(value: number | null) {
  if (value == null) return '—';
  return `${Math.round(value * 100)}%`;
}

function formatActionLabel(action: string) {
  return action.replace(/_/g, ' ');
}

function signalSummary(signals: WorstPromptFailureSignals) {
  const parts: string[] = [];
  if (signals.suspected_miss) parts.push(`retry ${signals.suspected_miss}`);
  if (signals.wrong_execution) parts.push(`undo ${signals.wrong_execution}`);
  if (signals.clarify_abandoned) parts.push(`abandon ${signals.clarify_abandoned}`);
  if (signals.thumbs_down) parts.push(`👎 ${signals.thumbs_down}`);
  if (signals.low_confidence) parts.push(`low conf ${signals.low_confidence}`);
  if (signals.failed_outcome) parts.push(`failed ${signals.failed_outcome}`);
  return parts.join(' · ') || '—';
}

export function AiWorstPromptsPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-worst-prompts', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/ai/accuracy/worst-prompts?days=30&limit=25`,
      );
      return (res.data ?? res) as WorstPromptsExport;
    },
    enabled: !!business?.id,
    staleTime: 120_000,
  });

  const downloadEvalDrafts = async () => {
    if (!business?.id) return;
    setExportMessage(null);
    try {
      const { data: res } = await api.get(
        `/businesses/${business.id}/ai/accuracy/worst-prompts/eval-export?days=30&limit=25`,
      );
      const payload = res.data ?? res;
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `ai-worst-prompts-eval-${business.id.slice(0, 8)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportMessage(t('ai.accuracyWorstPromptsExportDone'));
    } catch {
      setExportMessage(t('ai.accuracyWorstPromptsExportFailed'));
    }
  };

  const copyEvalDrafts = async () => {
    if (!business?.id) return;
    setExportMessage(null);
    try {
      const { data: res } = await api.get(
        `/businesses/${business.id}/ai/accuracy/worst-prompts/eval-export?days=30&limit=25`,
      );
      await navigator.clipboard.writeText(JSON.stringify(res.data ?? res, null, 2));
      setExportMessage(t('ai.accuracyWorstPromptsCopyDone'));
    } catch {
      setExportMessage(t('ai.accuracyWorstPromptsExportFailed'));
    }
  };

  if (!business) return null;

  return (
    <div className="card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            {t('ai.accuracyWorstPromptsTitle')}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{t('ai.accuracyWorstPromptsHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="btn-secondary text-sm"
          >
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : t('ai.analyticsRefresh')}
          </button>
          <button
            type="button"
            onClick={() => void copyEvalDrafts()}
            className="btn-secondary text-sm inline-flex items-center gap-1.5"
          >
            <ClipboardCopy className="w-4 h-4" />
            {t('ai.accuracyWorstPromptsCopyEval')}
          </button>
          <button
            type="button"
            onClick={() => void downloadEvalDrafts()}
            className="btn-secondary text-sm inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            {t('ai.accuracyWorstPromptsExportEval')}
          </button>
        </div>
      </div>

      {exportMessage && (
        <p className="text-xs text-gray-400">{exportMessage}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">{t('ai.analyticsLoading')}</p>
      ) : !data?.prompts?.length ? (
        <p className="text-sm text-gray-500">{t('ai.accuracyWorstPromptsEmpty')}</p>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            {t('ai.accuracyWorstPromptsSummary', {
              days: String(data.periodDays),
              failures: String(data.totalFailures),
              prompts: String(data.prompts.length),
            })}
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t('ai.accuracyWorstPromptsPrompt')}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t('ai.accuracyWorstPromptsIntent')}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t('ai.accuracyBreakdownSurface')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('ai.accuracyBreakdownFailures')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('ai.accuracyWorstPromptsConfidence')}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {t('ai.accuracyWorstPromptsSignals')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.prompts.map((row) => (
                  <tr
                    key={row.promptHash}
                    className="border-b border-gray-800/60 last:border-0 align-top"
                  >
                    <td className="px-3 py-2 text-gray-500">{row.rank}</td>
                    <td className="px-3 py-2 text-gray-300 max-w-xs">
                      <p>{row.promptSnippet}</p>
                      {row.correctedAction && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          {t('ai.accuracyConfusionCorrected')}:{' '}
                          {formatActionLabel(row.correctedAction)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-400">
                      {formatActionLabel(row.action)}
                    </td>
                    <td className="px-3 py-2 text-gray-400">
                      {row.surface} · {row.locale.toUpperCase()}
                    </td>
                    <td className="px-3 py-2 text-right text-amber-300/90">
                      {row.failureCount}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {pct(row.avgConfidence)}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {signalSummary(row.failureSignals)}
                    </td>
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
