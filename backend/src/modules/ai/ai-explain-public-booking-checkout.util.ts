/** Dashboard read intent (ai-cmd-ext-2.30). */
export const EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT =
  'explain_public_booking_checkout' as const;

export const PUBLIC_BOOKING_CHECKOUT_READ_INTENTS = [
  EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
] as const;

export type PublicBookingCheckoutReadIntent =
  (typeof PUBLIC_BOOKING_CHECKOUT_READ_INTENTS)[number];

export function isPublicBookingCheckoutReadIntent(
  action: string,
): action is PublicBookingCheckoutReadIntent {
  return (PUBLIC_BOOKING_CHECKOUT_READ_INTENTS as readonly string[]).includes(
    action,
  );
}

export const EXPLAIN_PUBLIC_BOOKING_CHECKOUT_CLASSIFIER_RULES = `- explain_public_booking_checkout: READ — explain how cash pay-at-venue, Stripe online prepayment, and gift-card codes interact on the public booking checkout page (promo field → amount due → card or cash). Summarizes acceptCashPayments, Stripe Connect, gift-card purchase toggle, and per-service prepayment impact. Triggers: explain/show/describe/summarize/what/how + public booking checkout|booking page payment|checkout payment options|how cash online gift card interact. NOT explain_service_online_payment_setup (per-service prepayment catalog summary), NOT explain_checkout_total (single-service price math), NOT configure_cash_payments|configure_checkout_defaults|configure_service_online_payment (mutate), NOT explain_why_stripe_required|choose_payment_method|apply_gift_card_code (customer checkout actions), and NOT explain_checkout_tax|explain_checkout_currency.
- Examples:
  - "Explain public booking checkout payment options" → explain_public_booking_checkout
  - "How do cash and online payment work on the public booking page?" → explain_public_booking_checkout
  - "How do gift cards work at public booking checkout?" → explain_public_booking_checkout
  - "Explain how cash, online payment, and gift cards interact on the booking page" → explain_public_booking_checkout`;

export type ExplainPublicBookingCheckoutFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT;
};

export const EXPLAIN_PUBLIC_BOOKING_CHECKOUT_PROMPTS: ExplainPublicBookingCheckoutFixture[] =
  [
    {
      id: 'explain-checkout-options',
      prompt: 'Explain public booking checkout payment options',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'cash-and-online-booking-page',
      prompt: 'How do cash and online payment work on the public booking page?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'gift-card-at-checkout',
      prompt: 'How do gift cards work at public booking checkout?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'methods-interact',
      prompt:
        'Explain how cash, online payment, and gift cards interact on the booking page',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'customer-payment-methods',
      prompt:
        'What payment methods can customers use on public booking checkout?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'cash-vs-stripe',
      prompt: 'When do visitors pay cash vs Stripe on the booking page?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'cash-or-card-both',
      prompt:
        'Can customers choose cash or card on public booking when both are enabled?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'gift-card-reduce-total',
      prompt: 'Do gift cards reduce the checkout total on public booking?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'summarize-checkout-flow',
      prompt: 'Summarize public booking checkout payment flow',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'prepayment-and-cash',
      prompt:
        'How does online prepayment interact with pay-at-venue cash on the booking page?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'checkout-payment-setup',
      prompt: 'Explain checkout payment setup for public booking',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
    {
      id: 'which-options-enabled',
      prompt: 'Which checkout payment options are enabled for public booking?',
      surface: 'dashboard',
      expectedAction: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
  ];

function hasExplainReadCue(prompt: string): boolean {
  return (
    /\b(explain|show|describe|what|which|how|summarize|overview|when|can)\b/i.test(
      prompt,
    ) ||
    /\b(is|are|do|does)\b/i.test(prompt) ||
    /(?:բացատրիր|ցույց\s+տուր)/i.test(prompt) ||
    /(?:объясни|покажи|опиши|какие|какой)/i.test(prompt)
  );
}

function hasPublicBookingCheckoutSurface(prompt: string): boolean {
  return (
    /\bpublic\s+booking\b.{0,60}\bcheckout\b/i.test(prompt) ||
    /\bcheckout\b.{0,40}\bpublic\s+booking\b/i.test(prompt) ||
    /\bpublic\s+checkout\b/i.test(prompt) ||
    /\bbooking\s+page\b.{0,60}\b(?:checkout|payment)/i.test(prompt) ||
    /\b(?:checkout|payment).{0,40}\bbooking\s+page\b/i.test(prompt) ||
    /\bcheckout\s+payment\s+(?:options?|flow|setup|methods?)\b/i.test(prompt)
  );
}

function isPerServiceOnlinePaymentSetupQuery(prompt: string): boolean {
  return (
    /\bonline\s+payment\s+setup\b/i.test(prompt) ||
    /\bprepayment\s+modes?\b/i.test(prompt) ||
    /\bstripe\s+connect\b/i.test(prompt) ||
    /\bwhich\s+services?\b.{0,70}\b(?:prepayment|online\s+payment|deposit|full)\b/i.test(
      prompt,
    ) ||
    /\b(?:require|requiring)\b.{0,50}\bprepayment\b/i.test(prompt) ||
    /\bcash\b.{0,40}\b(?:allowed|enabled|accept|still)\b/i.test(prompt) ||
    /\b(?:still|also)\s+allow\s+cash\b/i.test(prompt)
  );
}

function hasCheckoutPaymentInteractionContext(prompt: string): boolean {
  if (hasPublicBookingCheckoutSurface(prompt) && /\bpayment\b/i.test(prompt)) {
    return true;
  }

  const methodHits = [
    /\bcash\b/i.test(prompt),
    /\b(?:online|stripe|card)\b/i.test(prompt),
    /\bgift\s*card/i.test(prompt),
  ].filter(Boolean).length;

  if (methodHits >= 2) return true;
  if (hasPublicBookingCheckoutSurface(prompt) && methodHits >= 1) return true;
  if (
    /\bpayment\s+(?:options?|methods?|flow)\b/i.test(prompt) &&
    (hasPublicBookingCheckoutSurface(prompt) ||
      /\bpublic\s+booking\b/i.test(prompt))
  ) {
    return true;
  }
  if (
    /\bhow\b.{0,80}\b(?:interact|work|together)\b/i.test(prompt) &&
    methodHits >= 1
  ) {
    return true;
  }
  return false;
}

function isExplainCheckoutTotalBreakdownPrompt(prompt: string): boolean {
  return (
    /\b(explain|break\s*down|what(?:'s| is))\b/i.test(prompt) &&
    /\b(?:checkout\s+total|amount\s+due|price\s+breakdown)\b/i.test(prompt) &&
    !/\b(?:payment\s+options?|payment\s+methods?|cash|online|gift\s*card|interact)\b/i.test(
      prompt,
    )
  );
}

export function isExplainPublicBookingCheckoutPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isExplainCheckoutTotalBreakdownPrompt(text)) return false;
  if (isPerServiceOnlinePaymentSetupQuery(text)) return false;

  if (
    /\b(accept|enable|decline|disable|turn\s+(?:on|off)|configure|set\s+up|require|apply)\b/i.test(
      text,
    ) &&
    !/\b(explain|show|describe|what|which|how|summarize|when|can|do|does)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  if (!hasExplainReadCue(text)) return false;
  if (!hasCheckoutPaymentInteractionContext(text)) return false;

  return true;
}

/** NL rescue when classifier mislabels public booking checkout explain prompts. */
export function rescueExplainPublicBookingCheckoutIntent(
  prompt: string,
  action: string,
): {
  action: PublicBookingCheckoutReadIntent;
  rescueReason: string;
} | null {
  if (isPublicBookingCheckoutReadIntent(action)) return null;
  if (!isExplainPublicBookingCheckoutPrompt(prompt)) return null;
  return {
    action: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    rescueReason: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
  };
}
