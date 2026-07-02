import { handleExplainMySubscriptionLogic } from './ai-explain-my-subscription.logic.js';

describe('ai-explain-my-subscription.logic (ai-cmd-customer-4.5.3)', () => {
  const subscriptionsService = {
    listCustomerSubscriptions: jest.fn(async () => [
      {
        id: 'sub-1',
        status: 'active',
        appointmentsRemaining: 3,
        appointmentsIncluded: 6,
        expiresAt: new Date('2026-12-01T00:00:00.000Z'),
        plan: { name: 'Monthly Massage', service: { name: 'Massage' } },
      },
    ]),
    getCustomerSubscriptionUsage: jest.fn(async () => ({
      subscription: { id: 'sub-1' },
      usage: [{ id: 'u1' }, { id: 'u2' }],
    })),
  };

  const deps = { subscriptionsService } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains visits remaining on primary subscription', async () => {
    const result = await handleExplainMySubscriptionLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'How many visits left on my plan?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_my_subscription');
    expect(result.summary).toContain('3 of 6');
    expect(result.details?.subscriptionId).toBe('sub-1');
    expect(result.details?.usageEventCount).toBe(2);
  });

  it('requires sign-in', async () => {
    const result = await handleExplainMySubscriptionLogic(
      deps,
      'biz-1',
      {},
      'How many visits left on my plan?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.missing).toContain('sessionCustomerId');
  });

  it('returns clarify for non-explain prompts', async () => {
    const result = await handleExplainMySubscriptionLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Show my subscriptions',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('handles empty subscription list', async () => {
    subscriptionsService.listCustomerSubscriptions.mockResolvedValueOnce([]);

    const result = await handleExplainMySubscriptionLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      "What's on my subscription?",
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('do not have a subscription');
  });

  it('uses explicit subscriptionId when provided', async () => {
    subscriptionsService.listCustomerSubscriptions.mockResolvedValueOnce([
      {
        id: 'sub-2',
        status: 'active',
        appointmentsRemaining: 1,
        appointmentsIncluded: 4,
        expiresAt: new Date('2026-12-01T00:00:00.000Z'),
        plan: { name: 'Facial Plan', service: { name: 'Facial' } },
      },
      {
        id: 'sub-1',
        status: 'active',
        appointmentsRemaining: 3,
        appointmentsIncluded: 6,
        expiresAt: new Date('2026-12-01T00:00:00.000Z'),
        plan: { name: 'Monthly Massage', service: { name: 'Massage' } },
      },
    ]);

    const result = await handleExplainMySubscriptionLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', subscriptionId: 'sub-2' },
      'How many visits left on my plan?',
    );

    expect(result.details?.subscriptionId).toBe('sub-2');
    expect(result.summary).toContain('1 of 4');
  });

  it('handles service errors', async () => {
    subscriptionsService.listCustomerSubscriptions.mockRejectedValueOnce(
      new Error('Service unavailable'),
    );

    const result = await handleExplainMySubscriptionLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Explain my membership',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Service unavailable');
  });
});
