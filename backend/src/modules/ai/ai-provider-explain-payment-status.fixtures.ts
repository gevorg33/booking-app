/** ai-cmd-provider-5.17.2 — provider mobile: explain why a booking's payment status is what it is. */

export const PROVIDER_EXPLAIN_PAYMENT_STATUS_CLASSIFIER_RULES = `- explain_payment_status (provider): READ — provider mobile only: explain a booking's current payment status (paid/pending/cash due), including why it's still pending after an online payment attempt, or why cash is still owed despite an online payment. Requires bookingId (session) and/or customerName. Triggers: why still pending after Stripe, she paid online — why cash due, what's the payment status. NOT explain_why_stripe_required (why the booking requires online payment at all, not its current status), NOT explain_booking_payment_breakdown (full itemized line-by-line breakdown), NOT explain_appointment_tax (tax lines only).`;

export const PROVIDER_EXPLAIN_PAYMENT_STATUS_PROMPT_SCENARIOS = [
  {
    id: 'explain-payment-status-still-pending-stripe-en',
    prompt: 'Why still pending after Stripe?',
    surface: 'provider' as const,
    expectedAction: 'explain_payment_status',
  },
  {
    id: 'explain-payment-status-paid-online-cash-due-en',
    prompt: 'She paid online — why cash due?',
    surface: 'provider' as const,
    expectedAction: 'explain_payment_status',
  },
  {
    id: 'explain-payment-status-whats-status-en',
    prompt: "What's the payment status on this booking?",
    surface: 'provider' as const,
    expectedAction: 'explain_payment_status',
  },
  {
    id: 'explain-payment-status-explain-en',
    prompt: 'Explain payment status for this appointment',
    surface: 'provider' as const,
    expectedAction: 'explain_payment_status',
  },
  {
    id: 'explain-payment-status-why-cash-still-due-en',
    prompt: 'Explain the payment status even though he paid online in advance',
    surface: 'provider' as const,
    expectedAction: 'explain_payment_status',
  },
  {
    id: 'explain-payment-status-stripe-prepay-en',
    prompt: 'Client prepaid online — do I charge again?',
    surface: 'provider' as const,
    expectedAction: 'explain_payment_status',
  },
] as const;
