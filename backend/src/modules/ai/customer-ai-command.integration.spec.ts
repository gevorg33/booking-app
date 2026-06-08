import { CustomerAiCommandService } from './customer-ai-command.service.js';
import {
  createClassificationEngineMock,
  createEscalationHandoffMock,
} from './ai-gateway.test-mocks.js';
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
          if (prop === 'handleBuyGiftCard') {
            return jest.fn(
              async (
                _businessId: string,
                _params?: Record<string, unknown>,
                physical?: boolean,
              ) => ({
                success: true,
                action: physical ? 'buy_gift_card_physical' : 'buy_gift_card',
                summary: 'gift card ok',
                details: {
                  bookingId: 'bk-1',
                  packageId: 'pkg-1',
                  manageUrl: 'https://example.com/manage/bk-1',
                  sessionContext: { serviceName: 'Spa Day' },
                },
              }),
            );
          }
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
      {
        gateCustomerAction: jest.fn(() => null),
        hydrateAutofillWatchdogSession: jest.fn(async () => undefined),
      } as any,
      { emitMisrouteTelemetry: jest.fn() } as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      {
        handleExplainCheckoutCurrency: jest.fn(async () => ({
          success: true,
          action: 'explain_checkout_currency',
          summary: 'ok',
          details: {},
        })),
      } as any,
      {
        handleExplainBookingLanguages: jest.fn(async () => ({
          success: true,
          action: 'explain_booking_languages',
          summary: 'ok',
          details: {},
        })),
      } as any,
      {
        handleExplainBookingDateFormat: jest.fn(async () => ({
          success: true,
          action: 'explain_booking_date_format',
          summary: 'ok',
          details: {},
        })),
      } as any,
      sprintHandlers as any,
      {
        handleExplainDataRights: jest.fn(async () => ({
          success: true,
          action: 'explain_data_rights',
          summary: 'ok',
          details: {},
        })),
      } as any,
      sprintHandlers as any,
      sprintHandlers as any,
      {
        handleListMyTestResults: jest.fn(async () => ({
          success: true,
          action: 'list_my_test_results',
          summary: 'ok',
          details: {},
        })),
        handleExplainResultStatus: jest.fn(async () => ({
          success: true,
          action: 'explain_result_status',
          summary: 'ok',
          details: {},
        })),
      } as any,
      sprintHandlers as any,
      sprintHandlers as any,
      sprintHandlers as any,
      { chat: jest.fn() } as any,
      createClassificationEngineMock() as any,
      createEscalationHandoffMock() as any,
      { find: jest.fn(async () => []) } as any,
      { find: jest.fn(async () => []) } as any,
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
        action: 'list_services',
        summary: 'Massage, Facial',
        sessionContext: { serviceName: 'Massage' },
      })),
    };
    const llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action: 'list_services',
        params: {},
        reasoning: 'browse services',
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
      {
        gateCustomerAction: jest.fn(() => null),
        hydrateAutofillWatchdogSession: jest.fn(async () => undefined),
      } as any,
      { emitMisrouteTelemetry: jest.fn() } as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      noop as any,
      {
        handleExplainCheckoutCurrency: jest.fn(async () => ({
          success: true,
          action: 'explain_checkout_currency',
          summary: 'ok',
          details: {},
        })),
      } as any,
      {
        handleExplainBookingLanguages: jest.fn(async () => ({
          success: true,
          action: 'explain_booking_languages',
          summary: 'ok',
          details: {},
        })),
      } as any,
      {
        handleExplainBookingDateFormat: jest.fn(async () => ({
          success: true,
          action: 'explain_booking_date_format',
          summary: 'ok',
          details: {},
        })),
      } as any,
      noop as any,
      {
        handleExplainDataRights: jest.fn(async () => ({
          success: true,
          action: 'explain_data_rights',
          summary: 'ok',
          details: {},
        })),
      } as any,
      noop as any,
      noop as any,
      {} as any,
      {} as any,
      {} as any,
      noop as any,
      publicAssistant as any,
      createClassificationEngineMock() as any,
      createEscalationHandoffMock() as any,
      { find: jest.fn(async () => []) } as any,
      { find: jest.fn(async () => []) } as any,
    );

    const result = await service.executeCommand(
      'biz-1',
      'What services do you offer?',
      [],
      {
        slug: 'salon',
      },
    );

    expect(publicAssistant.chat).toHaveBeenCalledWith(
      'salon',
      'What services do you offer?',
      expect.objectContaining({ locale: undefined }),
      { recordMetrics: false },
    );
    expect(result.action).toBe('list_services');
    expect(result.details?.sessionContext).toEqual({ serviceName: 'Massage' });
  });
});
