import {
  ADOPTION_EXIT_ACTIVATION_MIN,
  ADOPTION_EXIT_CRASH_FREE_MIN,
  ADOPTION_EXIT_K_FACTOR_MIN,
  ADOPTION_EXIT_LOCALE_SPREAD_MAX,
  ADOPTION_EXIT_PERIOD_DAYS,
  ADOPTION_EXIT_PRIMARY_LOCALES,
  ADOPTION_EXIT_PUSH_OPT_IN_MIN,
} from './adoption-exit-gate.fixtures.js';

export {
  ADOPTION_EXIT_ACTIVATION_MIN,
  ADOPTION_EXIT_CRASH_FREE_MIN,
  ADOPTION_EXIT_GATE_SCENARIOS,
  ADOPTION_EXIT_K_FACTOR_MIN,
  ADOPTION_EXIT_LOCALE_SPREAD_MAX,
  ADOPTION_EXIT_PERIOD_DAYS,
  ADOPTION_EXIT_PRIMARY_LOCALES,
  ADOPTION_EXIT_PUSH_OPT_IN_MIN,
} from './adoption-exit-gate.fixtures.js';

export interface AdoptionExitGateInput {
  activationRate: number;
  pushOptInRate: number;
  crashFreeSessionRate: number;
  d30RetentionTrendDelta: number;
  referralKFactorTrendDelta: number;
  localeSpread: number;
  referralKFactor: number;
}

export interface AdoptionExitGateCriterion {
  id:
    | 'activation'
    | 'push_opt_in'
    | 'crash_free'
    | 'd30_retention_trend'
    | 'referral_k_trend'
    | 'locale_parity'
    | 'referral_k_factor';
  label: string;
  value: number;
  target: number;
  comparator: 'gte' | 'lte';
  met: boolean;
  unit: 'percent' | 'points' | 'ratio';
  detail?: string;
}

export interface AdoptionExitGateResult extends AdoptionExitGateInput {
  periodDays: number;
  met: boolean;
  failures: string[];
  criteria: AdoptionExitGateCriterion[];
}

export function computeLocaleActivationSpread(
  byLocale: Record<string, { activationRate: number; installs: number }>,
  minInstalls = 5,
): number {
  const rates = ADOPTION_EXIT_PRIMARY_LOCALES.map((locale) => byLocale[locale])
    .filter((row) => row && row.installs >= minInstalls)
    .map((row) => row.activationRate);
  if (rates.length < 2) return 0;
  return Math.max(...rates) - Math.min(...rates);
}

export function buildAdoptionExitGate(
  input: AdoptionExitGateInput,
): AdoptionExitGateResult {
  const criteria: AdoptionExitGateCriterion[] = [
    {
      id: 'activation',
      label: 'Install → activation (7d)',
      value: input.activationRate,
      target: ADOPTION_EXIT_ACTIVATION_MIN,
      comparator: 'gte',
      met: input.activationRate >= ADOPTION_EXIT_ACTIVATION_MIN,
      unit: 'percent',
    },
    {
      id: 'push_opt_in',
      label: 'Push opt-in (after priming)',
      value: input.pushOptInRate,
      target: ADOPTION_EXIT_PUSH_OPT_IN_MIN,
      comparator: 'gte',
      met: input.pushOptInRate >= ADOPTION_EXIT_PUSH_OPT_IN_MIN,
      unit: 'percent',
    },
    {
      id: 'crash_free',
      label: 'Crash-free sessions',
      value: input.crashFreeSessionRate,
      target: ADOPTION_EXIT_CRASH_FREE_MIN,
      comparator: 'gte',
      met: input.crashFreeSessionRate >= ADOPTION_EXIT_CRASH_FREE_MIN,
      unit: 'percent',
    },
    {
      id: 'd30_retention_trend',
      label: 'D30 retention trend',
      value: input.d30RetentionTrendDelta,
      target: 0,
      comparator: 'gte',
      met: input.d30RetentionTrendDelta > 0,
      unit: 'points',
    },
    {
      id: 'referral_k_trend',
      label: 'Referral K-factor trend',
      value: input.referralKFactorTrendDelta,
      target: 0,
      comparator: 'gte',
      met: input.referralKFactorTrendDelta > 0,
      unit: 'points',
    },
    {
      id: 'locale_parity',
      label: 'Locale activation spread (EN/HY/RU)',
      value: input.localeSpread,
      target: ADOPTION_EXIT_LOCALE_SPREAD_MAX,
      comparator: 'lte',
      met: input.localeSpread <= ADOPTION_EXIT_LOCALE_SPREAD_MAX,
      unit: 'points',
    },
    {
      id: 'referral_k_factor',
      label: 'Referral K-factor',
      value: input.referralKFactor,
      target: ADOPTION_EXIT_K_FACTOR_MIN,
      comparator: 'gte',
      met: input.referralKFactor >= ADOPTION_EXIT_K_FACTOR_MIN,
      unit: 'ratio',
    },
  ];

  const failures = criteria.filter((c) => !c.met).map((c) => c.label);
  return {
    ...input,
    periodDays: ADOPTION_EXIT_PERIOD_DAYS,
    met: failures.length === 0,
    failures,
    criteria,
  };
}
