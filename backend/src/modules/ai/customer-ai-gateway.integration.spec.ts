import { AiGatewayService } from './ai-gateway.service.js';
import { createAiGatewayPlatformMocks } from './ai-gateway.test-mocks.js';
import type { CommandResult } from './command-completion.types.js';

describe('customer AI gateway integration (ai-cmd-0.5)', () => {
  const customerCompound: CommandResult = {
    success: true,
    action: 'compound_intent',
    summary: 'Completed 2 customer step(s): book package, promo code help',
    details: {
      customerCompound: true,
      steps: [
        { action: 'book_package', summary: 'Continue booking' },
        { action: 'promo_code_help', summary: 'Promo applied' },
      ],
    },
  };

  function buildGateway(customerResult: CommandResult = customerCompound) {
    const dashboardCommands = {
      executeCommand: jest.fn(),
      approveTask: jest.fn(),
      retryWorkflowStep: jest.fn(),
    };
    const customerCommands = {
      executeCommand: jest.fn(async () => customerResult),
    };
    const providerCommands = { executeCommand: jest.fn() };
    const planEntitlements = {
      assertCanRunDashboardAiCommand: jest.fn(),
      getEntitlements: jest.fn(async () => ({
        tierId: 'starter',
        usage: { aiCommandsThisMonth: 0, providerSeats: 1 },
        atLimit: { aiCommands: false, providerSeats: false },
        aiUsageWarning: false,
      })),
    };
    const promptSecurity = { preflightBlock: jest.fn(() => null) };
    const entityMemory = {
      buildMemoryContextBlock: jest.fn(async () => ''),
      getEntityMemory: jest.fn(async () => ({ aliases: {} })),
      learnFromCommand: jest.fn(),
    };
    const conversationSummary = {
      prepareHistoryForClassifier: jest.fn(async (_biz, history) => ({
        history: history ?? [],
        summaryBlock: '',
      })),
    };
    const rag = { buildRagContextBlock: jest.fn(async () => '') };
    const sprintMocks = createAiGatewayPlatformMocks();

    const gateway = new AiGatewayService(
      dashboardCommands as any,
      customerCommands as any,
      providerCommands as any,
      entityMemory as any,
      conversationSummary as any,
      rag as any,
      promptSecurity as any,
      planEntitlements as any,
      sprintMocks.aiSettings as any,
      sprintMocks.platform as any,
      sprintMocks.commandTrace as any,
    );

    return {
      gateway,
      customerCommands,
      dashboardCommands,
      providerCommands,
      conversationSummary,
      entityMemory,
      platform: sprintMocks.platform,
    };
  }

  it('routes customer surface through CustomerAiCommandService with client tier', async () => {
    const {
      gateway,
      customerCommands,
      dashboardCommands,
      conversationSummary,
    } = buildGateway();

    const result = await gateway.execute({
      surface: 'customer',
      businessId: 'biz-1',
      prompt: 'Book spa day package and apply promo code SPRING25',
      membershipRole: 'client',
      context: { slug: 'salon', customerId: 'cust-1', locale: 'en' },
    });

    expect(customerCommands.executeCommand).toHaveBeenCalledWith(
      'biz-1',
      'Book spa day package and apply promo code SPRING25',
      expect.any(Array),
      expect.objectContaining({
        slug: 'salon',
        customerId: 'cust-1',
        locale: 'en',
        _accessTier: 'client',
        _capabilityHints: expect.stringContaining('Customer booking assistant'),
      }),
    );
    expect(dashboardCommands.executeCommand).not.toHaveBeenCalled();
    expect(
      conversationSummary.prepareHistoryForClassifier,
    ).toHaveBeenCalledWith('biz-1', undefined, 'customer');
    expect((result as CommandResult).details?.gateway).toEqual({
      surface: 'customer',
      tier: 'client',
    });
  });

  it('records customer command outcomes on the customer surface', async () => {
    const { gateway, platform } = buildGateway();
    await gateway.execute({
      surface: 'customer',
      businessId: 'biz-1',
      prompt: 'List my appointments and get manage link',
      membershipRole: 'client',
      userId: 'cust-1',
      context: { slug: 'salon', customerId: 'cust-1' },
    });
    expect(platform.recordCommandOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: 'customer',
        businessId: 'biz-1',
        userId: 'cust-1',
      }),
    );
  });

  it('exposes customer capabilities including public booking assistant intents', async () => {
    const { gateway } = buildGateway();
    const caps = await gateway.getCapabilities('biz-1', 'customer', 'client');
    expect(caps.surface).toBe('customer');
    expect(caps.allowedIntents).toContain('book_package');
    expect(caps.allowedIntents).toContain('list_providers');
    expect(caps.atAiLimit).toBe(false);
  });

  it('learns customer entity memory from successful compound results', async () => {
    const resultWithContext: CommandResult = {
      success: true,
      action: 'compound_intent',
      summary: 'Completed 2 customer step(s)',
      details: {
        customerCompound: true,
        bookingId: 'bk-99',
        packageId: 'pkg-9',
        sessionContext: { slug: 'salon', promoCode: 'SPRING25' },
        serviceName: 'Spa Day',
        employeeName: 'Maria',
      },
    };
    const { gateway, entityMemory } = buildGateway(resultWithContext);

    await gateway.execute({
      surface: 'customer',
      businessId: 'biz-1',
      prompt: 'Book spa day package and apply promo code SPRING25',
      membershipRole: 'client',
      context: { slug: 'salon', customerId: 'cust-1' },
    });

    expect(entityMemory.learnFromCommand).toHaveBeenCalledWith(
      'biz-1',
      'Book spa day package and apply promo code SPRING25',
      'compound_intent',
      expect.objectContaining({
        slug: 'salon',
        promoCode: 'SPRING25',
        bookingId: 'bk-99',
        packageId: 'pkg-9',
        service: 'Spa Day',
        employee: 'Maria',
      }),
      'customer',
    );
  });

  it('forwards conversation history to customer command execution', async () => {
    const { gateway, customerCommands } = buildGateway();
    const history = [
      { role: 'user' as const, content: 'Show packages' },
      { role: 'assistant' as const, content: 'Here are packages' },
    ];

    await gateway.execute({
      surface: 'customer',
      businessId: 'biz-1',
      prompt: 'Book the spa day package',
      membershipRole: 'client',
      history,
      context: { slug: 'salon', customerId: 'cust-1' },
    });

    expect(customerCommands.executeCommand).toHaveBeenCalledWith(
      'biz-1',
      'Book the spa day package',
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Show packages' }),
      ]),
      expect.any(Object),
    );
  });

  it('does not route customer surface to dashboard or provider command services', async () => {
    const { gateway, dashboardCommands, customerCommands, providerCommands } =
      buildGateway();

    await gateway.execute({
      surface: 'customer',
      businessId: 'biz-1',
      prompt: 'List my appointments and get manage link',
      membershipRole: 'client',
      context: { slug: 'salon', customerId: 'cust-1' },
    });

    expect(customerCommands.executeCommand).toHaveBeenCalled();
    expect(dashboardCommands.executeCommand).not.toHaveBeenCalled();
    expect(providerCommands.executeCommand).not.toHaveBeenCalled();
  });
});
