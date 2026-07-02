export type DiagnoseStripeCheckoutFailureConsumerPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'diagnose_stripe_checkout_failure';
  rescueReason: 'diagnose_stripe_checkout_failure';
  aspect?: 'card_declined' | 'session_error' | 'not_charged' | 'generic';
};

export const CUSTOMER_PUBLIC_DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES = `- diagnose_stripe_checkout_failure: READ — customer app or public booking web: help after online card payment fails or is declined at checkout. Explain next steps: retry with another card, check with the bank, drop, pay at the salon when acceptCashPayments is enabled, or pick a new time if the session expired. Set aspect when clear (card_declined|session_error|not_charged|generic|all). Triggers: "Payment failed — what now?", "Card declined at checkout", "Online payment didn't go through", "Stripe checkout error — what should I do?", "My card was rejected". NOT pay_at_venue_fallback (skip/instead online payment — MUTATE), NOT resume_pending_payment (closed app mid-checkout / restore pending device session), NOT pay_online (explicit continue-to-Stripe after slot picked), NOT explain_why_stripe_required (policy why card is required), NOT choose_payment_method (list card vs cash options), NOT dashboard tenant currency/Connect troubleshooting ("Customers can't pay online — currency mismatch", "diagnose Stripe Connect session creation").`;

export const DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS: readonly DiagnoseStripeCheckoutFailureConsumerPromptFixture[] =
  [
    {
      id: 'payment-failed-what-now-customer',
      prompt: 'Payment failed — what now?',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'card-declined-checkout-customer',
      prompt: 'Card declined at checkout',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'card_declined',
    },
    {
      id: 'my-card-declined-customer',
      prompt: 'My card was declined when I tried to pay',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'card_declined',
    },
    {
      id: 'online-payment-failed-customer',
      prompt: 'Online payment failed',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'stripe-checkout-didnt-work-customer',
      prompt: "Stripe checkout didn't work",
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'session_error',
    },
    {
      id: 'payment-didnt-go-through-customer',
      prompt: "Payment didn't go through — what should I do?",
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'why-wont-payment-go-through-customer',
      prompt: "Why won't my payment go through?",
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'couldnt-complete-payment-customer',
      prompt: "Couldn't complete payment on checkout",
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'card-rejected-checkout-customer',
      prompt: 'Card was rejected at checkout',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'card_declined',
    },
    {
      id: 'checkout-error-paying-card-customer',
      prompt: 'Checkout error when paying with card',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'session_error',
    },
    {
      id: 'payment-failed-stripe-help-customer',
      prompt: 'Payment failed on Stripe — help',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'not-charged-checkout-failed-customer',
      prompt: "I wasn't charged but checkout failed",
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'not_charged',
    },
    {
      id: 'payment-failed-what-now-public',
      prompt: 'Payment failed — what now?',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'card-declined-checkout-public',
      prompt: 'Card declined at checkout',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'card_declined',
    },
    {
      id: 'payment-didnt-complete-public',
      prompt: "My payment didn't complete on the booking page",
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'online-card-failed-public',
      prompt: 'Online card payment failed — what can I do?',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'checkout-payment-error-public',
      prompt: 'Checkout payment error on this site',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'session_error',
    },
    {
      id: 'why-card-declined-public',
      prompt: 'Why was my card declined here?',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'card_declined',
    },
    {
      id: 'stripe-didnt-work-booking-public',
      prompt: "Stripe payment didn't work when booking",
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'session_error',
    },
    {
      id: 'couldnt-pay-online-public',
      prompt: "Couldn't pay online for my appointment",
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'payment-error-next-steps-public',
      prompt: 'Payment error at checkout — next steps?',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'card-rejected-during-booking-public',
      prompt: 'Card payment rejected during booking',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'card_declined',
    },
    {
      id: 'online-payment-not-complete-public',
      prompt: 'Online payment did not complete',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
    {
      id: 'checkout-failed-charge-public',
      prompt: 'Booking checkout failed to charge my card',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
      aspect: 'generic',
    },
  ] as const;

export const DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-diagnose-failure',
    prompt: 'Payment failed — what now?',
    misclassifiedAction: 'unknown',
    expectedAction: 'diagnose_stripe_checkout_failure',
  },
  {
    id: 'pay-online-to-diagnose-declined',
    prompt: 'Card declined at checkout',
    misclassifiedAction: 'pay_online',
    expectedAction: 'diagnose_stripe_checkout_failure',
  },
  {
    id: 'booking-help-to-diagnose-failure',
    prompt: 'Online payment failed',
    misclassifiedAction: 'booking_help',
    expectedAction: 'diagnose_stripe_checkout_failure',
  },
  {
    id: 'explain-stripe-to-diagnose-declined',
    prompt: 'Why was my card declined here?',
    misclassifiedAction: 'explain_why_stripe_required',
    expectedAction: 'diagnose_stripe_checkout_failure',
  },
] as const;

export const DIAGNOSE_STRIPE_CHECKOUT_FAILURE_HANDLER_FIXTURES = [
  {
    id: 'online-with-cash-fallback',
    acceptCashPayments: true,
    onlineEnabled: true,
    aspect: 'card_declined' as const,
  },
  {
    id: 'online-only-no-cash',
    acceptCashPayments: false,
    onlineEnabled: true,
    aspect: 'generic' as const,
  },
  {
    id: 'offline-salon-cash-only',
    acceptCashPayments: true,
    onlineEnabled: false,
    aspect: 'session_error' as const,
  },
] as const;
