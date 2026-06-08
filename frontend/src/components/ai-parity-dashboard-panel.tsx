'use client';

import { Fragment, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface ParityCriterion {
  id: string;
  label: string;
  value: number;
  target: number;
  comparator: 'gte' | 'lte';
  met: boolean;
  unit: 'percent' | 'count';
  detail?: string;
}

interface ParityRoleSurfaceRow {
  tier: string;
  surface: string;
  coveragePercent: number | null;
  coveredCount: number;
  uiActionCount: number;
  gapCount: number;
  scopeBugCount: number;
  gaps: string[];
  scopeBugs: string[];
}

interface ParityAllowDenyRow {
  kind: 'over_grant' | 'under_grant';
  tier: string;
  surface: string;
  intentId: string;
  featureId: string;
}

interface ParityTrend {
  currentMinCoverage: number;
  previousMinCoverage: number | null;
  deltaPercent: number | null;
  previousSnapshotAt: string | null;
}

interface ParityDashboardSnapshot {
  generatedAt: string;
  exitGate: {
    met: boolean;
    failures: string[];
    criteria: ParityCriterion[];
  };
  byRoleSurface: ParityRoleSurfaceRow[];
  minCoveragePercent: number;
  openGapCount: number;
  openScopeBugCount: number;
  allowDenyUnderGrantCount: number;
  allowDenyOverGrantCount: number;
  allowDenyDivergences: ParityAllowDenyRow[];
  extractionMissingCount: number;
  agentTaskPassRate: number;
  trend: ParityTrend;
  trendDeltaPercent: number | null;
}

function pct(value: number | null, digits = 1) {
  if (value == null) return 'n/a';
  return `${(value * 100).toFixed(digits)}%`;
}

function formatCriterionValue(value: number, unit: 'percent' | 'count') {
  if (unit === 'count') return String(value);
  return pct(value);
}

function TrendBadge({ trend }: { trend: ParityTrend }) {
  const { t } = useI18n();
  const delta = trend.deltaPercent;

  if (delta == null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Minus className="w-3.5 h-3.5" />
        {t('ai.parityTrendBaseline')}
      </span>
    );
  }

  const positive = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        positive ? 'text-green-400' : 'text-amber-400'
      }`}
    >
      {positive ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {positive ? '+' : ''}
      {pct(delta)}
      {trend.previousMinCoverage != null ? (
        <span className="text-gray-500 font-normal">
          {t('ai.parityTrendVs', { value: pct(trend.previousMinCoverage) })}
        </span>
      ) : null}
    </span>
  );
}

export function AiParityDashboardPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-parity-coverage', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/ai/parity/coverage`,
      );
      return (res.data ?? res) as ParityDashboardSnapshot;
    },
    enabled: !!business?.id,
    staleTime: 300_000,
  });

  if (!business) return null;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-400" />
            {t('ai.parityTitle')}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{t('ai.paritySubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary text-sm"
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('ai.analyticsRefresh')
          )}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">{t('ai.analyticsLoading')}</p>
      ) : !data ? (
        <p className="text-sm text-gray-500">{t('ai.parityEmpty')}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
              <p className="text-xs text-gray-500">{t('ai.parityMinCoverage')}</p>
              <p className="text-2xl font-semibold mt-1">{pct(data.minCoveragePercent)}</p>
              <div className="mt-2">
                <TrendBadge trend={data.trend} />
              </div>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
              <p className="text-xs text-gray-500">{t('ai.parityOpenGaps')}</p>
              <p className="text-2xl font-semibold mt-1">{data.openGapCount}</p>
              <p className="text-xs text-gray-500 mt-2">
                {t('ai.parityScopeBugs')}: {data.openScopeBugCount}
              </p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
              <p className="text-xs text-gray-500">{t('ai.parityAllowDeny')}</p>
              <p className="text-2xl font-semibold mt-1">{data.allowDenyUnderGrantCount}</p>
              <p className="text-xs text-gray-500 mt-2">
                {t('ai.parityOverGrant')}: {data.allowDenyOverGrantCount}
              </p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
              <p className="text-xs text-gray-500">{t('ai.parityAgentTasks')}</p>
              <p className="text-2xl font-semibold mt-1">{pct(data.agentTaskPassRate)}</p>
              <p className="text-xs text-gray-500 mt-2">
                {t('ai.parityCatalogFreshness')}: {data.extractionMissingCount}
              </p>
            </div>
          </div>

          <div
            className={`rounded-lg border p-4 space-y-3 ${
              data.exitGate.met
                ? 'border-green-900/50 bg-green-950/20'
                : 'border-amber-900/50 bg-amber-950/20'
            }`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  {data.exitGate.met ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  {t('ai.parityExitGateTitle')}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{t('ai.parityExitGateHint')}</p>
              </div>
              <span
                className={`text-sm font-medium ${
                  data.exitGate.met ? 'text-green-300' : 'text-amber-300'
                }`}
              >
                {data.exitGate.met
                  ? t('ai.parityExitGateMet')
                  : t('ai.parityExitGatePending')}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {data.exitGate.criteria.map((criterion) => (
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
                  </p>
                  {criterion.detail ? (
                    <p className="text-xs text-gray-500 mt-1">{criterion.detail}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="py-2 pr-3">{t('ai.parityRole')}</th>
                  <th className="py-2 pr-3">{t('ai.paritySurface')}</th>
                  <th className="py-2 pr-3">{t('ai.parityCoverage')}</th>
                  <th className="py-2 pr-3">{t('ai.parityGaps')}</th>
                  <th className="py-2 pr-3">{t('ai.parityScopeBugs')}</th>
                </tr>
              </thead>
              <tbody>
                {data.byRoleSurface.map((row) => {
                  const rowKey = `${row.tier}-${row.surface}`;
                  const hasDetails = row.gaps.length > 0 || row.scopeBugs.length > 0;
                  const expanded = expandedRow === rowKey;

                  return (
                    <Fragment key={rowKey}>
                      <tr
                        className={`border-b border-gray-800/60 ${
                          hasDetails ? 'cursor-pointer hover:bg-gray-900/40' : ''
                        }`}
                        onClick={() => {
                          if (!hasDetails) return;
                          setExpandedRow(expanded ? null : rowKey);
                        }}
                      >
                        <td className="py-2 pr-3 capitalize">{row.tier}</td>
                        <td className="py-2 pr-3">{row.surface}</td>
                        <td className="py-2 pr-3">
                          {pct(row.coveragePercent)} ({row.coveredCount}/{row.uiActionCount})
                        </td>
                        <td className="py-2 pr-3">{row.gapCount}</td>
                        <td className="py-2 pr-3">{row.scopeBugCount}</td>
                      </tr>
                      {expanded && hasDetails ? (
                        <tr className="border-b border-gray-800/60">
                          <td colSpan={5} className="py-2 pr-3">
                            <div className="rounded-md border border-gray-800 bg-gray-900/50 p-3 text-xs text-gray-400 space-y-2">
                              {row.gaps.length > 0 ? (
                                <div>
                                  <p className="font-medium text-gray-300 mb-1">
                                    {t('ai.parityGapList')}
                                  </p>
                                  <ul className="list-disc pl-5 space-y-0.5">
                                    {row.gaps.map((gap) => (
                                      <li key={gap}>{gap}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                              {row.scopeBugs.length > 0 ? (
                                <div>
                                  <p className="font-medium text-gray-300 mb-1">
                                    {t('ai.parityScopeBugList')}
                                  </p>
                                  <ul className="list-disc pl-5 space-y-0.5">
                                    {row.scopeBugs.map((bug) => (
                                      <li key={bug}>{bug}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 space-y-2">
            <h3 className="text-sm font-semibold text-gray-200">
              {t('ai.parityDivergenceList')}
            </h3>
            {data.allowDenyDivergences.length === 0 ? (
              <p className="text-xs text-gray-500">{t('ai.parityNoDivergences')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-800">
                      <th className="py-1 pr-3">{t('ai.parityDivergenceKind')}</th>
                      <th className="py-1 pr-3">{t('ai.parityRole')}</th>
                      <th className="py-1 pr-3">{t('ai.paritySurface')}</th>
                      <th className="py-1 pr-3">{t('ai.parityIntent')}</th>
                      <th className="py-1 pr-3">{t('ai.parityFeature')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.allowDenyDivergences.map((row, index) => (
                      <tr
                        key={`${row.kind}-${row.tier}-${row.surface}-${row.intentId}-${index}`}
                        className="border-b border-gray-800/60"
                      >
                        <td className="py-1 pr-3">
                          {row.kind === 'under_grant'
                            ? t('ai.parityUnderGrant')
                            : t('ai.parityOverGrantLabel')}
                        </td>
                        <td className="py-1 pr-3 capitalize">{row.tier}</td>
                        <td className="py-1 pr-3">{row.surface}</td>
                        <td className="py-1 pr-3 font-mono">{row.intentId}</td>
                        <td className="py-1 pr-3 font-mono">{row.featureId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            {t('ai.parityGeneratedAt', {
              at: new Date(data.generatedAt).toLocaleString(),
            })}
          </p>
        </>
      )}
    </div>
  );
}
