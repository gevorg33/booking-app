/** ai-cmd-provider-5.3.1 — provider mobile "mark paid" single-booking payment shortcut. */

export const PROVIDER_MARK_PAID_CLASSIFIER_RULES = `- mark_paid: MUTATE — provider mobile only: same outcome as tapping Mark paid on a new-booking push — single booking only. Requires bookingId (session) and/or customerName. Triggers: mark Jane paid cash, mark this booking paid, payment received, mark payment as complete. NOT payment_sweep (bulk day sweep), NOT collect_cash_confirm (cash-collection queue confirmation).`;

export const PROVIDER_MARK_PAID_PROMPT_SCENARIOS = [
  {
    id: 'mark-paid-jane-cash-en',
    prompt: 'Mark Jane paid cash',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-this-booking-en',
    prompt: 'Mark this booking paid',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-payment-received-en',
    prompt: 'Mark payment received',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-payment-complete-en',
    prompt: 'Mark payment as complete',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-booking-en',
    prompt: 'Mark booking paid',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-sam-en',
    prompt: "Mark Sam's appointment paid",
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-payment-done-en',
    prompt: 'Mark the payment done',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-cash-collected-en',
    prompt: 'Mark this as paid — collected cash',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-client-en',
    prompt: 'Mark this client paid',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-emma-en',
    prompt: 'Mark Emma paid for her visit',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-cash-voice-en',
    prompt: 'Mark paid cash',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-hy',
    prompt: 'Նշիր որպես վճարված',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-jane-hy',
    prompt: 'Նշիր Jane-ին որպես վճարված',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-ru',
    prompt: 'Отметь как оплачено',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
  {
    id: 'mark-paid-jane-ru',
    prompt: 'Отметь Jane как оплатившую',
    surface: 'provider' as const,
    expectedAction: 'mark_paid',
  },
] as const;
