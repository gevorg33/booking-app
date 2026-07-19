import {
  isGiftCardRestoreRedemption,
  restoredMonetaryBalance,
  restoredServiceCreditRemaining,
} from './gift-card-restore.util.js';

describe('gift-card-restore.util (e2e-bug.38)', () => {
  it.each([
    {
      id: 'e2e-bug.38-spend-monetary',
      row: { amount: 40, creditsConsumed: 0 },
      restore: false,
    },
    {
      id: 'e2e-bug.38-restore-monetary',
      row: { amount: -40, creditsConsumed: 0 },
      restore: true,
    },
    {
      id: 'e2e-bug.38-spend-service',
      row: { amount: null, creditsConsumed: 1 },
      restore: false,
    },
    {
      id: 'e2e-bug.38-restore-service',
      row: { amount: null, creditsConsumed: -1 },
      restore: true,
    },
  ] as const)('$id', ({ row, restore }) => {
    expect(isGiftCardRestoreRedemption(row)).toBe(restore);
  });

  it('caps monetary restore at initial balance', () => {
    expect(
      restoredMonetaryBalance({
        currentBalance: 10,
        restoreAmount: 40,
        initialBalance: 50,
      }),
    ).toBe(50);
    expect(
      restoredMonetaryBalance({
        currentBalance: 10,
        restoreAmount: 40,
        initialBalance: 40,
      }),
    ).toBe(40);
  });

  it('caps service-credit restore at quantityTotal', () => {
    expect(
      restoredServiceCreditRemaining({
        quantityRemaining: 0,
        quantityTotal: 3,
        creditsToRestore: 1,
      }),
    ).toBe(1);
    expect(
      restoredServiceCreditRemaining({
        quantityRemaining: 3,
        quantityTotal: 3,
        creditsToRestore: 1,
      }),
    ).toBe(3);
  });
});
