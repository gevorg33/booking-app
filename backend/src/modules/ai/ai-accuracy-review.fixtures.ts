/** acc-6.1 — weekly internal accuracy review digest thresholds. */
export const ACCURACY_REVIEW_LOCALE_GAP_ALERT = 0.03;
export const ACCURACY_REVIEW_CONFUSION_TOP_N = 5;
export const ACCURACY_REVIEW_WORST_PROMPTS_TOP_N = 10;

export const ACCURACY_REVIEW_SCENARIOS = [
  {
    id: 'flags-locale-gap',
    current: {
      byLocale: {
        en: { total: 100, accurate: 95 },
        hy: { total: 50, accurate: 40 },
      },
    },
    expectLocaleAlerts: 1,
  },
] as const;
