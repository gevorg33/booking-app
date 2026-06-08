'use client';

import { useState } from 'react';
import { AlertTriangle, BarChart3, Loader2, RefreshCw, Target, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import {
  buildActivationNorthStarSummary,
  buildQualifiedActivationSummary,
  buildQualifiedLocaleCohortRows,
  formatLocaleSpreadPoints,
  isLocaleSpreadHealthy,
  type AdoptionActivationView,
} from '@/lib/adoption-activation-display.util';
import {
  formatDeadEndDropRate,
  readQualifiedInstallDeadEndAudit,
  type QualifiedInstallDeadEndAuditView,
} from '@/lib/adoption-dead-end-display.util';
import {
  formatActivationPathDimensionLabel,
  formatActivationPathRate,
  formatActivationPathVariantLabel,
  readActivationPathAbDashboard,
} from '@/lib/adoption-activation-path-ab-display.util';
import {
  formatPushRate,
  hasPushMetricDropAlert,
  isExplicitPushOptInHealthy,
  isPushReachabilityHealthy,
  readPushReachabilityDashboard,
  readPushReachabilityLocaleRows,
  readPushReachabilityPlatformRows,
} from '@/lib/adoption-push-reachability-display.util';
import {
  findWorstDropOffStep,
  formatAdoptionFunnelStepLabel,
  groupAdoptionFunnelBreakdowns,
  type AdoptionFunnelBreakdownView,
  type AdoptionFunnelStepView,
} from '@/lib/adoption-funnel-display.util';
import {
  ADOPTION_RETENTION_METRIC_GROUPS,
  readAdoptionRetentionMetric,
  type AdoptionRetentionView,
} from '@/lib/adoption-retention-display.util';
import {
  ADOPTION_DASHBOARD_PERIOD_OPTIONS,
  formatDashboardMetric,
  hasWeeklyActivationAlert,
  hasWeeklyStartupTtiRegressionAlert,
  isCrashFreeBelowSlo,
  isStartupTtiBelowSlo,
  readHeadlineMetrics,
  type AdoptionDashboardPeriodDays,
  type AdoptionWeeklyAlertView,
  formatExitGateCriterionTarget,
  formatExitGateCriterionValue,
  readExitGateOpenFailures,
} from '@/lib/adoption-dashboard-display.util';

interface AdoptionDashboardData {
  periodDays: number;
  funnel: {
    steps: AdoptionFunnelStepView[];
    breakdowns: AdoptionFunnelBreakdownView[];
  };
  retention: AdoptionRetentionView;
  activation: AdoptionActivationView;
  qualifiedActivation?: AdoptionActivationView;
  coldActivation?: AdoptionActivationView;
  qualifiedActivationCohort?: {
    localeSpread: number;
    insufficientLocales: string[];
    byLocale: Array<{
      locale: string;
      qualified: AdoptionActivationView;
      cold: AdoptionActivationView;
      sufficientSample: boolean;
    }>;
  };
  n99QualifiedExitGate?: {
    met: boolean;
    failures: string[];
    target: number;
    floor: number;
  };
  qualifiedInstallDeadEndAudit?: QualifiedInstallDeadEndAuditView;
  activationPathAb?: {
    promoted: {
      signInPlacement: string;
      slotPreselection: string;
      paymentTiming: string;
    };
    dimensions: Array<{
      dimension: string;
      winner: string;
      promoted: string;
      promotionApplied: boolean;
      scores: Array<{
        variant: string;
        qualifiedInstalls: number;
        qualifiedActivated: number;
        qualifiedActivationRate: number | null;
        sufficientSample: boolean;
      }>;
    }>;
  };
  pushReachability?: {
    reachability: {
      reachabilityRate: number | null;
      reachableUsers: number;
      openedUsers: number;
      target: number;
    };
    explicitOptIn: {
      explicitOptInRate: number | null;
      explicitOptInUsers: number;
      primingShownUsers: number;
      target: number;
    };
    deliverability: {
      deliverabilityRate: number | null;
      deliverySuccesses: number;
      deliveryAttempts: number;
      target: number;
    };
    weeklyReachabilityAlert: {
      triggered: boolean;
      deltaPoints: number;
    };
    weeklyExplicitOptInAlert?: {
      triggered: boolean;
      deltaPoints: number;
    };
    byPlatform?: Record<
      'ios' | 'android',
      { reachabilityRate: number | null; explicitOptInRate: number | null; openedUsers: number }
    >;
    byLocale?: Array<{
      locale: string;
      reachabilityRate: number | null;
      explicitOptInRate: number | null;
      openedUsers: number;
    }>;
  };
  headlines: {
    pushOptInRate: number | null;
    crashFreeSessionRate: number | null;
    crashFreeSessionSloMet: boolean | null;
    startupTtiWithinBudgetRate: number | null;
    startupTtiSloMet: boolean | null;
    referralKFactor: number | null;
  };
  weeklyActivationAlert: AdoptionWeeklyAlertView;
  weeklyStartupTtiRegressionAlert: AdoptionWeeklyAlertView;
  exitGate?: {
    met: boolean;
    failures: string[];
    criteria: Array<{
      id: string;
      label: string;
      value: number;
      target: number;
      met: boolean;
      unit: string;
    }>;
  };
}

function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function dimensionLabel(
  dimension: AdoptionFunnelBreakdownView['dimension'],
  t: (key: string) => string,
): string {
  if (dimension === 'platform') return t('adoption.funnelDimensionPlatform');
  if (dimension === 'locale') return t('adoption.funnelDimensionLocale');
  return t('adoption.funnelDimensionTenant');
}

export function AdoptionDashboardPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [periodDays, setPeriodDays] = useState<AdoptionDashboardPeriodDays>(30);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['adoption-dashboard', business?.id, periodDays],
    queryFn: async () => {
      if (!business?.id) return null;
      const { data: response } = await api.get(
        `/businesses/${business.id}/analytics/adoption`,
        { params: { days: periodDays } },
      );
      return (response.data ?? response) as AdoptionDashboardData;
    },
    enabled: !!business?.id,
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="card flex items-center gap-2 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('adoption.loading')}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card text-red-400">{t('adoption.loadError')}</div>
    );
  }

  const breakdownGroups = groupAdoptionFunnelBreakdowns(data.funnel.breakdowns ?? []);
  const aggregateWorstDropOff = findWorstDropOffStep(data.funnel.steps);
  const activationSummary = buildActivationNorthStarSummary(data.activation);
  const qualifiedSummary = data.qualifiedActivation
    ? buildQualifiedActivationSummary(data.qualifiedActivation)
    : null;
  const deadEndAudit = readQualifiedInstallDeadEndAudit(data.qualifiedInstallDeadEndAudit);
  const activationPathAb = readActivationPathAbDashboard(data);
  const pushReachability = readPushReachabilityDashboard(data);
  const localeCohortRows = data.qualifiedActivationCohort
    ? buildQualifiedLocaleCohortRows(data.qualifiedActivationCohort)
    : [];
  const localeSpreadHealthy = data.qualifiedActivationCohort
    ? isLocaleSpreadHealthy(data.qualifiedActivationCohort.localeSpread)
    : true;
  const headlineMetrics = readHeadlineMetrics(data.headlines);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {ADOPTION_DASHBOARD_PERIOD_OPTIONS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setPeriodDays(days)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                periodDays === days
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {t('adoption.periodDays', { days: String(days) })}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {t('adoption.refresh')}
        </button>
      </div>

      {isCrashFreeBelowSlo(
        data.headlines.crashFreeSessionRate,
        data.headlines.crashFreeSessionSloMet,
      ) && (
        <div className="card border border-red-500/40 bg-red-500/10 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-100">{t('adoption.crashFreeSloAlertTitle')}</p>
            <p className="text-sm text-red-100/80 mt-1">
              {t('adoption.crashFreeSloAlertBody', {
                current: formatDashboardMetric(data.headlines.crashFreeSessionRate),
                target: '99.5%',
              })}
            </p>
          </div>
        </div>
      )}

      {isStartupTtiBelowSlo(
        data.headlines.startupTtiWithinBudgetRate,
        data.headlines.startupTtiSloMet,
      ) && (
        <div className="card border border-orange-500/40 bg-orange-500/10 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-100">{t('adoption.startupTtiSloAlertTitle')}</p>
            <p className="text-sm text-orange-100/80 mt-1">
              {t('adoption.startupTtiSloAlertBody', {
                current: formatDashboardMetric(data.headlines.startupTtiWithinBudgetRate),
                target: '95%',
              })}
            </p>
          </div>
        </div>
      )}

      {hasWeeklyStartupTtiRegressionAlert(data.weeklyStartupTtiRegressionAlert) && (
        <div className="card border border-orange-500/40 bg-orange-500/10 flex items-start gap-3">
          <TrendingDown className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-100">
              {t('adoption.startupTtiRegressionAlertTitle')}
            </p>
            <p className="text-sm text-orange-100/80 mt-1">
              {t('adoption.startupTtiRegressionAlertBody', {
                current: formatDashboardMetric(
                  data.weeklyStartupTtiRegressionAlert.currentWeekRate,
                ),
                previous: formatDashboardMetric(
                  data.weeklyStartupTtiRegressionAlert.previousWeekRate,
                ),
                delta: formatDashboardMetric(
                  data.weeklyStartupTtiRegressionAlert.deltaPoints,
                ),
              })}
            </p>
          </div>
        </div>
      )}

      {hasWeeklyActivationAlert(data.weeklyActivationAlert) && (
        <div className="card border border-amber-500/40 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-100">{t('adoption.activationAlertTitle')}</p>
            <p className="text-sm text-amber-100/80 mt-1">
              {t('adoption.activationAlertBody', {
                current: pct(data.weeklyActivationAlert.currentWeekRate),
                previous: pct(data.weeklyActivationAlert.previousWeekRate),
                delta: pct(data.weeklyActivationAlert.deltaPoints),
              })}
            </p>
          </div>
        </div>
      )}

      {data.exitGate ? (
        <div
          className={`card border ${
            data.exitGate.met
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-amber-500/40 bg-amber-500/10'
          }`}
        >
          <div className="flex items-start gap-3">
            <Target
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                data.exitGate.met ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <div className="flex-1">
              <p className="font-medium">
                {data.exitGate.met
                  ? t('adoption.exitGateMetTitle')
                  : t('adoption.exitGateOpenTitle')}
              </p>
              <p className="text-sm text-gray-400 mt-1">{t('adoption.exitGateSubtitle')}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {data.exitGate.criteria.map((criterion) => (
                  <li
                    key={criterion.id}
                    className={`flex justify-between gap-3 ${
                      criterion.met ? 'text-emerald-200' : 'text-amber-100'
                    }`}
                  >
                    <span>{criterion.label}</span>
                    <span>
                      {formatExitGateCriterionValue(criterion.value, criterion.unit)}
                      {' / '}
                      {formatExitGateCriterionTarget(criterion.target, criterion.unit)}
                    </span>
                  </li>
                ))}
              </ul>
              {readExitGateOpenFailures(data.exitGate).length > 0 ? (
                <ul className="mt-3 text-sm text-amber-100/90 list-disc list-inside">
                  {readExitGateOpenFailures(data.exitGate).map((failure) => (
                    <li key={failure}>{failure}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="card border border-emerald-500/30 bg-emerald-500/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-sm">
              <Target className="h-4 w-4" />
              {t('adoption.activationNorthStar')}
            </div>
            <p className="text-4xl font-semibold mt-2">{activationSummary.rateLabel}</p>
            <p className="text-sm text-gray-300 mt-2">{t('adoption.activationRate')}</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xl">
              {t('adoption.activationDefinition', {
                days: String(activationSummary.windowDays),
              })}
            </p>
          </div>
          <div className="text-sm text-gray-400 md:text-right">
            <p>
              {t('adoption.activationProgress', {
                activated: String(data.activation.activatedCount),
                installed: String(data.activation.installedCount),
              })}
            </p>
            <p className="font-mono mt-1">{activationSummary.progressLabel}</p>
          </div>
        </div>
      </div>

      {qualifiedSummary ? (
        <div className="card border border-sky-500/30 bg-sky-500/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sky-300 text-sm">
                <Target className="h-4 w-4" />
                {t('adoption.qualifiedActivationNorthStar')}
              </div>
              <p className="text-4xl font-semibold mt-2">{qualifiedSummary.rateLabel}</p>
              <p className="text-sm text-gray-300 mt-2">
                {t('adoption.qualifiedActivationTarget', {
                  target: qualifiedSummary.targetLabel,
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-xl">
                {t('adoption.qualifiedActivationDefinition', {
                  days: String(qualifiedSummary.windowDays),
                })}
              </p>
            </div>
            <div className="text-sm text-gray-400 md:text-right">
              <p>
                {t('adoption.activationProgress', {
                  activated: String(data.qualifiedActivation?.activatedCount ?? 0),
                  installed: String(data.qualifiedActivation?.installedCount ?? 0),
                })}
              </p>
              <p className="font-mono mt-1">{qualifiedSummary.progressLabel}</p>
              {data.coldActivation ? (
                <p className="mt-2 text-xs text-gray-500">
                  {t('adoption.coldActivationRate', {
                    rate: pct(data.coldActivation.activationRate),
                    installed: String(data.coldActivation.installedCount),
                  })}
                </p>
              ) : null}
              {data.n99QualifiedExitGate && !data.n99QualifiedExitGate.met ? (
                <p className="mt-2 text-xs text-amber-300">
                  {t('adoption.qualifiedActivationGateOpen')}
                </p>
              ) : null}
              {data.qualifiedActivationCohort ? (
                <p
                  className={`mt-2 text-xs ${
                    localeSpreadHealthy ? 'text-gray-500' : 'text-amber-300'
                  }`}
                >
                  {t('adoption.qualifiedLocaleSpread', {
                    spread: formatLocaleSpreadPoints(
                      data.qualifiedActivationCohort.localeSpread,
                    ),
                    max: '3.0 pts',
                  })}
                </p>
              ) : null}
            </div>
          </div>
          {localeCohortRows.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-2 pr-4">{t('adoption.qualifiedCohortLocale')}</th>
                    <th className="py-2 pr-4">{t('adoption.qualifiedCohortQualified')}</th>
                    <th className="py-2">{t('adoption.qualifiedCohortCold')}</th>
                  </tr>
                </thead>
                <tbody>
                  {localeCohortRows.map((row) => (
                    <tr key={row.locale} className="border-b border-gray-800/80">
                      <td className="py-2 pr-4 font-mono">{row.locale}</td>
                      <td className="py-2 pr-4">
                        {row.sufficientSample
                          ? `${pct(row.qualifiedRate)} (${row.qualifiedProgress})`
                          : t('adoption.qualifiedCohortInsufficientSample')}
                      </td>
                      <td className="py-2">
                        {row.coldInstalled > 0
                          ? `${pct(row.coldRate)} (${row.coldInstalled})`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {deadEndAudit.fixTickets.length > 0 ? (
        <div className="card border border-amber-500/40 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-100">
                {t('adoption.deadEndAuditOpenTitle')}
              </p>
              <p className="text-sm text-amber-100/80 mt-1">
                {t('adoption.deadEndAuditSubtitle', {
                  threshold: formatDeadEndDropRate(deadEndAudit.dropThreshold),
                })}
              </p>
              <ul className="mt-3 space-y-3 text-sm">
                {deadEndAudit.fixTickets.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="rounded-lg border border-amber-500/30 bg-black/20 p-3"
                  >
                    <p className="font-medium text-amber-50">{ticket.title}</p>
                    <p className="text-amber-100/80 mt-1">
                      {t('adoption.deadEndTicketDrop', {
                        dropped: String(ticket.usersDropped),
                        entered: String(ticket.usersEntered),
                        rate: formatDeadEndDropRate(ticket.dropOffRate),
                      })}
                    </p>
                    <p className="text-gray-300 mt-2">{ticket.suggestedFix}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {activationPathAb ? (
        <div className="card">
          <div className="flex items-center gap-2 text-gray-300">
            <BarChart3 className="h-4 w-4" />
            {t('adoption.activationPathAbTitle')}
          </div>
          <p className="text-sm text-gray-500 mt-2">{t('adoption.activationPathAbSubtitle')}</p>
          <p className="text-xs text-gray-500 mt-2">
            {t('adoption.activationPathAbPromoted', {
              signIn: formatActivationPathVariantLabel(
                activationPathAb.promoted.signInPlacement,
              ),
              slot: formatActivationPathVariantLabel(
                activationPathAb.promoted.slotPreselection,
              ),
              payment: formatActivationPathVariantLabel(
                activationPathAb.promoted.paymentTiming,
              ),
            })}
          </p>
          <div className="mt-4 space-y-4">
            {activationPathAb.dimensions.map((dimension) => (
              <div key={dimension.dimension}>
                <p className="text-sm font-medium text-gray-200">
                  {formatActivationPathDimensionLabel(dimension.dimension)}
                </p>
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="py-2 pr-4">{t('adoption.activationPathAbVariant')}</th>
                      <th className="py-2 pr-4">{t('adoption.activationPathAbQualifiedRate')}</th>
                      <th className="py-2">{t('adoption.activationPathAbSample')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dimension.scores.map((score) => (
                      <tr
                        key={`${dimension.dimension}-${score.variant}`}
                        className={`border-b border-gray-800/80 ${
                          score.variant === dimension.promoted ? 'text-emerald-300' : ''
                        }`}
                      >
                        <td className="py-2 pr-4">
                          {formatActivationPathVariantLabel(score.variant)}
                          {score.variant === dimension.promoted ? ' ✓' : ''}
                        </td>
                        <td className="py-2 pr-4 font-mono">
                          {formatActivationPathRate(score.qualifiedActivationRate)}
                        </td>
                        <td className="py-2 font-mono">
                          {score.qualifiedActivated}/{score.qualifiedInstalls}
                          {!score.sufficientSample ? ' *' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {pushReachability ? (
        <div className="card">
          <div className="flex items-center gap-2 text-gray-300">
            <Target className="h-4 w-4" />
            {t('adoption.pushReachabilityTitle')}
          </div>
          <p className="text-sm text-gray-500 mt-2">{t('adoption.pushReachabilitySubtitle')}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-gray-400">{t('adoption.pushReachabilityRate')}</p>
              <p
                className={`text-2xl font-semibold mt-1 ${
                  isPushReachabilityHealthy(
                    pushReachability.reachability.reachabilityRate,
                    pushReachability.reachability.target,
                  )
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }`}
              >
                {formatPushRate(pushReachability.reachability.reachabilityRate)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pushReachability.reachability.reachableUsers}/
                {pushReachability.reachability.openedUsers}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('adoption.pushExplicitOptInRate')}</p>
              <p
                className={`text-2xl font-semibold mt-1 ${
                  isExplicitPushOptInHealthy(
                    pushReachability.explicitOptIn.explicitOptInRate,
                    pushReachability.explicitOptIn.target,
                  )
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }`}
              >
                {formatPushRate(pushReachability.explicitOptIn.explicitOptInRate)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pushReachability.explicitOptIn.explicitOptInUsers}/
                {pushReachability.explicitOptIn.eligibleUsers ??
                  pushReachability.explicitOptIn.primingShownUsers}
              </p>
              <p className="text-xs text-gray-500">
                {t('adoption.pushExplicitOptInTarget', {
                  target: `${(pushReachability.explicitOptIn.target * 100).toFixed(0)}%`,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('adoption.pushDeliverabilityRate')}</p>
              <p className="text-2xl font-semibold mt-1">
                {formatPushRate(pushReachability.deliverability.deliverabilityRate)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pushReachability.deliverability.deliverySuccesses}/
                {pushReachability.deliverability.deliveryAttempts}
              </p>
            </div>
          </div>
          {hasPushMetricDropAlert(pushReachability.weeklyReachabilityAlert) ? (
            <p className="text-xs text-amber-300 mt-3">
              {t('adoption.pushReachabilityAlert', {
                delta: formatPushRate(pushReachability.weeklyReachabilityAlert.deltaPoints),
              })}
            </p>
          ) : null}
          {hasPushMetricDropAlert(pushReachability.weeklyExplicitOptInAlert) ? (
            <p className="text-xs text-amber-300 mt-2">
              {t('adoption.pushExplicitOptInAlert', {
                delta: formatPushRate(pushReachability.weeklyExplicitOptInAlert!.deltaPoints),
              })}
            </p>
          ) : null}
          {readPushReachabilityPlatformRows(pushReachability).length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-200">
                {t('adoption.pushReachabilityByPlatform')}
              </p>
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-2 pr-4">{t('adoption.pushReachabilityPlatform')}</th>
                    <th className="py-2 pr-4">{t('adoption.pushReachabilityRate')}</th>
                    <th className="py-2">{t('adoption.pushExplicitOptInRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {readPushReachabilityPlatformRows(pushReachability).map((row) => (
                    <tr key={row.platform} className="border-b border-gray-800/80">
                      <td className="py-2 pr-4 uppercase">{row.platform}</td>
                      <td className="py-2 pr-4 font-mono">
                        {formatPushRate(row.reachabilityRate)}
                      </td>
                      <td className="py-2 font-mono">{formatPushRate(row.explicitOptInRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {readPushReachabilityLocaleRows(pushReachability).length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-200">
                {t('adoption.pushReachabilityByLocale')}
              </p>
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-2 pr-4">{t('adoption.pushReachabilityLocale')}</th>
                    <th className="py-2 pr-4">{t('adoption.pushReachabilityRate')}</th>
                    <th className="py-2">{t('adoption.pushExplicitOptInRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {readPushReachabilityLocaleRows(pushReachability).map((row) => (
                    <tr key={row.locale} className="border-b border-gray-800/80">
                      <td className="py-2 pr-4 uppercase">{row.locale}</td>
                      <td className="py-2 pr-4 font-mono">
                        {formatPushRate(row.reachabilityRate)}
                      </td>
                      <td className="py-2 font-mono">{formatPushRate(row.explicitOptInRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {headlineMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            label={
              metric.id === 'pushOptIn'
                ? t('adoption.pushOptIn')
                : metric.id === 'crashFree'
                  ? t('adoption.crashFree')
                  : metric.id === 'startupTti'
                    ? t('adoption.startupTti')
                    : t('adoption.referralK')
            }
            value={metric.value}
            belowSlo={metric.sloMet === false}
          />
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold">{t('adoption.funnelTitle')}</h3>
          <span className="text-xs text-gray-500 ml-auto">{data.periodDays}d</span>
        </div>
        {aggregateWorstDropOff?.dropOffFromPrevious != null && (
          <p className="text-xs text-amber-300/90 mb-4">
            {t('adoption.funnelWorstDropOff', {
              step: formatAdoptionFunnelStepLabel(aggregateWorstDropOff.step),
              rate: pct(aggregateWorstDropOff.dropOffFromPrevious),
            })}
          </p>
        )}
        <FunnelStepTable steps={data.funnel.steps} t={t} />
      </div>

      {breakdownGroups.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-orange-400" />
            <h3 className="font-semibold">{t('adoption.funnelBreakdownTitle')}</h3>
          </div>
          <div className="space-y-6">
            {breakdownGroups.map((group) => (
              <div key={group.dimension}>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                  {dimensionLabel(group.dimension, t)}
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                  {group.items.map((item) => {
                    const worst = findWorstDropOffStep(item.steps);
                    return (
                      <div
                        key={`${group.dimension}-${item.value}`}
                        className="rounded-lg border border-gray-800 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-200">{item.value}</p>
                          {worst?.dropOffFromPrevious != null && (
                            <span className="text-xs text-orange-300">
                              {t('adoption.funnelSegmentDropOff', {
                                step: formatAdoptionFunnelStepLabel(worst.step),
                                rate: pct(worst.dropOffFromPrevious),
                              })}
                            </span>
                          )}
                        </div>
                        <FunnelStepTable steps={item.steps} t={t} compact />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold">{t('adoption.retentionTitle')}</h3>
          <span className="text-xs text-gray-500 ml-auto">
            {t('adoption.retentionCohortSize', { size: String(data.retention.cohortSize) })}
          </span>
        </div>
        <div className="space-y-5 mt-4">
          {ADOPTION_RETENTION_METRIC_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                {group.id === 'return'
                  ? t('adoption.retentionReturnTitle')
                  : group.id === 'rebook'
                    ? t('adoption.retentionRebookTitle')
                    : t('adoption.retentionWinBackTitle')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                {group.metrics.map((metric) => (
                  <RetentionMetric
                    key={metric.key}
                    label={t(metric.labelKey)}
                    value={readAdoptionRetentionMetric(data.retention, metric.key)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FunnelStepTable({
  steps,
  t,
  compact = false,
}: {
  steps: AdoptionFunnelStepView[];
  t: (key: string, params?: Record<string, string>) => string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      {!compact && (
        <div className="grid grid-cols-[9rem_3rem_1fr_4rem_4rem] gap-3 text-xs text-gray-500 px-0.5">
          <span>{t('adoption.funnelStep')}</span>
          <span className="text-right">{t('adoption.funnelUsers')}</span>
          <span />
          <span className="text-right">{t('adoption.funnelConversion')}</span>
          <span className="text-right">{t('adoption.funnelDropOff')}</span>
        </div>
      )}
      {steps.map((step) => (
        <div
          key={step.step}
          className={`grid items-center gap-3 text-sm ${
            compact
              ? 'grid-cols-[7rem_2.5rem_1fr_3.5rem_3.5rem]'
              : 'grid-cols-[9rem_3rem_1fr_4rem_4rem]'
          }`}
        >
          <span className="text-gray-300 truncate">
            {formatAdoptionFunnelStepLabel(step.step)}
          </span>
          <span className="text-right font-mono">{step.count}</span>
          <div className="h-2 rounded bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-blue-500/70"
              style={{
                width: `${Math.max(4, (step.conversionFromPrevious ?? 0) * 100)}%`,
              }}
            />
          </div>
          <span className="text-right text-gray-400">
            {step.conversionFromPrevious == null ? '—' : pct(step.conversionFromPrevious)}
          </span>
          <span
            className={`text-right ${
              step.dropOffFromPrevious != null && step.dropOffFromPrevious > 0
                ? 'text-orange-300'
                : 'text-gray-500'
            }`}
          >
            {step.dropOffFromPrevious == null ? '—' : pct(step.dropOffFromPrevious)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  belowSlo = false,
}: {
  label: string;
  value: number | null;
  belowSlo?: boolean;
}) {
  return (
    <div className={`card ${belowSlo ? 'border border-red-500/40' : ''}`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-2xl font-semibold mt-2 ${belowSlo ? 'text-red-300' : ''}`}>
        {formatDashboardMetric(value)}
      </p>
    </div>
  );
}

function RetentionMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-800 px-3 py-2">
      <p className="text-gray-400">{label}</p>
      <p className="font-mono mt-1">{pct(value)}</p>
    </div>
  );
}
