import { describe, expect, it } from 'vitest';
import {
  formatSubscriptionUsageAction,
  formatSubscriptionUsageLine,
} from './subscription-account.util.js';

const copy = {
  subscriptionUsagePurchase: 'Plan purchased',
  subscriptionUsageRedeem: 'Visit used',
  subscriptionUsageRestore: 'Visit restored',
  subscriptionUsageExpire: 'Expired',
  subscriptionUsageLine: '{action} · {date} · {remaining} left',
} as const;

describe('subscription-account.util (e2e-bug.41)', () => {
  it.each([
    { id: 'consume', action: 'consume', expected: 'Visit used' },
    { id: 'restore', action: 'restore', expected: 'Visit restored' },
    { id: 'CONSUME-case', action: 'CONSUME', expected: 'Visit used' },
    { id: 'legacy-purchase', action: 'purchase', expected: 'Plan purchased' },
    { id: 'legacy-redeem', action: 'redeem_visit', expected: 'Visit used' },
    { id: 'legacy-expire', action: 'expire', expected: 'Expired' },
  ])('$id maps to localized label (never raw enum)', ({ action, expected }) => {
    expect(formatSubscriptionUsageAction(action, copy as never)).toBe(expected);
  });

  it('formats usage history lines for real consume rows', () => {
    const line = formatSubscriptionUsageLine(
      {
        id: 'u1',
        action: 'consume',
        appointmentsRemainingAfter: 2,
        createdAt: '2026-07-14T12:00:00.000Z',
      },
      copy as never,
      'en-US',
    );
    expect(line).toContain('Visit used');
    expect(line).toContain('2 left');
    expect(line.toLowerCase()).not.toContain('consume');
  });
});
