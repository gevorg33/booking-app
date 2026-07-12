/** ai-cmd-provider-5.3.6 — collect the outstanding balance at the chair (thin alias to mark_paid; no Stripe Terminal integration exists). */

export const PROVIDER_COLLECT_REMAINING_BALANCE_CLASSIFIER_RULES = `- collect_remaining_balance: MUTATE — provider mobile only: collect the outstanding balance on a single booking at the chair (deposit already paid, rest due now). No Stripe Terminal integration exists — same manual mark-paid mutation as mark_paid, just phrased as "charge/collect the rest". Requires bookingId (session) and/or customerName. Triggers: charge the balance on file, collect rest at chair, take the remaining payment. NOT mark_paid (full amount, not a remaining balance), NOT payment_sweep (bulk), NOT explain_deposit_balance_due (read-only balance question).`;

export const PROVIDER_COLLECT_REMAINING_BALANCE_PROMPT_SCENARIOS = [
  {
    id: 'collect-remaining-balance-charge-file-en',
    prompt: 'Charge the balance on file',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-collect-chair-en',
    prompt: 'Collect rest at chair',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-charge-remaining-en',
    prompt: 'Charge the remaining balance',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-collect-outstanding-en',
    prompt: 'Collect the outstanding balance now',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-charge-card-en',
    prompt: 'Charge her card for the rest of the balance',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-take-remaining-en',
    prompt: 'Take the remaining balance now',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-collect-rest-payment-en',
    prompt: 'Collect the rest of the outstanding balance',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-charge-due-en',
    prompt: 'Charge the outstanding balance due',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-collect-emma-en',
    prompt: "Collect Emma's remaining balance",
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-charge-now-en',
    prompt: 'Charge the remaining amount now',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-hy',
    prompt: 'Գանձիր մնացորդը',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-jane-hy',
    prompt: 'Գանձիր Jane-ի մնացորդը',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-ru',
    prompt: 'Спиши остаток',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
  {
    id: 'collect-remaining-balance-jane-ru',
    prompt: 'Спиши остаток по Jane',
    surface: 'provider' as const,
    expectedAction: 'collect_remaining_balance',
  },
] as const;
