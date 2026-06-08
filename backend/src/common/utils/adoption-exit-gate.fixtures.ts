/** adopt-6.8 — rolling 30-day adoption program exit gate. */

export const ADOPTION_EXIT_PERIOD_DAYS = 30;
export const ADOPTION_EXIT_ACTIVATION_MIN = 0.6;
export const ADOPTION_EXIT_PUSH_OPT_IN_MIN = 0.8;
export const ADOPTION_EXIT_CRASH_FREE_MIN = 0.995;
export const ADOPTION_EXIT_LOCALE_SPREAD_MAX = 0.03;
export const ADOPTION_EXIT_K_FACTOR_MIN = 0.2;
export const ADOPTION_EXIT_PRIMARY_LOCALES = ['en', 'hy', 'ru'] as const;

export const ADOPTION_EXIT_GATE_SCENARIOS = [
  {
    id: 'all-met',
    input: {
      activationRate: 0.62,
      pushOptInRate: 0.85,
      crashFreeSessionRate: 0.996,
      d30RetentionTrendDelta: 0.02,
      referralKFactorTrendDelta: 0.05,
      localeSpread: 0.02,
      referralKFactor: 0.25,
    },
    expectMet: true,
  },
  {
    id: 'low-activation',
    input: {
      activationRate: 0.55,
      pushOptInRate: 0.85,
      crashFreeSessionRate: 0.996,
      d30RetentionTrendDelta: 0.02,
      referralKFactorTrendDelta: 0.05,
      localeSpread: 0.02,
      referralKFactor: 0.25,
    },
    expectMet: false,
  },
  {
    id: 'retention-flat',
    input: {
      activationRate: 0.62,
      pushOptInRate: 0.85,
      crashFreeSessionRate: 0.996,
      d30RetentionTrendDelta: -0.01,
      referralKFactorTrendDelta: 0.05,
      localeSpread: 0.02,
      referralKFactor: 0.25,
    },
    expectMet: false,
  },
  {
    id: 'locale-spread-wide',
    input: {
      activationRate: 0.62,
      pushOptInRate: 0.85,
      crashFreeSessionRate: 0.996,
      d30RetentionTrendDelta: 0.02,
      referralKFactorTrendDelta: 0.05,
      localeSpread: 0.05,
      referralKFactor: 0.25,
    },
    expectMet: false,
  },
] as const;
