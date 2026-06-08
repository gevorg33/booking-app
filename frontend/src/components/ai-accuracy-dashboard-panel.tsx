'use client';

import { CheckCircle2, AlertTriangle, Loader2, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface IntentBreakdown {
  total: number;
  accurate: number;
  clarify: number;
  failures: number;
}

interface LocaleSurfaceBreakdown {
  total: number;
  accurate: number;
}

interface AccuracyMetrics {
  noClarifyCompletionRate?: number;
  clarifyRate?: number;
  clarifySuccessRate?: number;
  clarifyQualityTarget?: number;
  clarifyQualityMeetsTarget?: boolean;
  clarifyNextTurnSampleSize?: number;
  clarifyAbandonRate?: number;
  misclassificationRate?: number;
  explicitNegativeRate?: number;
  exitGate?: {
    met: boolean;
    failures: string[];
    periodDays: number;
    criteria: Array<{
      id: string;
      label: string;
      value: number;
      target: number;
      comparator: 'gte' | 'lte';
      met: boolean;
      unit: 'percent' | 'points';
      detail?: string;
    }>;
  };
  clarifyNear99Gate?: {
    met: boolean;
    failures: string[];
    periodDays: number;
    target: number;
    criteria: Array<{
      id: string;
      label: string;
      value: number;
      target: number;
      comparator: 'gte' | 'lte';
      met: boolean;
      unit: 'percent' | 'points' | 'count';
      detail?: string;
    }>;
  };
  clarifyNear99MeetsTarget?: boolean;
  clarifyNear99Target?: number;
  noClarifyNear99Gate?: {
    met: boolean;
    failures: string[];
    periodDays: number;
    target: number;
    criteria: Array<{
      id: string;
      label: string;
      value: number;
      target: number;
      comparator: 'gte' | 'lte';
      met: boolean;
      unit: 'percent' | 'points' | 'count';
      detail?: string;
    }>;
  };
  noClarifyNear99MeetsTarget?: boolean;
  noClarifyNear99Target?: number;
  clarifyQualityByIntent?: Record<
    string,
    { sampleSize: number; successCount: number; successRate: number }
  >;
  clarifyQualityByLocale?: Record<
    string,
    { sampleSize: number; successCount: number; successRate: number }
  >;
  worstClarifies?: Array<{
    rank: number;
    promptSnippet: string;
    action: string;
    surface: string;
    clarifyKind: string | null;
    nextTurnOutcome: string;
    failureCount: number;
  }>;
  byIntent?: Record<string, IntentBreakdown>;
  byLocale?: Record<string, LocaleSurfaceBreakdown>;
  bySurface?: Record<string, LocaleSurfaceBreakdown>;
  confusionMatrix?: Array<{ from: string; to: string; count: number }>;
}

interface AiCommandMetrics {
  periodDays: number;
  totalCommands: number;
  accuracy?: AccuracyMetrics;
}

function pct(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatCriterionValue(value: number, unit: 'percent' | 'points') {
  if (unit === 'points') return `${(value * 100).toFixed(1)} pts`;
  return pct(value, 1);
}

function formatCriterionTarget(target: number, comparator: 'gte' | 'lte', unit: 'percent' | 'points') {
  const formatted = unit === 'points' ? `${(target * 100).toFixed(0)} pts` : pct(target, 0);
  return comparator === 'gte' ? `≥ ${formatted}` : unit === 'points' ? `≤ ${formatted}` : `< ${formatted}`;
}

function accuracyRate(accurate: number, total: number) {
  return total ? accurate / total : 0;
}

function formatActionLabel(action: string) {
  return action.replace(/_/g, ' ');
}

function MetricCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${warn ? 'text-amber-400' : 'text-green-400'}`}>
        {pct(value)}
      </p>
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: Array<{ key: string; cells: string[] }>;
  columns: string[];
}) {
  if (rows.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-2">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500">
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-gray-800/60 last:border-0">
                {row.cells.map((cell, index) => (
                  <td key={`${row.key}-${index}`} className="px-3 py-2 text-gray-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AiAccuracyDashboardPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-accuracy-analytics', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/ai/analytics?days=30`);
      return (res.data ?? res) as AiCommandMetrics;
    },
    enabled: !!business?.id,
    staleTime: 120_000,
  });

  const accuracy = data?.accuracy;

  const surfaceRows =
    accuracy?.bySurface &&
    Object.entries(accuracy.bySurface)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([surface, row]) => ({
        key: surface,
        cells: [
          surface,
          String(row.total),
          pct(accuracyRate(row.accurate, row.total)),
        ],
      }));

  const localeRows =
    accuracy?.byLocale &&
    Object.entries(accuracy.byLocale)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([locale, row]) => ({
        key: locale,
        cells: [
          locale.toUpperCase(),
          String(row.total),
          pct(accuracyRate(row.accurate, row.total)),
        ],
      }));

  const intentRows =
    accuracy?.byIntent &&
    Object.entries(accuracy.byIntent)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 12)
      .map(([intent, row]) => ({
        key: intent,
        cells: [
          formatActionLabel(intent),
          String(row.total),
          pct(accuracyRate(row.accurate, row.total)),
          pct(row.total ? row.clarify / row.total : 0),
          String(row.failures),
        ],
      }));

  const clarifyIntentRows =
    accuracy?.clarifyQualityByIntent &&
    Object.entries(accuracy.clarifyQualityByIntent)
      .sort(([, a], [, b]) => b.sampleSize - a.sampleSize)
      .slice(0, 12)
      .map(([intent, row]) => ({
        key: intent,
        cells: [
          formatActionLabel(intent),
          String(row.sampleSize),
          pct(row.successRate),
        ],
      }));

  const clarifyLocaleRows =
    accuracy?.clarifyQualityByLocale &&
    Object.entries(accuracy.clarifyQualityByLocale)
      .sort(([, a], [, b]) => b.sampleSize - a.sampleSize)
      .map(([locale, row]) => ({
        key: locale,
        cells: [locale.toUpperCase(), String(row.sampleSize), pct(row.successRate)],
      }));

  if (!business) return null;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-sky-400" />
          {t('ai.accuracyTitle')}
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
      ) : !accuracy ? (
        <p className="text-sm text-gray-500">{t('ai.accuracyEmpty')}</p>
      ) : (
        <>
          {accuracy.exitGate && (
            <div
              className={`rounded-lg border p-4 space-y-3 ${
                accuracy.exitGate.met
                  ? 'border-green-900/50 bg-green-950/20'
                  : 'border-amber-900/50 bg-amber-950/20'
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                    {accuracy.exitGate.met ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    {t('ai.accuracyExitGateTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{t('ai.accuracyExitGateHint')}</p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    accuracy.exitGate.met ? 'text-green-300' : 'text-amber-300'
                  }`}
                >
                  {accuracy.exitGate.met
                    ? t('ai.accuracyExitGateMet')
                    : t('ai.accuracyExitGatePending')}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {accuracy.exitGate.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="rounded-md border border-gray-800/80 bg-gray-900/50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-200">{criterion.label}</p>
                      <span
                        className={`text-xs font-medium ${
                          criterion.met ? 'text-green-400' : 'text-amber-400'
                        }`}
                      >
                        {criterion.met ? '✓' : '✗'}
                      </span>
                    </div>
                    <p className="text-lg font-semibold mt-1">
                      {formatCriterionValue(criterion.value, criterion.unit)}
                      <span className="text-xs font-normal text-gray-500 ml-2">
                        {formatCriterionTarget(
                          criterion.target,
                          criterion.comparator,
                          criterion.unit,
                        )}
                      </span>
                    </p>
                    {criterion.detail ? (
                      <p className="text-xs text-gray-500 mt-1">{criterion.detail}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              {!accuracy.exitGate.met && accuracy.exitGate.failures.length > 0 && (
                <ul className="text-xs text-amber-100/90 list-disc pl-5 space-y-1">
                  {accuracy.exitGate.failures.map((failure) => (
                    <li key={failure}>{failure}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {accuracy.clarifyNear99Gate && (
            <div
              className={`rounded-lg border p-4 space-y-3 ${
                accuracy.clarifyNear99Gate.met
                  ? 'border-green-900/50 bg-green-950/20'
                  : 'border-amber-900/50 bg-amber-950/20'
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                    {accuracy.clarifyNear99Gate.met ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    {t('ai.clarifyNear99GateTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{t('ai.clarifyNear99GateHint')}</p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    accuracy.clarifyNear99Gate.met ? 'text-green-300' : 'text-amber-300'
                  }`}
                >
                  {accuracy.clarifyNear99Gate.met
                    ? t('ai.clarifyNear99GateMet')
                    : t('ai.clarifyNear99GatePending')}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {accuracy.clarifyNear99Gate.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="rounded-md border border-gray-800/80 bg-gray-900/50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-200">{criterion.label}</p>
                      <span
                        className={`text-xs font-medium ${
                          criterion.met ? 'text-green-400' : 'text-amber-400'
                        }`}
                      >
                        {criterion.unit === 'count'
                          ? String(criterion.value)
                          : formatCriterionValue(criterion.value, criterion.unit === 'points' ? 'points' : 'percent')}
                        {' · '}
                        {criterion.unit === 'count'
                          ? `≥ ${criterion.target}`
                          : formatCriterionTarget(
                              criterion.target,
                              criterion.comparator,
                              criterion.unit === 'points' ? 'points' : 'percent',
                            )}
                      </span>
                    </div>
                    {criterion.detail ? (
                      <p className="text-xs text-gray-500 mt-1">{criterion.detail}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {accuracy.noClarifyNear99Gate && (
            <div
              className={`rounded-lg border p-4 space-y-3 ${
                accuracy.noClarifyNear99Gate.met
                  ? 'border-green-900/50 bg-green-950/20'
                  : 'border-amber-900/50 bg-amber-950/20'
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                    {accuracy.noClarifyNear99Gate.met ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    {t('ai.noClarifyNear99GateTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{t('ai.noClarifyNear99GateHint')}</p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    accuracy.noClarifyNear99Gate.met ? 'text-green-300' : 'text-amber-300'
                  }`}
                >
                  {accuracy.noClarifyNear99Gate.met
                    ? t('ai.noClarifyNear99GateMet')
                    : t('ai.noClarifyNear99GatePending')}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {accuracy.noClarifyNear99Gate.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="rounded-md border border-gray-800/80 bg-gray-900/50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-200">{criterion.label}</p>
                      <span
                        className={`text-xs font-medium ${
                          criterion.met ? 'text-green-400' : 'text-amber-400'
                        }`}
                      >
                        {criterion.unit === 'count'
                          ? String(criterion.value)
                          : formatCriterionValue(criterion.value, criterion.unit === 'points' ? 'points' : 'percent')}
                        {' · '}
                        {criterion.unit === 'count'
                          ? `≥ ${criterion.target}`
                          : formatCriterionTarget(
                              criterion.target,
                              criterion.comparator,
                              criterion.unit === 'points' ? 'points' : 'percent',
                            )}
                      </span>
                    </div>
                    {criterion.detail ? (
                      <p className="text-xs text-gray-500 mt-1">{criterion.detail}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label={t('ai.accuracyNoClarifyRate')}
              value={accuracy.noClarifyCompletionRate ?? 0}
            />
            <MetricCard
              label={t('ai.accuracyClarifyRate')}
              value={accuracy.clarifyRate ?? 0}
            />
            <MetricCard
              label={t('ai.accuracyClarifySuccessRate')}
              value={accuracy.clarifySuccessRate ?? 0}
              warn={
                accuracy.clarifyNextTurnSampleSize
                  ? !(accuracy.clarifyNear99MeetsTarget ?? accuracy.clarifyQualityMeetsTarget ?? false)
                  : false
              }
            />
            <MetricCard
              label={t('ai.accuracyMisclassificationRate')}
              value={accuracy.misclassificationRate ?? 0}
              warn={(accuracy.misclassificationRate ?? 0) > 0.05}
            />
            <MetricCard
              label={t('ai.accuracyNegativeRate')}
              value={accuracy.explicitNegativeRate ?? 0}
              warn={(accuracy.explicitNegativeRate ?? 0) > 0.03}
            />
          </div>

          {(accuracy.clarifyNextTurnSampleSize ?? 0) > 0 && (
            <p className="text-xs text-gray-500">
              {t('ai.accuracyClarifySuccessHint', {
                target: Math.round(
                  (accuracy.clarifyNear99Target ??
                    accuracy.clarifyQualityTarget ??
                    0.9) * 100,
                ),
                sample: accuracy.clarifyNextTurnSampleSize ?? 0,
                abandon: Math.round((accuracy.clarifyAbandonRate ?? 0) * 100),
              })}
            </p>
          )}

          {(accuracy.worstClarifies?.length ?? 0) > 0 && (
            <BreakdownTable
              title={t('ai.accuracyWorstClarifiesTitle')}
              columns={[
                t('ai.accuracyBreakdownIntent'),
                t('ai.accuracyWorstClarifyKind'),
                t('ai.accuracyWorstClarifyOutcome'),
                t('ai.accuracyBreakdownFailures'),
              ]}
              rows={(accuracy.worstClarifies ?? []).map((entry) => ({
                key: `${entry.rank}-${entry.promptSnippet}`,
                cells: [
                  entry.promptSnippet,
                  entry.clarifyKind ?? '—',
                  entry.nextTurnOutcome.replace(/_/g, ' '),
                  String(entry.failureCount),
                ],
              }))}
            />
          )}

          {(clarifyIntentRows?.length ?? 0) > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <BreakdownTable
                title={t('ai.accuracyClarifyByIntentTitle')}
                columns={[
                  t('ai.accuracyBreakdownIntent'),
                  t('ai.accuracyClarifyPairs'),
                  t('ai.accuracyClarifySuccessRateCol'),
                ]}
                rows={clarifyIntentRows ?? []}
              />
              <BreakdownTable
                title={t('ai.accuracyClarifyByLocaleTitle')}
                columns={[
                  t('ai.accuracyBreakdownLocale'),
                  t('ai.accuracyClarifyPairs'),
                  t('ai.accuracyClarifySuccessRateCol'),
                ]}
                rows={clarifyLocaleRows ?? []}
              />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownTable
              title={t('ai.accuracyBySurfaceTitle')}
              columns={[
                t('ai.accuracyBreakdownSurface'),
                t('ai.accuracyBreakdownCommands'),
                t('ai.accuracyBreakdownAccuracy'),
              ]}
              rows={surfaceRows ?? []}
            />
            <BreakdownTable
              title={t('ai.accuracyByLocaleTitle')}
              columns={[
                t('ai.accuracyBreakdownLocale'),
                t('ai.accuracyBreakdownCommands'),
                t('ai.accuracyBreakdownAccuracy'),
              ]}
              rows={localeRows ?? []}
            />
          </div>

          <BreakdownTable
            title={t('ai.accuracyByIntentTitle')}
            columns={[
              t('ai.accuracyBreakdownIntent'),
              t('ai.accuracyBreakdownCommands'),
              t('ai.accuracyBreakdownAccuracy'),
              t('ai.accuracyBreakdownClarify'),
              t('ai.accuracyBreakdownFailures'),
            ]}
            rows={intentRows ?? []}
          />
        </>
      )}
    </div>
  );
}
