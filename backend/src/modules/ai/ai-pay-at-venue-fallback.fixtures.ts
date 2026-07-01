export type PayAtVenueFallbackPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'pay_at_venue_fallback';
  rescueReason: 'pay_at_venue_fallback';
};

export const CUSTOMER_PUBLIC_PAY_AT_VENUE_FALLBACK_CLASSIFIER_RULES = `- pay_at_venue_fallback: MUTATE — customer app or public booking web: skip optional online card checkout and confirm pay-at-venue / cash instead (activationPayAtVenue fallback when prepayment is not required). Triggers: "Pay at salon instead", "Skip online payment", "Confirm and pay at visit instead", "Don't pay online — pay at the salon", "Bypass card payment". Sets paymentMethod=cash, payAtVenue=true, navigates to checkout with payment=cash when slot context exists. Fails when acceptCashPayments is off or the service requires full online prepayment. NOT pay_cash_at_visit (direct cash selection without skip/instead cue), NOT pay_online, NOT choose_payment_method (list options), NOT diagnose_stripe_checkout_failure (explain after failure — READ), NOT book_with_cash (booking-flow cash preference), NOT explain_why_stripe_required.`;

export const PAY_AT_VENUE_FALLBACK_PROMPTS: readonly PayAtVenueFallbackPromptFixture[] =
  [
    {
      id: 'pay-at-salon-instead-customer',
      prompt: 'Pay at salon instead',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'skip-online-payment-customer',
      prompt: 'Skip online payment',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'confirm-pay-at-visit-instead-customer',
      prompt: 'Confirm and pay at visit instead',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'rather-pay-venue-customer',
      prompt: "I'd rather pay at the venue than online",
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'dont-pay-online-salon-customer',
      prompt: "Don't pay online — pay at the salon",
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'bypass-card-pay-arrive-customer',
      prompt: 'Bypass card payment and pay when I arrive',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'pay-visit-instead-stripe-customer',
      prompt: 'Pay at visit instead of Stripe',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'skip-online-checkout-cash-customer',
      prompt: 'Skip the online checkout — cash at salon',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'no-online-confirm-visit-customer',
      prompt: 'No online payment — confirm and pay at visit',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'salon-without-online-customer',
      prompt: 'Pay at the salon without paying online',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'confirm-without-online-customer',
      prompt: "I'll confirm without online payment",
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'pay-at-venue-not-online-customer',
      prompt: 'Pay at venue, not online',
      surface: 'customer',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'pay-at-salon-instead-public',
      prompt: 'Pay at salon instead',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'skip-online-payment-public',
      prompt: 'Skip online payment',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'confirm-pay-visit-instead-public',
      prompt: 'Confirm and pay at visit instead',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'rather-venue-than-online-public',
      prompt: "I'd rather pay at the venue than online",
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'dont-pay-online-booking-page-public',
      prompt: "Don't pay online on this booking page",
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'skip-stripe-pay-salon-public',
      prompt: 'Skip Stripe and pay at the salon',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'without-online-booking-public',
      prompt: 'Book without online payment',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'pay-cash-instead-online-public',
      prompt: 'Pay cash at visit instead of online',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'avoid-online-pay-venue-public',
      prompt: 'Avoid online payment — pay at venue',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'no-card-pay-salon-public',
      prompt: 'No card payment — pay at salon when I arrive',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'confirm-pay-at-salon-public',
      prompt: 'Confirm and pay at the salon instead of online',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
    {
      id: 'skip-online-checkout-public',
      prompt: 'Skip online checkout and pay at visit',
      surface: 'public',
      expectedAction: 'pay_at_venue_fallback',
      rescueReason: 'pay_at_venue_fallback',
    },
  ] as const;

export const PAY_AT_VENUE_FALLBACK_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-fallback',
    prompt: 'Skip online payment',
    misclassifiedAction: 'unknown',
    expectedAction: 'pay_at_venue_fallback',
  },
  {
    id: 'pay-online-to-fallback',
    prompt: 'Pay at salon instead',
    misclassifiedAction: 'pay_online',
    expectedAction: 'pay_at_venue_fallback',
  },
  {
    id: 'pay-cash-to-fallback-instead',
    prompt: 'Confirm and pay at visit instead',
    misclassifiedAction: 'pay_cash_at_visit',
    expectedAction: 'pay_at_venue_fallback',
  },
  {
    id: 'diagnose-to-fallback-skip',
    prompt: 'Skip online payment',
    misclassifiedAction: 'diagnose_stripe_checkout_failure',
    expectedAction: 'pay_at_venue_fallback',
  },
] as const;

export const PAY_AT_VENUE_FALLBACK_HANDLER_FIXTURES = [
  {
    id: 'optional-prepayment-cash-enabled',
    acceptCashPayments: true,
    onlineEnabled: true,
    prepaymentMode: 'none' as const,
  },
  {
    id: 'cash-disabled',
    acceptCashPayments: false,
    onlineEnabled: true,
    prepaymentMode: 'none' as const,
  },
  {
    id: 'full-prepayment-blocked',
    acceptCashPayments: true,
    onlineEnabled: true,
    prepaymentMode: 'full' as const,
  },
] as const;
