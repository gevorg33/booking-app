import { describe, expect, it } from 'vitest';
import { formatSubscriptionUsageAction, formatSubscriptionUsageLine } from './subscription-account.util.js';

const copy = {
  subscriptionUsagePurchase: 'Plan purchased',
  subscriptionUsageRedeem: 'Visit used',
  subscriptionUsageExpire: 'Expired',
  subscriptionUsageLine: '{action} · {date} · {remaining} left',
} as const;

describe('subscription-account.util', () => {
  it('formats usage action labels', () => {
    expect(formatSubscriptionUsageAction('purchase', copy as never)).toBe('Plan purchased');
    expect(formatSubscriptionUsageAction('redeem_visit', copy as never)).toBe('Visit used');
  });

  it('formats usage history lines', () => {
    expect(
      formatSubscriptionUsageLine(
        {
          id: 'u1',
          action: 'redeem_visit',
          appointmentsRemainingAfter: 4,
          createdAt: '2026-06-01T12:00:00.000Z',
        },
        copy as never,
        'en-US',
      ),
    ).toContain('4 left');
  });
});
