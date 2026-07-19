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
] as const;

export const E2E81_STATIC_SUMMARY_FORBIDDEN = 'Your gift cards.';
