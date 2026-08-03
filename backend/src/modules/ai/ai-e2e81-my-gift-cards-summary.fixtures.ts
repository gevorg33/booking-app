/**
 * e2e-bug.81 — my_gift_cards must verbalize counts/balances in summary
 * (public assistant drops details.account).
 */
export const E2E81_MY_GIFT_CARDS_SUMMARY_CASES = [
  {
    id: 'e2e81-empty-account',
    account: { orders: [], redeemed: [] },
    expectedSummary: 'You have no gift cards.',
    expectNavigate: true,
  },
  {
    id: 'e2e81-orders-and-redeemed-with-balance',
    account: {
      orders: [
        { id: 'gc-1', code: 'QATEST-ACTIVE-001', balance: 30 },
        { id: 'gc-2', code: 'QATEST-REDEEMED-001', balance: 0 },
      ],
      redeemed: [{ id: 'gc-3', code: 'CLAIMED-1' }],
    },
    expectedSummary:
      'You have 2 gift card(s), 1 redeemed. Order balances total 30.',
    expectNavigate: true,
  },
  {
    id: 'e2e81-orders-only',
    account: {
      orders: [{ id: 'gc-1', code: 'ONLY-ORDER', balance: 50 }],
      redeemed: [],
    },
    expectedSummary:
      'You have 1 gift card(s), 0 redeemed. Order balances total 50.',
    expectNavigate: true,
  },
  {
    id: 'e2e81-redeemed-only',
    account: {
      orders: [],
      redeemed: [{ id: 'gc-r1', code: 'REDEEMED-ONLY' }],
    },
    expectedSummary: 'You have 0 gift card(s), 1 redeemed.',
    expectNavigate: true,
  },
  {
    id: 'e2e81-null-balance-counts-as-zero',
    account: {
      orders: [{ id: 'gc-n', code: 'NULL-BAL', balance: null }],
      redeemed: [],
    },
    expectedSummary:
      'You have 1 gift card(s), 0 redeemed. Order balances total 0.',
    expectNavigate: true,
  },
  {
    id: 'e2e81-fractional-balance',
    account: {
      orders: [
        { id: 'gc-a', code: 'A', balance: 19.99 },
        { id: 'gc-b', code: 'B', balance: 0.01 },
      ],
      redeemed: [],
    },
    expectedSummary:
      'You have 2 gift card(s), 0 redeemed. Order balances total 20.',
    expectNavigate: true,
  },
] as const;

/** Live NL prompts that must reach my_gift_cards with a data-bearing summary. */
export const E2E81_LIVE_PROMPTS = [
  { id: 'show-me-my-gift-cards', prompt: 'Show me my gift cards' },
  { id: 'list-my-gift-cards', prompt: 'List my gift cards' },
  { id: 'what-gift-cards-do-i-have', prompt: 'What gift cards do I have?' },
  { id: 'my-gift-card-orders', prompt: 'Show my gift card orders' },
] as const;

export const E2E81_STATIC_SUMMARY_FORBIDDEN = 'Your gift cards.';

export const E2E81_LIVE_CASES = [
  {
    id: 'anon-sign-in-gate',
    description: 'Unauthenticated my_gift_cards asks to sign in (clarify)',
  },
  {
    id: 'empty-account-summary',
    description: 'Signed-in empty account → You have no gift cards. + navigate',
  },
  {
    id: 'seeded-account-summary',
    description:
      'Signed-in with orders+redeemed → counts/balances in summary (not static)',
  },
  {
    id: 'public-strips-account-keeps-navigate',
    description: 'Public assistant response has navigate, no details.account',
  },
  {
    id: 'nl-prompts-route-my-gift-cards',
    description: 'Natural-language prompts classify/rescue to my_gift_cards',
  },
] as const;
