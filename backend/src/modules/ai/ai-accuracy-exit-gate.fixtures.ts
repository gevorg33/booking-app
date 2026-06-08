/** acc-6.8 — rolling 30-day program exit gate. */
export const ACCURACY_EXIT_NO_CLARIFY_MIN = 0.9;
export const ACCURACY_EXIT_ACCURATE_MIN = 0.99;
export const ACCURACY_EXIT_WRONG_EXEC_MAX = 0.01;
export const ACCURACY_EXIT_LOCALE_SPREAD_MAX = 0.03;
export const ACCURACY_EXIT_LOCALE_MIN_SAMPLES = 5;
export const ACCURACY_EXIT_PRIMARY_LOCALES = ['en', 'hy', 'ru'] as const;

export const ACCURACY_EXIT_GATE_SCENARIOS = [
  {
    id: 'all-met',
    input: {
      noClarifyCompletionRate: 0.91,
      accurateRate: 0.995,
      wrongExecutionRate: 0.005,
      localeSpread: 0.02,
    },
    expectMet: true,
  },
  {
    id: 'low-no-clarify',
    input: {
      noClarifyCompletionRate: 0.82,
      accurateRate: 0.995,
      wrongExecutionRate: 0.005,
      localeSpread: 0.01,
    },
    expectMet: false,
  },
  {
    id: 'low-completion-plus-good-clarify',
    input: {
      noClarifyCompletionRate: 0.92,
      accurateRate: 0.975,
      wrongExecutionRate: 0.004,
      localeSpread: 0.01,
    },
    expectMet: false,
  },
  {
    id: 'wrong-execution-over',
    input: {
      noClarifyCompletionRate: 0.92,
      accurateRate: 0.992,
      wrongExecutionRate: 0.015,
      localeSpread: 0.01,
    },
    expectMet: false,
  },
  {
    id: 'locale-spread-too-wide',
    input: {
      noClarifyCompletionRate: 0.92,
      accurateRate: 0.992,
      wrongExecutionRate: 0.004,
      localeSpread: 0.05,
    },
    expectMet: false,
  },
  {
    id: 'locale-insufficient-samples',
    input: {
      noClarifyCompletionRate: 0.92,
      accurateRate: 0.992,
      wrongExecutionRate: 0.004,
      localeSpread: 0.01,
      insufficientLocales: ['hy', 'ru'],
    },
    expectMet: false,
  },
] as const;
