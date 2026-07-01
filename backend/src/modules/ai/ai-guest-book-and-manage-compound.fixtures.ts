export type GuestBookAndManageCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const GUEST_BOOK_AND_MANAGE_CLASSIFIER_RULES = `- guest_book_and_manage (compound): customer multi-step guest checkout booking then deliver manage link. Decomposes to book_nearest_slot (guestCheckout=true) → get_manage_link with guestLookup and email/SMS delivery when requested. Use for "Book as guest and email me the manage link", "Book haircut without an account and send manage link to john@example.com", "Schedule as guest then text me the booking link". Requires future guest-book cue (book as guest, book without account, guest checkout and book) AND manage-link delivery cue (manage link, booking link, email/send/text me the link). NOT guest_pay_cash_manage (guest book + pay cash + manage link); NOT get_manage_link alone (already booked or resend-only); NOT explain_guest_checkout_fields; NOT list_my_appointments + get_manage_link.`;

export const GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS: readonly GuestBookAndManageCompoundFixture[] =
  [
    {
      id: 'guest-book-email-manage-link-en',
      prompt: 'Book as guest and email me the manage link',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-without-account-send-link-en',
      prompt: 'Book without an account and send me the manage link',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-no-signin-email-link-en',
      prompt: 'Book as guest without signing in then email the manage link',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-text-manage-link-en',
      prompt: 'Complete a guest booking and text me the manage link',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'sms',
      },
    },
    {
      id: 'guest-book-haircut-email-john-en',
      prompt: 'Book haircut as guest and email manage link to john@example.com',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        serviceName: 'haircut',
        guestLookup: true,
        delivery: 'email',
        email: 'john@example.com',
      },
    },
    {
      id: 'guest-book-massage-booking-link-en',
      prompt:
        'Schedule massage as guest without account — email me the booking link',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        serviceName: 'massage',
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-nearest-send-link-en',
      prompt: 'Book nearest slot as guest and send manage link to my email',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-checkout-book-then-email-en',
      prompt: 'Guest checkout and book — then email me the manage link',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-resend-email-en',
      prompt: 'Book as a guest and resend the manage link by email',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-facial-no-account-en',
      prompt:
        'Book facial without creating an account and get manage link emailed',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        serviceName: 'facial',
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-semicolon-email-link-en',
      prompt: 'I want to book as guest; email me the self-service link after',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'email',
      },
    },
    {
      id: 'guest-book-sms-phone-en',
      prompt:
        'Book tomorrow as guest and SMS me the manage link at +1 555 123 4567',
      surface: 'customer',
      orderedActions: ['book_nearest_slot', 'get_manage_link'],
      expectedParams: {
        guestCheckout: true,
        bookingFirstAvailable: true,
        guestLookup: true,
        delivery: 'sms',
        phone: '15551234567',
      },
    },
  ];

export const GUEST_BOOK_AND_MANAGE_COMPOUND_PROMPTS = [
  ...GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS,
] as const;

export const GUEST_BOOK_AND_MANAGE_RESCUE_SCENARIOS: readonly GuestBookAndManageCompoundFixture[] =
  GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS.slice(0, 4).map((row) => ({
    ...row,
    misclassifiedAction: 'get_manage_link',
  }));

export const GUEST_BOOK_AND_MANAGE_NEGATIVE_PROMPTS = [
  {
    id: 'already-booked-guest-manage-link',
    prompt: 'I booked as a guest — email me the manage link at mia@salon.com',
  },
  {
    id: 'explain-guest-fields-only',
    prompt: 'Why do you need my email for guest checkout?',
  },
  {
    id: 'list-appointments-manage-link',
    prompt: 'List my appointments and get manage link',
  },
  {
    id: 'manage-link-only',
    prompt: 'Get manage link for my booking',
  },
  {
    id: 'resend-only-no-book',
    prompt: 'Resend manage link to john@example.com',
  },
  {
    id: 'book-only-no-manage-link',
    prompt: 'Book nearest slot tomorrow',
  },
] as const;
