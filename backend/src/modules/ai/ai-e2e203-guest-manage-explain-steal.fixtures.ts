/**
 * e2e-bug.203 — guest_book_and_manage / guest_pay_cash_manage must win over
 * explain_guest_checkout_fields when a service is named (and for the canonical
 * no-service guest+manage compounds). FAQ-only prompts must stay FAQ.
 */

export type E2E203CompoundCase = {
  id: string;
  prompt: string;
  expectCompound: 'guest_book_and_manage' | 'guest_pay_cash_manage';
  expectOrderedActions: readonly string[];
};

export type E2E203FaqCase = {
  id: string;
  prompt: string;
};

/** Named-service + guest+manage (and cash) — must NOT be explain FAQ. */
export const E2E203_COMPOUND_MUST_WIN: readonly E2E203CompoundCase[] = [
  {
    id: 'swedish-guest-book-manage',
    prompt: 'Book as guest a Swedish massage and email me the manage link',
    expectCompound: 'guest_book_and_manage',
    expectOrderedActions: ['book_nearest_slot', 'get_manage_link'],
  },
  {
    id: 'swedish-guest-book-manage-alt',
    prompt:
      'Book Swedish massage as a guest and send me the booking manage link',
    expectCompound: 'guest_book_and_manage',
    expectOrderedActions: ['book_nearest_slot', 'get_manage_link'],
  },
  {
    id: 'hairstyle-without-account-manage',
    prompt:
      'Book hairstyle without an account and email me the manage link',
    expectCompound: 'guest_book_and_manage',
    expectOrderedActions: ['book_nearest_slot', 'get_manage_link'],
  },
  {
    id: 'unicorn-guest-book-manage',
    prompt:
      'Book as guest a unicorn-laser-trim and email me the manage link',
    expectCompound: 'guest_book_and_manage',
    expectOrderedActions: ['book_nearest_slot', 'get_manage_link'],
  },
  {
    id: 'canonical-no-service-guest-manage',
    prompt: 'Book as guest and email me the manage link',
    expectCompound: 'guest_book_and_manage',
    expectOrderedActions: ['book_nearest_slot', 'get_manage_link'],
  },
  {
    id: 'swedish-guest-pay-cash-manage',
    prompt:
      'Book as guest Swedish massage, pay cash at visit, email manage link',
    expectCompound: 'guest_pay_cash_manage',
    expectOrderedActions: [
      'book_nearest_slot',
      'pay_cash_at_visit',
      'get_manage_link',
    ],
  },
  {
    id: 'swedish-guest-pay-cash-manage-alt',
    prompt:
      'Book as guest a Swedish massage, pay cash at visit, and email me the manage link',
    expectCompound: 'guest_pay_cash_manage',
    expectOrderedActions: [
      'book_nearest_slot',
      'pay_cash_at_visit',
      'get_manage_link',
    ],
  },
  {
    id: 'neck-guest-pay-cash-manage',
    prompt:
      'Book Neck Massage as guest, pay at visit, email me the manage link',
    expectCompound: 'guest_pay_cash_manage',
    expectOrderedActions: [
      'book_nearest_slot',
      'pay_cash_at_visit',
      'get_manage_link',
    ],
  },
  {
    id: 'unicorn-guest-pay-cash-manage',
    prompt:
      'Book as guest unicorn-laser-trim, pay cash at visit, email manage link',
    expectCompound: 'guest_pay_cash_manage',
    expectOrderedActions: [
      'book_nearest_slot',
      'pay_cash_at_visit',
      'get_manage_link',
    ],
  },
  {
    id: 'canonical-no-service-pay-cash-manage',
    prompt: 'Book as guest, pay cash at visit, and email me the manage link',
    expectCompound: 'guest_pay_cash_manage',
    expectOrderedActions: [
      'book_nearest_slot',
      'pay_cash_at_visit',
      'get_manage_link',
    ],
  },
];

/** Genuine guest-checkout FAQ — must stay explain_guest_checkout_fields. */
export const E2E203_FAQ_MUST_STAY: readonly E2E203FaqCase[] = [
  {
    id: 'why-email-at-checkout',
    prompt: 'Why do you need my email at checkout?',
  },
  {
    id: 'why-email-book-as-guest',
    prompt: 'Why do you need my email to book as a guest?',
  },
  {
    id: 'name-field-checkout',
    prompt: 'What is the name field for on checkout?',
  },
  {
    id: 'merge-after-sign-in',
    prompt:
      'Will my guest booking link if I sign in with the same email later?',
  },
  {
    id: 'contact-details-confirm',
    prompt: 'Why do you ask for contact details when I confirm my booking?',
  },
];
