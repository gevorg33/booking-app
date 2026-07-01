import { EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS } from './ai-explain-subscription-vs-one-time.fixtures.js';
import { EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS } from './ai-explain-subscription-vs-one-time-multilingual.fixtures.js';
import {
  buildExplainSubscriptionVsOneTimeSummary,
  handleExplainSubscriptionVsOneTimeLogic,
} from './ai-explain-subscription-vs-one-time.logic.js';

describe('ai-explain-subscription-vs-one-time.logic (ai-cmd-customer-4.16.3)', () => {
  const massagePlan = {
    id: 'plan-monthly',
    name: 'Monthly Massage',
    serviceId: 'svc-massage',
    durationMonths: 3,
    includedAppointments: 6,
    service: { id: 'svc-massage', name: 'Massage', price: 80, currency: 'USD' },
  };

  const subscriptionsService = {
    listPlans: jest.fn(async (_businessId: string, serviceId?: string) => {
      if (serviceId && serviceId !== 'svc-massage') return [];
      return [massagePlan];
    }),
    previewFromPlan: jest.fn((plan: typeof massagePlan, unitPrice: number) => ({
      plan: {
        id: plan.id,
        name: plan.name,
        serviceId: plan.serviceId,
        durationMonths: plan.durationMonths,
        includedAppointments: plan.includedAppointments,
      },
      pricing: {
        unitPrice,
        appointments: plan.includedAppointments,
        regularTotal: unitPrice * plan.includedAppointments,
        subscriptionPrice: 400,
        savings: 80,
        perAppointmentPrice: 66.67,
        discountType: 'percent',
        discountValue: 10,
      },
    })),
    getActiveForCustomerService: jest.fn(async () => ({
      id: 'sub-1',
      appointmentsRemaining: 4,
      appointmentsIncluded: 6,
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
      plan: { name: 'Monthly Massage', serviceId: 'svc-massage' },
    })),
  };

  const serviceRepo = {
    find: jest.fn(async () => [massagePlan.service]),
    findOne: jest.fn(async ({ where }: { where: { id?: string } }) =>
      where.id === 'svc-massage' ? massagePlan.service : null,
    ),
  };

  const deps = { subscriptionsService, serviceRepo } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(
    EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS.filter(
      (row) => row.surface === 'public',
    ).map((row) => [row.id, row.prompt] as const),
  )('handles public prompt $0', async (_id, prompt) => {
    const result = await handleExplainSubscriptionVsOneTimeLogic(
      deps,
      'biz-1',
      { serviceName: 'massage' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_subscription_vs_one_time');
  });

  it('explains subscribe and save vs one visit', async () => {
    const result = await handleExplainSubscriptionVsOneTimeLogic(
      deps,
      'biz-1',
      { serviceId: 'svc-massage' },
      'Subscribe and save vs one visit?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('One-time appointment');
    expect(result.summary).toContain('Subscribe & save');
    expect(result.summary).toContain('Monthly Massage');
    expect(result.details?.navigate).toEqual({
      path: 'checkout',
      query: { serviceId: 'svc-massage' },
    });
  });

  it('explains which plan includes a service', async () => {
    const result = await handleExplainSubscriptionVsOneTimeLogic(
      deps,
      'biz-1',
      {},
      'Which plan includes massage?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Monthly Massage');
    expect(result.summary).toContain('Massage');
  });

  it('explains use subscription vs pay once for signed-in customer', async () => {
    const result = await handleExplainSubscriptionVsOneTimeLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', serviceId: 'svc-massage' },
      'Use my subscription or pay once at checkout?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Use subscription');
    expect(result.summary).toContain('One-time appointment');
    expect(result.details?.hasActiveSubscription).toBe(true);
  });

  it('returns clarify for unrelated prompts', async () => {
    const result = await handleExplainSubscriptionVsOneTimeLogic(
      deps,
      'biz-1',
      {},
      'List my appointments',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it.each(EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS)(
    'handles multilingual prompt $id',
    async ({ prompt, serviceName }) => {
      const result = await handleExplainSubscriptionVsOneTimeLogic(
        deps,
        'biz-1',
        serviceName ? { serviceName } : {},
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it('builds use-existing summary copy', () => {
    const summary = buildExplainSubscriptionVsOneTimeSummary({
      focus: 'useExisting',
      serviceName: 'Massage',
      plans: [],
      activeSubscription: {
        planName: 'Monthly Massage',
        appointmentsRemaining: 2,
        appointmentsIncluded: 6,
        expiresAt: '2026-12-31',
      },
    });
    expect(summary).toContain('Use subscription');
    expect(summary).toContain('Monthly Massage');
  });

  it('builds which-plan and empty-plan summaries', () => {
    expect(
      buildExplainSubscriptionVsOneTimeSummary({
        focus: 'whichPlan',
        serviceName: 'Massage',
        plans: [],
      }),
    ).toContain('No subscription plans are linked to Massage');
    expect(
      buildExplainSubscriptionVsOneTimeSummary({
        focus: 'compare',
        plans: [
          {
            name: 'Monthly Massage',
            serviceName: 'Massage',
            includedAppointments: 6,
            durationMonths: 3,
            subscriptionPrice: 400,
            savings: 80,
            perVisitPrice: 66.67,
            unitPrice: 80,
            currency: 'USD',
          },
        ],
      }),
    ).toContain('Subscribe & save');
  });

  it('filters plans by planName and compares without a resolved service', async () => {
    const result = await handleExplainSubscriptionVsOneTimeLogic(
      deps,
      'biz-1',
      { planName: 'Monthly Massage' },
      'Subscribe and save vs one visit?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.plans).toHaveLength(1);
  });

  it('loads plans by serviceName when service entity is not resolved', async () => {
    const looseDeps = {
      ...deps,
      serviceRepo: {
        find: jest.fn(async () => []),
        findOne: jest.fn(async () => null),
      },
    };
    const result = await handleExplainSubscriptionVsOneTimeLogic(
      looseDeps,
      'biz-1',
      { serviceName: 'massage' },
      'Which plan includes massage?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Monthly Massage');
  });
});
