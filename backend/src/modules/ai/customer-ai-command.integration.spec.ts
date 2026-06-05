import { CustomerAiCommandService } from './customer-ai-command.service.js';
import { COMPOUND_DECOMPOSITION_SCENARIOS } from './intent-decomposition.fixtures.js';

describe('customer-ai-command integration (ai-cmd-0.5)', () => {
  const customerScenarios = COMPOUND_DECOMPOSITION_SCENARIOS.filter(
    (scenario) => scenario.surface === 'customer' && !scenario.expectEmpty,
  );

  function createIntegrationService() {
    const handler = (action: string) =>
      jest.fn(
        async (_businessId: string, params?: Record<string, unknown>) => ({
          success: true,
          action,
          summary: `${action} ok`,
          details: {
            bookingId: 'bk-1',
            packageId: params?.packageId ?? 'pkg-1',
            manageUrl: 'https://example.com/manage/bk-1',
            sessionContext: { serviceName: 'Spa Day' },
          },
        }),
      );

    const sprintHandlers = new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          if (prop.startsWith('handle')) {
            const action = prop
              .replace(/^handle/, '')
              .replace(/([A-Z])/g, '_$1')
              .toLowerCase()
              .replace(/^_/, '')
              .replace(/^my_/, 'my_')
              .replace(/^list_my_/, 'list_my_');
            return handler(action);
          }
          if (prop === 'isCustomerBookingCompound') return () => false;
          if (prop === 'isPaymentsCompound') return () => false;
          if (prop === 'isMarketingGrowthCompound') return () => false;
          if (prop === 'isPushNotificationsCompound') return () => false;
          if (prop === 'isFulfillmentCompound') return () => false;
          if (prop === 'handleCustomerBookingCompound') {
            return async () => ({
              success: false,
              action: 'compound_intent',
              summary: 'unused',
              details: {},
            });
          }
          return jest.fn();
        },
      },
    );

    const llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action: 'list_my_appointments',
        params: {},
        reasoning: 'should not run for compound scenarios',
      })),
    };
    const promptSecurity = {
      preflightBlock: jest.fn(() => null),
      prepareUserPromptForClassifier: jest.fn((p: string) => p),
      stripParams: jest.fn((p: Record<string, unknown>) => p),
    };

    const service = new CustomerAiCommandService(
      llm as any,
      promptSecurity as any,
      { gateCustomerAction: jest.fn(() => null) } as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      { chat: jest.fn() } as any,
    );

    return { service, llm };
  }

  it.each(customerScenarios.map((scenario) => [scenario.id, scenario]))(
    'executes compound scenario %s without LLM classification',
    async (_id, scenario) => {
      const { service, llm } = createIntegrationService();
      const result = await service.executeCommand(
        'biz-1',
        scenario.prompt,
        [],
        { slug: 'salon', customerId: 'cust-1' },
      );

      expect(result.action).toBe('compound_intent');
      expect(result.success).toBe(true);
      expect(result.details?.customerCompound).toBe(true);
      expect(llm.completeJson).not.toHaveBeenCalled();

      const stepActions = (
        result.details?.steps as Array<{ action: string }> | undefined
      )?.map((step) => step.action);
      if (scenario.orderedActions) {
        expect(stepActions).toEqual(scenario.orderedActions);
      }
      if (scenario.actions) {
        for (const action of scenario.actions) {
          expect(stepActions).toContain(action);
        }
      }
      if (scenario.minSteps) {
        expect(stepActions?.length).toBeGreaterThanOrEqual(scenario.minSteps);
      }
      if (scenario.paramChecks) {
        for (const check of scenario.paramChecks) {
          const steps = result.details?.steps as Array<{
            action: string;
            summary: string;
          }>;
          expect(steps?.[check.stepIndex]).toBeDefined();
        }
      }
    },
  );

  it('falls back to classification when customer compound prompt has no deterministic match', async () => {
    const { service, llm } = createIntegrationService();
    const result = await service.executeCommand(
      'biz-1',
      'Optimize schedule and rebalance capacity for next week',
      [],
      { slug: 'salon', customerId: 'cust-1' },
    );
    expect(llm.completeJson).toHaveBeenCalled();
    expect(result.action).toBe('book_nearest_slot');
  });

  it('routes public discovery intent through public assistant after classification', async () => {
    const publicAssistant = {
      chat: jest.fn(async () => ({
        success: true,
        action: 'check_availability',
        summary: 'slots found',
        sessionContext: { serviceName: 'Massage' },
      })),
    };
    const llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action: 'check_availability',
        params: { serviceName: 'Massage' },
        reasoning: 'find slots',
      })),
    };
    const promptSecurity = {
      preflightBlock: jest.fn(() => null),
      prepareUserPromptForClassifier: jest.fn((p: string) => p),
      stripParams: jest.fn((p: Record<string, unknown>) => p),
    };
    const noop = new Proxy(
      {},
      {
        get: () =>
          jest.fn(async () => ({
            success: true,
            action: 'noop',
            summary: 'ok',
            details: {},
          })),
      },
    );

    const service = new CustomerAiCommandService(
      llm as any,
      promptSecurity as any,
      { gateCustomerAction: jest.fn(() => null) } as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      publicAssistant as any,
    );

    const result = await service.executeCommand(
      'biz-1',
      'Any slots for massage tomorrow?',
      [],
      {
        slug: 'salon',
      },
    );

    expect(publicAssistant.chat).toHaveBeenCalledWith(
      'salon',
      'Any slots for massage tomorrow?',
      expect.objectContaining({ locale: undefined }),
      { recordMetrics: false },
    );
    expect(result.action).toBe('check_availability');
    expect(result.details?.sessionContext).toEqual({ serviceName: 'Massage' });
  });
});
