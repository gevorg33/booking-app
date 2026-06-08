'use client';

import { AlertTriangle, Gauge, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface SloTrendPoint {
  date: string;
  accuracy: number;
  total: number;
}

interface AccuracySloExport {
  periodDays: number;
  target: number;
  rolling7DayAccuracy: number;
  previous7DayAccuracy: number;
  weeklyDelta: number;
  gapToTarget: number;
  meetsTarget: boolean;
  alert: boolean;
  rolling7CommandCount: number;
  trend: SloTrendPoint[];
}

function pct(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatDelta(value: number) {
  const points = Math.round(value * 100);
  return `${points >= 0 ? '+' : ''}${points} pts`;
}

function formatShortDate(isoDate: string) {
  const [, month, day] = isoDate.split('-');
  return `${month}/${day}`;
}

function SloTrendChart({
  trend,
  target,
  targetLabel,
}: {
  trend: SloTrendPoint[];
  target: number;
  targetLabel: string;
}) {
  const width = 560;
  const height = 140;
  const padX = 28;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const values = trend.map((point) => point.accuracy);
  const minY = Math.max(0, Math.min(...values, target) - 0.05);
  const maxY = Math.min(1, Math.max(...values, target) + 0.02);

  const xAt = (index: number) =>
    padX + (trend.length <= 1 ? chartW / 2 : (index / (trend.length - 1)) * chartW);
  const yAt = (accuracy: number) =>
    padY + chartH - ((accuracy - minY) / (maxY - minY || 1)) * chartH;

  const points = trend
    .map((point, index) => `${xAt(index)},${yAt(point.accuracy)}`)
    .join(' ');
  const targetY = yAt(target);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={targetLabel}
      >
        <line
          x1={padX}
          y1={targetY}
          x2={width - padX}
          y2={targetY}
          stroke="rgb(56 189 248 / 0.45)"
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <polyline
          fill="none"
          stroke="rgb(74 222 128)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
        {trend.map((point, index) => (
          <g key={point.date}>
            <circle
              cx={xAt(index)}
              cy={yAt(point.accuracy)}
              r={4}
              fill="rgb(74 222 128)"
              stroke="rgb(17 24 39)"
              strokeWidth={2}
            />
            <text
              x={xAt(index)}
              y={height - 2}
              textAnchor="middle"
              className="fill-gray-500 text-[10px]"
            >
              {formatShortDate(point.date)}
            </text>
          </g>
        ))}
        <text x={padX} y={targetY - 4} className="fill-sky-400 text-[10px]">
          {targetLabel}
        </text>
      </svg>
    </div>
  );
}

export function AiAccuracySloPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-accuracy-slo', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/ai/accuracy/slo?days=30`,
      );
      return (res.data ?? res) as AccuracySloExport;
    },
    enabled: !!business?.id,
    staleTime: 120_000,
  });

  if (!business) return null;

  const deltaPositive = (data?.weeklyDelta ?? 0) >= 0;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-400" />
            {t('ai.accuracySloTitle')}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{t('ai.accuracySloSubtitle')}</p>
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
      ) : !data ? (
        <p className="text-sm text-gray-500">{t('ai.accuracyEmpty')}</p>
      ) : (
        <>
          {data.alert && (
            <div className="rounded-lg border border-amber-800 bg-amber-950/30 px-3 py-2 text-sm text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{t('ai.accuracySloAlert')}</span>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <p
                  className={`text-4xl font-bold tabular-nums ${
                    data.meetsTarget ? 'text-green-400' : 'text-amber-400'
                  }`}
                >
                  {pct(data.rolling7DayAccuracy, 1)}
                </p>
                <p className="text-sm text-gray-500 pb-1">
                  {t('ai.accuracySloVsTarget', { target: pct(data.target) })}
                </p>
              </div>

              <div className="space-y-1">
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.meetsTarget ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, data.rolling7DayAccuracy * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>0%</span>
                  <span>{pct(data.target)}</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                    data.meetsTarget
                      ? 'bg-green-950/50 text-green-300 border border-green-900'
                      : 'bg-amber-950/50 text-amber-300 border border-amber-900'
                  }`}
                >
                  {data.meetsTarget ? t('ai.accuracySloMet') : t('ai.accuracySloMiss')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-gray-900/60 text-gray-300 border border-gray-800">
                  {t('ai.accuracySloGap', { gap: formatDelta(data.gapToTarget) })}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 border ${
                    deltaPositive
                      ? 'bg-green-950/40 text-green-300 border-green-900'
                      : 'bg-red-950/40 text-red-300 border-red-900'
                  }`}
                >
                  {deltaPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {t('ai.accuracySloWeeklyDelta', { delta: formatDelta(data.weeklyDelta) })}
                </span>
              </div>

              <p className="text-xs text-gray-500">
                {t('ai.accuracySloPreviousWeek', {
                  value: pct(data.previous7DayAccuracy, 1),
                })}
                {' · '}
                {t('ai.accuracySloCommandCount', {
                  count: String(data.rolling7CommandCount),
                })}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">{t('ai.accuracySloTrendTitle')}</h3>
              <SloTrendChart
                trend={data.trend}
                target={data.target}
                targetLabel={t('ai.accuracySloTargetLine')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
