import type { AiAccuracyAnalyticsSummary } from './ai-platform.util.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';
import { computeClarifyQualityMetrics } from './ai-clarify-quality.util.js';
import {
  ACCURACY_EXIT_ACCURATE_MIN,
  ACCURACY_EXIT_GATE_SCENARIOS,
  ACCURACY_EXIT_LOCALE_MIN_SAMPLES,
  ACCURACY_EXIT_LOCALE_SPREAD_MAX,
  ACCURACY_EXIT_NO_CLARIFY_MIN,
  ACCURACY_EXIT_PRIMARY_LOCALES,
  ACCURACY_EXIT_WRONG_EXEC_MAX,
} from './ai-accuracy-exit-gate.fixtures.js';

export {
  ACCURACY_EXIT_ACCURATE_MIN,
  ACCURACY_EXIT_GATE_SCENARIOS,
  ACCURACY_EXIT_LOCALE_MIN_SAMPLES,
  ACCURACY_EXIT_LOCALE_SPREAD_MAX,
  ACCURACY_EXIT_NO_CLARIFY_MIN,
  ACCURACY_EXIT_PRIMARY_LOCALES,
  ACCURACY_EXIT_WRONG_EXEC_MAX,
} from './ai-accuracy-exit-gate.fixtures.js';

export interface AccuracyExitGateInput {
  noClarifyCompletionRate: number;
  accurateRate: number;
  wrongExecutionRate: number;
  localeSpread: number;
  insufficientLocales?: string[];
}

export interface AccuracyExitGateCriterion {
  id: 'no_clarify' | 'completion_plus_good_clarify' | 'wrong_execution' | 'locale_parity';
  label: string;
  value: number;
  target: number;
  comparator: 'gte' | 'lte';
  met: boolean;
  unit: 'percent' | 'points';
  detail?: string;
}

export interface AccuracyExitGateResult extends AccuracyExitGateInput {
  periodDays: number;
  met: boolean;
  failures: string[];
  criteria: AccuracyExitGateCriterion[];
}

export function computeLocaleAccuracySpread(
  byLocale: AiAccuracyAnalyticsSummary['byLocale'],
): number {
  const rates = Object.values(byLocale)
    .filter((stats) => stats.total >= ACCURACY_EXIT_LOCALE_MIN_SAMPLES)
    .map((stats) => (stats.total ? stats.accurate / stats.total : 0));
  if (rates.length < 2) return 0;
  return Math.max(...rates) - Math.min(...rates);
}

/** acc-6.8 — spread among en/hy/ru when each has enough samples. */
export function computePrimaryLocaleSpread(
  byLocale: AiAccuracyAnalyticsSummary['byLocale'],
): { spread: number; insufficientLocales: string[]; localeRates: Record<string, number> } {
  const localeRates: Record<string, number> = {};
  const insufficientLocales: string[] = [];

  for (const locale of ACCURACY_EXIT_PRIMARY_LOCALES) {
    const stats = byLocale[locale];
    if (!stats || stats.total < ACCURACY_EXIT_LOCALE_MIN_SAMPLES) {
      insufficientLocales.push(locale);
      continue;
    }
    localeRates[locale] = stats.accurate / stats.total;
  }

  if (insufficientLocales.length > 0) {
    return { spread: Number.POSITIVE_INFINITY, insufficientLocales, localeRates };
  }

  const rates = ACCURACY_EXIT_PRIMARY_LOCALES.map((locale) => localeRates[locale]);
  return {
    spread: Math.max(...rates) - Math.min(...rates),
    insufficientLocales,
    localeRates,
  };
}

export function computeWrongExecutionRate(
  rows: Array<{ failureSignal?: string | null; feedbackRating?: string | null }>,
): number {
  const total = rows.length;
  if (!total) return 0;
  const wrong = rows.filter(
    (row) =>
      row.failureSignal === 'wrong_execution' || row.feedbackRating === 'down',
  ).length;
  return wrong / total;
}

/** acc-6.8 — (direct completion + good-clarify) / commands. */
export function computeCompletionPlusGoodClarifyRate(
  rows: AiTraceAnalyticsRow[],
): number {
  if (!rows.length) return 0;

  const goodClarifyIds = new Set(
    computeClarifyQualityMetrics(rows)
      .pairs.filter((pair) => pair.outcome === 'success')
      .map((pair) => pair.clarify.traceId),
  );

  let accurate = 0;
  for (const row of rows) {
    if (row.failureSignal || row.feedbackRating === 'down') continue;
    if (row.outcome === 'executed' || row.outcome === 'approval') {
      accurate += 1;
      continue;
    }
    if (row.outcome === 'security_blocked') {
      accurate += 1;
      continue;
    }
    if (row.outcome === 'clarified' && goodClarifyIds.has(row.traceId)) {
      accurate += 1;
    }
  }

  return accurate / rows.length;
}

function buildExitGateCriteria(
  input: AccuracyExitGateInput,
): AccuracyExitGateCriterion[] {
  const localeMet =
    (input.insufficientLocales?.length ?? 0) === 0 &&
    input.localeSpread - 1e-9 <= ACCURACY_EXIT_LOCALE_SPREAD_MAX;

  return [
    {
      id: 'no_clarify',
      label: 'No-clarify completion',
      value: input.noClarifyCompletionRate,
      target: ACCURACY_EXIT_NO_CLARIFY_MIN,
      comparator: 'gte',
      met: input.noClarifyCompletionRate + 1e-9 >= ACCURACY_EXIT_NO_CLARIFY_MIN,
      unit: 'percent',
      detail: `≥ ${ACCURACY_EXIT_NO_CLARIFY_MIN * 100}% of commands complete without clarify`,
    },
    {
      id: 'completion_plus_good_clarify',
      label: 'Completion + good-clarify',
      value: input.accurateRate,
      target: ACCURACY_EXIT_ACCURATE_MIN,
      comparator: 'gte',
      met: input.accurateRate + 1e-9 >= ACCURACY_EXIT_ACCURATE_MIN,
      unit: 'percent',
      detail: `≥ ${ACCURACY_EXIT_ACCURATE_MIN * 100}% direct completion or clarify resolved on next turn`,
    },
    {
      id: 'wrong_execution',
      label: 'Wrong-execution rate',
      value: input.wrongExecutionRate,
      target: ACCURACY_EXIT_WRONG_EXEC_MAX,
      comparator: 'lte',
      met: input.wrongExecutionRate - 1e-9 <= ACCURACY_EXIT_WRONG_EXEC_MAX,
      unit: 'percent',
      detail: `< ${ACCURACY_EXIT_WRONG_EXEC_MAX * 100}% undo / thumbs-down signals`,
    },
    {
      id: 'locale_parity',
      label: 'Locale parity (EN/HY/RU)',
      value: Number.isFinite(input.localeSpread) ? input.localeSpread : 0,
      target: ACCURACY_EXIT_LOCALE_SPREAD_MAX,
      comparator: 'lte',
      met: localeMet,
      unit: 'points',
      detail:
        input.insufficientLocales && input.insufficientLocales.length > 0
          ? `Need ≥ ${ACCURACY_EXIT_LOCALE_MIN_SAMPLES} commands each in ${input.insufficientLocales.join(', ')}`
          : `EN, HY, RU within ${ACCURACY_EXIT_LOCALE_SPREAD_MAX * 100} pts`,
    },
  ];
}

export function evaluateAccuracyExitGate(
  input: AccuracyExitGateInput,
  periodDays = 30,
): AccuracyExitGateResult {
  const criteria = buildExitGateCriteria(input);
  const failures = criteria
    .filter((criterion) => !criterion.met)
    .map((criterion) => {
      if (criterion.id === 'locale_parity' && input.insufficientLocales?.length) {
        return `locale parity — insufficient samples for ${input.insufficientLocales.join(', ')} (need ${ACCURACY_EXIT_LOCALE_MIN_SAMPLES}+ each)`;
      }
      if (criterion.comparator === 'gte') {
        return `${criterion.label} ${(criterion.value * 100).toFixed(1)}% < ${criterion.target * 100}%`;
      }
      if (criterion.unit === 'points') {
        return `${criterion.label} ${(criterion.value * 100).toFixed(1)} pts > ${criterion.target * 100} pts`;
      }
      return `${criterion.label} ${(criterion.value * 100).toFixed(1)}% > ${criterion.target * 100}%`;
    });

  return {
    ...input,
    periodDays,
    met: failures.length === 0,
    failures,
    criteria,
  };
}

export function buildAccuracyExitGateFromAnalytics(
  analytics: AiAccuracyAnalyticsSummary,
  rows: AiTraceAnalyticsRow[],
): AccuracyExitGateResult {
  const locale = computePrimaryLocaleSpread(analytics.byLocale);

  return evaluateAccuracyExitGate(
    {
      noClarifyCompletionRate: analytics.noClarifyCompletionRate,
      accurateRate: computeCompletionPlusGoodClarifyRate(rows),
      wrongExecutionRate: computeWrongExecutionRate(rows),
      localeSpread: locale.spread,
      insufficientLocales:
        locale.insufficientLocales.length > 0 ? locale.insufficientLocales : undefined,
    },
    analytics.periodDays,
  );
}
