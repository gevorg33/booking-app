/** ai-cmd-provider-5.3.2 — provider mobile bulk "payment sweep" for unpaid appointments. */

export const PROVIDER_PAYMENT_SWEEP_CLASSIFIER_RULES = `- payment_sweep: MUTATE — provider mobile only: mark unpaid appointments as paid for a day or range (own calendar; team scope for managers). Triggers: mark all today paid, sweep unpaid from today, run payment sweep, collect all outstanding payments. NOT mark_paid (single booking).`;

export const PROVIDER_PAYMENT_SWEEP_PROMPT_SCENARIOS = [
  {
    id: 'payment-sweep-run-today-en',
    prompt: 'Run payment sweep for today',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-unpaid-from-today-en',
    prompt: 'Sweep unpaid from today',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-collect-outstanding-en',
    prompt: 'Collect all outstanding payments',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-mark-unpaid-paid-en',
    prompt: 'Mark all unpaid bookings as paid',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-todays-unpaid-en',
    prompt: "Sweep today's unpaid bookings",
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-collect-for-day-en',
    prompt: 'Collect payment sweep for the day',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-clear-outstanding-en',
    prompt: 'Clear outstanding payment for today',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-do-now-en',
    prompt: 'Do a payment sweep now',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-collect-all-unpaid-en',
    prompt: 'Collect payment for all unpaid bookings',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-please-en',
    prompt: 'Payment sweep please',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-collect-hy',
    prompt: 'Հավաքիր բոլոր չվճարվածները այսօրվա համար',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-sweep-hy',
    prompt: 'Ավլիր չվճարված գումարները այսօր',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-collect-ru',
    prompt: 'Собери все неоплаченные платежи за сегодня',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
  {
    id: 'payment-sweep-sweep-ru',
    prompt: 'Проведи сбор неоплаченных платежей',
    surface: 'provider' as const,
    expectedAction: 'payment_sweep',
  },
] as const;
