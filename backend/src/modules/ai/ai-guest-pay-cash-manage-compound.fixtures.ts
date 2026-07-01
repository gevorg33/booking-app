export type GuestPayCashManageCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const GUEST_PAY_CASH_MANAGE_STEP_ACTIONS = [
  'book_nearest_slot',
  'pay_cash_at_visit',
  'get_manage_link',
] as const;

export const GUEST_PAY_CASH_MANAGE_CLASSIFIER_RULES = `- guest_pay_cash_manage (compound): customer multi-step guest checkout — book as guest, select pay cash at visit, then email/SMS manage link. Decomposes to book_nearest_slot (guestCheckout=true) → pay_cash_at_visit (paymentMethod cash) → get_manage_link (guestLookup + delivery). Triggers: book as guest + pay at visit/cash + email manage link. Example: "Book as guest, pay at visit, email manage link", "Book without account, pay cash when I arrive, and send me the booking link". NOT guest_book_and_manage (no cash step); NOT pay_cash_at_visit alone; NOT get_manage_link alone (already booked); NOT pay_at_venue_fallback (skip online instead cue).`;

export const GUEST_PAY_CASH_MANAGE_EN_PROMPTS = [
  {
    id: 'guest-pay-visit-email-link',
    prompt: 'Book as guest, pay at visit, email manage link',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'guest-cash-arrive-send-link',
    prompt:
      'Book without an account, pay cash when I arrive, and send me the manage link',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'guest-checkout-pay-venue-email',
    prompt:
      'Guest checkout and book — pay at the venue and email me the booking link',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'guest-haircut-cash-email-john',
    prompt:
      'Book haircut as guest, pay cash at visit, email manage link to john@example.com',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      serviceName: 'haircut',
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
      email: 'john@example.com',
    },
  },
  {
    id: 'guest-massage-pay-venue-text',
    prompt:
      'Schedule massage as guest without account; pay at venue; text me the manage link',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      serviceName: 'massage',
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'sms',
    },
  },
  {
    id: 'guest-book-cash-visit-email',
    prompt: 'Book as a guest, pay in cash at my appointment, email manage link',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'guest-no-signin-cash-link',
    prompt:
      'Book as guest without signing in, pay cash at visit, and email the self-service link',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'guest-facial-pay-venue-email',
    prompt:
      'Book facial without creating an account, pay at the venue, get manage link emailed',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      serviceName: 'facial',
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'guest-nearest-cash-email',
    prompt:
      'Book nearest slot as guest, pay cash at visit, send manage link to my email',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'guest-semicolon-cash-link',
    prompt:
      'I want to book as guest; pay at visit; email me the manage link after',
    expectedParams: {
      guestCheckout: true,
      bookingFirstAvailable: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
] as const;

function buildGuestPayCashManagePrompts(): GuestPayCashManageCompoundFixture[] {
  return GUEST_PAY_CASH_MANAGE_EN_PROMPTS.map((entry) => ({
    id: `${entry.id}-customer`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    orderedActions: GUEST_PAY_CASH_MANAGE_STEP_ACTIONS,
    expectedParams: entry.expectedParams,
  }));
}

export const GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS: readonly GuestPayCashManageCompoundFixture[] =
  buildGuestPayCashManagePrompts();

export const GUEST_PAY_CASH_MANAGE_RESCUE_SCENARIOS: readonly GuestPayCashManageCompoundFixture[] =
  [
    {
      id: 'book-to-guest-pay-cash-manage',
      prompt: 'Book as guest, pay at visit, email manage link',
      surface: 'customer',
      orderedActions: [...GUEST_PAY_CASH_MANAGE_STEP_ACTIONS],
      misclassifiedAction: 'book_nearest_slot',
    },
    {
      id: 'cash-to-guest-pay-cash-manage',
      prompt:
        'Book without an account, pay cash when I arrive, and send me the manage link',
      surface: 'customer',
      orderedActions: [...GUEST_PAY_CASH_MANAGE_STEP_ACTIONS],
      misclassifiedAction: 'pay_cash_at_visit',
    },
    {
      id: 'manage-link-to-guest-pay-cash-manage',
      prompt:
        'Guest checkout and book — pay at the venue and email me the booking link',
      surface: 'customer',
      orderedActions: [...GUEST_PAY_CASH_MANAGE_STEP_ACTIONS],
      misclassifiedAction: 'get_manage_link',
    },
    {
      id: 'guest-book-manage-to-guest-pay-cash-manage',
      prompt:
        'Book haircut as guest, pay cash at visit, email manage link to john@example.com',
      surface: 'customer',
      orderedActions: [...GUEST_PAY_CASH_MANAGE_STEP_ACTIONS],
      misclassifiedAction: 'guest_book_and_manage',
    },
  ];

export const GUEST_PAY_CASH_MANAGE_NEGATIVE_PROMPTS = [
  {
    id: 'guest-book-manage-only',
    prompt: 'Book as guest and email me the manage link',
  },
  {
    id: 'pay-cash-only',
    prompt: 'Pay cash at visit',
  },
  {
    id: 'already-booked-guest',
    prompt:
      'I booked as a guest — pay at visit and email me the manage link at mia@salon.com',
  },
  {
    id: 'manage-link-only',
    prompt: 'Get manage link for my booking',
  },
  {
    id: 'book-only',
    prompt: 'Book nearest slot tomorrow',
  },
] as const;
