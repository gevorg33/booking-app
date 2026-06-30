import { CustomerAiCommandService } from './customer-ai-command.service.js';
import {
  buildCustomerAiSettingsMock,
  buildCustomerPromptNormalizationMock,
  buildCustomerUnderstandMock,
  resetCustomerUnderstandingHarness,
} from './customer-ai-command.integration.harness.js';
import { SIMILAR_BUDGET_SERVICE_PROMPTS } from './ai-budget-service-discovery.fixtures.js';
import { AVAIL_CUSTOMER_PROMPTS } from './ai-flexible-availability.fixtures.js';
import { SERVICE_RANK_DISCOVERY_CUSTOMER_PROMPTS } from './ai-service-rank-discovery.fixtures.js';
import { COMPOUND_DECOMPOSITION_SCENARIOS } from './intent-decomposition.fixtures.js';
import * as intentDecomposition from './intent-decomposition.util.js';

type CustomerIntegrationHarnessOptions = {
  llmAction?: string;
  llmParams?: Record<string, unknown>;
  publicAssistant?: {
    chat: jest.Mock;
    executeDeterministicIntent: jest.Mock;
  };
};

function createCustomerIntegrationHarness(
  options: CustomerIntegrationHarnessOptions = {},
) {
  const handlerMocks = new Map<string, jest.Mock>();
  const createHandlerMock = (action: string) =>
    jest.fn(async (_businessId: string, params?: Record<string, unknown>) => ({
      success: true,
      action,
      summary: `${action} ok`,
      details: {
        bookingId: 'bk-1',
        packageId: params?.packageId ?? 'pkg-1',
        manageUrl: 'https://example.com/manage/bk-1',
        sessionContext: {
          serviceName: 'Spa Day',
          maxPrice: params?.maxPrice,
          serviceCategory: params?.serviceCategory,
        },
      },
    }));

  const sprintHandlers = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (typeof prop !== 'string') return undefined;
        if (handlerMocks.has(prop)) return handlerMocks.get(prop);

        if (prop === 'handleBuyGiftCard') {
          const mock = jest.fn(
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
          handlerMocks.set(prop, mock);
          return mock;
        }
        if (prop.startsWith('handle')) {
          const action = prop
            .replace(/^handle/, '')
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            .replace(/^my_/, 'my_')
            .replace(/^list_my_/, 'list_my_');
          const mock = createHandlerMock(action);
          handlerMocks.set(prop, mock);
          return mock;
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
      action: options.llmAction ?? 'list_my_appointments',
      params: options.llmParams ?? {},
      reasoning: 'customer integration harness',
    })),
  };
  const promptSecurity = {
    preflightBlock: jest.fn(() => null),
    prepareUserPromptForClassifier: jest.fn((p: string) => p),
    stripParams: jest.fn((p: Record<string, unknown>) => p),
  };
  const publicAssistant = options.publicAssistant ?? {
    chat: jest.fn(async () => ({
      success: true,
      action: 'list_services',
      summary: 'ok',
      details: {},
      sessionContext: { maxPrice: '50', serviceCategory: 'haircut' },
    })),
    executeDeterministicIntent: jest.fn(async (_slug, input) => ({
      success: true,
      action: input.action,
      summary: `${input.action} ok`,
      sessionContext: {},
    })),
  };

  const service = new CustomerAiCommandService(
    llm as any,
    promptSecurity as any,
    buildCustomerAiSettingsMock() as any,
    buildCustomerPromptNormalizationMock() as any,
    buildCustomerUnderstandMock() as any,
    { gateCustomerAction: jest.fn(() => null) } as any,
    { emitMisrouteTelemetry: jest.fn() } as any,
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
    {} as any,
    publicAssistant as any,
  );

  return { service, llm, publicAssistant, sprintHandlers };
}

describe('customer-ai-command integration (ai-cmd-0.5)', () => {
  const customerScenarios = COMPOUND_DECOMPOSITION_SCENARIOS.filter(
    (scenario) => scenario.surface === 'customer' && !scenario.expectEmpty,
  );

  afterEach(async () => {
    jest.restoreAllMocks();
    await resetCustomerUnderstandingHarness();
  });

  function createIntegrationService() {
    return createCustomerIntegrationHarness();
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
    jest.spyOn(intentDecomposition, 'isCompoundPrompt').mockReturnValue(true);
    jest
      .spyOn(intentDecomposition, 'decomposeDeterministicForSurface')
      .mockReturnValue(null);
    const { service, llm } = createIntegrationService();
    llm.completeJson.mockResolvedValue({
      action: 'discover_packages',
      params: {},
      reasoning: 'browse packages',
      confidence: 0.88,
    });
    const result = await service.executeCommand(
      'biz-1',
      'Zebra compound marker and zebra second clause',
      [],
      { slug: 'salon', customerId: 'cust-1' },
    );
    expect(llm.completeJson).toHaveBeenCalled();
    expect(result.action).toBe('discover_packages');
  });

  it('routes team-wide slot discovery through customer check_providers_for_service', async () => {
    const publicAssistant = {
      chat: jest.fn(async () => ({
        success: true,
        action: 'check_availability',
        summary: 'slots found',
        sessionContext: { serviceName: 'Massage' },
      })),
      executeDeterministicIntent: jest.fn(async (_slug, input) => ({
        success: true,
        action: input.action,
        summary: `${input.action} ok`,
        sessionContext: {},
      })),
    };
    const { service } = createCustomerIntegrationHarness({
      llmAction: 'check_availability',
      llmParams: { serviceName: 'Massage' },
      publicAssistant,
    });

    const result = await service.executeCommand(
      'biz-1',
      'Any slots for massage tomorrow?',
      [],
      {
        slug: 'salon',
      },
    );

    expect(publicAssistant.chat).not.toHaveBeenCalled();
    expect(result.action).toBe('check_providers_for_service');
  });

  it('routes public-only discovery intent through public assistant after classification', async () => {
    const publicAssistant = {
      chat: jest.fn(async () => ({
        success: true,
        action: 'list_services',
        summary: 'services listed',
        sessionContext: { serviceName: 'Massage' },
      })),
      executeDeterministicIntent: jest.fn(async (_slug, input) => ({
        success: true,
        action: input.action,
        summary: `${input.action} ok`,
        sessionContext: {},
      })),
    };
    const { service } = createCustomerIntegrationHarness({
      llmAction: 'list_services',
      llmParams: { serviceName: 'Massage' },
      publicAssistant,
    });

    const result = await service.executeCommand(
      'biz-1',
      'Show massage services on the booking page',
      [],
      {
        slug: 'salon',
      },
    );

    expect(publicAssistant.chat).toHaveBeenCalledWith(
      'salon',
      'Show massage services on the booking page',
      expect.objectContaining({ locale: undefined }),
      { recordMetrics: false },
    );
    expect(result.action).toBe('list_services');
    expect(result.details?.sessionContext).toEqual({ serviceName: 'Massage' });
  });
});

describe('customer-ai-command discovery integration (ai-cmd-customer-3.4)', () => {
  it('delegates budget list_services to public assistant', async () => {
    const scenario = SIMILAR_BUDGET_SERVICE_PROMPTS.find(
      (entry) => entry.id === 'budget-hair-50-en',
    )!;
    const publicAssistant = {
      chat: jest.fn(async () => ({
        success: true,
        action: 'list_services',
        summary: 'Services within your budget',
        sessionContext: { maxPrice: '50', serviceCategory: 'haircut' },
      })),
      executeDeterministicIntent: jest.fn(),
    };
    const { service } = createCustomerIntegrationHarness({
      llmAction: 'list_services',
      llmParams: scenario.expectedParams ?? {},
      publicAssistant,
    });

    const result = await service.executeCommand(
      'biz-1',
      scenario.prompt,
      [],
      { slug: 'salon', customerId: 'cust-1' },
    );

    expect(publicAssistant.chat).toHaveBeenCalledWith(
      'salon',
      scenario.prompt,
      expect.any(Object),
      { recordMetrics: false },
    );
    expect(result.action).toBe('list_services');
    expect(result.details?.sessionContext).toMatchObject({ maxPrice: '50' });
  });

  it('executes customer budget check-then-book compound without LLM', async () => {
    const scenario = SIMILAR_BUDGET_SERVICE_PROMPTS.find(
      (entry) => entry.id === 'budget-check-then-book-en',
    )!;
    const { service, llm } = createCustomerIntegrationHarness({
      llmAction: 'list_services',
    });

    const result = await service.executeCommand(
      'biz-1',
      scenario.prompt,
      [],
      { slug: 'salon', customerId: 'cust-1' },
    );

    expect(result.action).toBe('compound_intent');
    expect(result.success).toBe(true);
    expect(llm.completeJson).not.toHaveBeenCalled();
    expect(
      (result.details?.steps as Array<{ action: string }> | undefined)?.map(
        (step) => step.action,
      ),
    ).toEqual(scenario.customerCompoundSteps);
  });

  it('rescues premium service wording to list_services before public delegation', async () => {
    const publicAssistant = {
      chat: jest.fn(async () => ({
        success: true,
        action: 'list_services',
        summary: 'Premium haircut',
        sessionContext: { serviceRank: 'highest_price' },
      })),
      executeDeterministicIntent: jest.fn(),
    };
    const { service } = createCustomerIntegrationHarness({
      llmAction: 'recommend_specialists',
      llmParams: { serviceCategory: 'haircut' },
      publicAssistant,
    });

    const result = await service.executeCommand(
      'biz-1',
      'What is the best and premium haircut service?',
      [],
      { slug: 'salon', customerId: 'cust-1' },
    );

    expect(publicAssistant.chat).toHaveBeenCalled();
    expect(result.action).toBe('list_services');
  });

  it('delegates rank list_services to public assistant with serviceRank session carry', async () => {
    const scenario = SERVICE_RANK_DISCOVERY_CUSTOMER_PROMPTS.find(
      (entry) => entry.id === 'rank-translit-cheapest',
    )!;
    const publicAssistant = {
      chat: jest.fn(async () => ({
        success: true,
        action: 'list_services',
        summary: 'Cheapest haircut',
        sessionContext: {
          serviceCategory: 'haircut',
          serviceRank: 'lowest_price',
        },
      })),
      executeDeterministicIntent: jest.fn(),
    };
    const { service } = createCustomerIntegrationHarness({
      llmAction: 'recommend_specialists',
      llmParams: { serviceCategory: 'haircut' },
      publicAssistant,
    });

    const result = await service.executeCommand(
      'biz-1',
      scenario.prompt,
      [],
      { slug: 'salon', customerId: 'cust-1' },
    );

    expect(publicAssistant.chat).toHaveBeenCalledWith(
      'salon',
      scenario.prompt,
      expect.any(Object),
      { recordMetrics: false },
    );
    expect(result.action).toBe('list_services');
    expect(result.details?.sessionContext).toMatchObject({
      serviceRank: 'lowest_price',
    });
  });

  it('delegates flexible availability check_availability to customer check_providers_for_service after pipeline disambiguation', async () => {
    const scenario = AVAIL_CUSTOMER_PROMPTS.find(
      (entry) => entry.id === 'avail-imperative-en',
    )!;
    const { service, sprintHandlers } = createCustomerIntegrationHarness({
      llmAction: 'check_availability',
      llmParams: scenario.expectedParams ?? {},
    });

    const result = await service.executeCommand(
      'biz-1',
      scenario.prompt,
      [],
      { slug: 'salon', customerId: 'cust-1' },
    );

    expect(sprintHandlers.handleCheckProvidersForService).toHaveBeenCalled();
    expect(result.action).toBe('check_providers_for_service');
    expect(result.details?.sessionContext).toMatchObject({
      serviceCategory: 'massage',
    });
  });
});
