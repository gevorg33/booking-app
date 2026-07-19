import { describe, expect, it } from 'vitest';
import { resolvePostBookingSupportHandoff } from './store-review-prompt.util.js';

describe('resolvePostBookingSupportHandoff (e2e-bug.42)', () => {
  it.each([
    {
      id: 'configured-zendesk-signed-in',
      zendeskWidgetConfigured: true,
      expected: 'zendesk_ticket' as const,
    },
    {
      id: 'unconfigured-zendesk-signed-in',
      zendeskWidgetConfigured: false,
      expectedNot: 'zendesk_ticket' as const,
    },
    {
      id: 'undefined-zendesk-signed-in',
      zendeskWidgetConfigured: undefined,
      expectedNot: 'zendesk_ticket' as const,
    },
  ])('$id', ({ zendeskWidgetConfigured, expected, expectedNot }) => {
    const result = resolvePostBookingSupportHandoff({
      slug: 'demo-salon',
      bookingId: 'bk-1',
      hasCustomerToken: true,
      customerEmail: 'customer@example.com',
      zendeskWidgetConfigured,
    });
    if (expected) {
      expect(result).toBe(expected);
    }
    if (expectedNot) {
      expect(result).not.toBe(expectedNot);
    }
  });

  it('does not choose zendesk_ticket without a customer email even when configured', () => {
    expect(
      resolvePostBookingSupportHandoff({
        slug: 'demo-salon',
        bookingId: 'bk-1',
        hasCustomerToken: true,
        customerEmail: '   ',
        zendeskWidgetConfigured: true,
      }),
    ).not.toBe('zendesk_ticket');
  });
});
