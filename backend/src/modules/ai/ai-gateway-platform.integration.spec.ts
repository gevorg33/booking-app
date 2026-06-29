import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AiGatewayService } from './ai-gateway.service.js';
import { createAiGatewayPlatformMocks } from './ai-gateway.test-mocks.js';

describe('Sprint 22 AI gateway intelligence integration', () => {
  const dashboardResult = {
    success: true,
    action: 'list_bookings',
    summary: 'ok',
    details: {
      employee: 'Gevorg',
      serviceName: 'Face massage',
      params: { date: 'today' },
    },
  };

  function buildGateway(overrides?: {
    memoryBlock?: string;
    aliases?: Record<string, unknown>;
    ragBlock?: string;
    summaryBlock?: string;
    providerResult?: Record<string, unknown>;
  }) {
    const dashboardCommands = {
      executeCommand: jest.fn(async () => dashboardResult),
      approveTask: jest.fn(),
      retryWorkflowStep: jest.fn(),
    };
    const providerCommands = {
      executeCommand: jest.fn(
        async () =>
          overrides?.providerResult ?? {
            success: true,
            action: 'summarize_day',
            summary: 'ok',
            details: { sessionContext: { employeeName: 'Maria' } },
          },
      ),
    };
    const entityMemory = {
      buildMemoryContextBlock: jest.fn(
        async () => overrides?.memoryBlock ?? 'memory block',
      ),
      getEntityMemory: jest.fn(async () => ({
        aliases: overrides?.aliases ?? { gevorg: { employeeName: 'Gevorg' } },
      })),
      learnFromCommand: jest.fn(),
    };
    const conversationSummary = {
      prepareHistoryForClassifier: jest.fn(async () => ({
        history: [{ role: 'user' as const, content: 'earlier' }],
        summaryBlock: overrides?.summaryBlock ?? 'Earlier conversation summary',
      })),
    };
    const rag = {
      buildRagContextBlock: jest.fn(
        async () => overrides?.ragBlock ?? 'rag block',
      ),
    };
    const promptSecurity = { preflightBlock: jest.fn(() => null) };
    const planEntitlements = {
      assertCanRunDashboardAiCommand: jest.fn(async () => undefined),
      getEntitlements: jest.fn(async () => ({
        tierId: 'starter',
        usage: { aiCommandsThisMonth: 0, providerSeats: 1 },
        atLimit: { aiCommands: false, providerSeats: false },
        aiUsageWarning: false,
      })),
    };

    const { aiSettings, platform, commandTrace } = createAiGatewayPlatformMocks();
    const gateway = new AiGatewayService(
      dashboardCommands as any,
      { executeCommand: jest.fn() } as any,
      providerCommands as any,
      entityMemory as any,
      conversationSummary as any,
      rag as any,
      promptSecurity as any,
      planEntitlements as any,
      aiSettings as any,
      platform as any,
      commandTrace as any,
      { handleGuideUserFlowAsync: jest.fn() } as any,
    );

    return {
      gateway,
      dashboardCommands,
      providerCommands,
      entityMemory,
      conversationSummary,
      rag,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('injects memory, summary, rag, and aliases into dashboard context', async () => {
    const { gateway, dashboardCommands, rag } = buildGateway();
    await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-1',
      prompt: 'holiday waitlist offer',
      membershipRole: 'owner',
      userId: 'user-1',
      history: [{ role: 'user', content: 'prior' }],
    });

    expect(rag.buildRagContextBlock).toHaveBeenCalledWith(
      'biz-1',
      'holiday waitlist offer',
    );
    const session = dashboardCommands.executeCommand.mock.calls[0][3];
    expect(session.context).toEqual(
      expect.objectContaining({
        _entityMemoryBlock: 'memory block',
        _entityMemoryAliases: { gevorg: { employeeName: 'Gevorg' } },
        _conversationSummary: 'Earlier conversation summary',
        _ragContextBlock: 'rag block',
      }),
    );
    expect(session.history).toEqual([{ role: 'user', content: 'earlier' }]);
  });

  it('ai-guide-1.0.3 — resolves assistantMode onto session context', async () => {
    const { gateway, dashboardCommands } = buildGateway();
    await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-1',
      prompt: 'How many appointments today?',
      membershipRole: 'owner',
      assistantMode: 'guide',
    });

    const session = dashboardCommands.executeCommand.mock.calls[0][3];
    expect(session.context).toEqual(
      expect.objectContaining({ assistantMode: 'guide' }),
    );
  });

  it('ai-guide-1.0.3 — resolves assistantMode for provider surface', async () => {
    const { gateway, providerCommands } = buildGateway();
    await gateway.execute({
      surface: 'provider',
      businessId: 'biz-1',
      prompt: 'How do I mark a booking paid?',
      userId: 'user-1',
      membershipRole: 'manager',
      assistantMode: 'guide',
    });

    const context = providerCommands.executeCommand.mock.calls[0][4];
    expect(context).toEqual(expect.objectContaining({ assistantMode: 'guide' }));
  });

  it('ai-guide-1.0.3 — resolves assistantMode for customer/public surface', async () => {
    const customerCommands = { executeCommand: jest.fn(async () => dashboardResult) };
    const { aiSettings, platform, commandTrace } = createAiGatewayPlatformMocks();
    const gateway = new AiGatewayService(
      { executeCommand: jest.fn() } as any,
      customerCommands as any,
      { executeCommand: jest.fn() } as any,
      { buildMemoryContextBlock: jest.fn(async () => ''), getEntityMemory: jest.fn(async () => ({ aliases: {} })), learnFromCommand: jest.fn() } as any,
      { prepareHistoryForClassifier: jest.fn(async () => ({ history: [], summaryBlock: '' })) } as any,
      { buildRagContextBlock: jest.fn(async () => '') } as any,
      { preflightBlock: jest.fn(() => null) } as any,
      { assertCanRunDashboardAiCommand: jest.fn(), getEntitlements: jest.fn(async () => ({ tierId: 'starter', usage: {}, atLimit: {}, aiUsageWarning: false })) } as any,
      aiSettings as any,
      platform as any,
      commandTrace as any,
      { handleGuideUserFlowAsync: jest.fn() } as any,
    );

    await gateway.execute({
      surface: 'customer',
      businessId: 'biz-1',
      prompt: 'How do I book an appointment?',
      context: { slug: 'demo-salon' },
      assistantMode: 'act',
    });

    const context = customerCommands.executeCommand.mock.calls[0][3];
    expect(context).toEqual(expect.objectContaining({ assistantMode: 'act' }));
  });

  it('learns entity memory after successful dashboard commands', async () => {
    const { gateway, entityMemory } = buildGateway();
    await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-1',
      prompt: 'show gevorg',
      membershipRole: 'manager',
      userId: 'user-1',
    });
    expect(entityMemory.learnFromCommand).toHaveBeenCalledWith(
      'biz-1',
      'show gevorg',
      'list_bookings',
      expect.objectContaining({ employee: 'Gevorg', service: 'Face massage' }),
    );
  });

  it('injects intelligence context into provider commands and learns on success', async () => {
    const { gateway, providerCommands, entityMemory } = buildGateway();
    await gateway.execute({
      surface: 'provider',
      businessId: 'biz-1',
      prompt: 'Maria schedule',
      userId: 'user-1',
      membershipRole: 'manager',
      confirmed: true,
    });

    expect(providerCommands.executeCommand).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'Maria schedule',
      [{ role: 'user', content: 'earlier' }],
      expect.objectContaining({
        confirmed: true,
        _entityMemoryBlock: 'memory block',
        _conversationSummary: 'Earlier conversation summary',
        _ragContextBlock: 'rag block',
      }),
    );
    expect(entityMemory.learnFromCommand).toHaveBeenCalledWith(
      'biz-1',
      'Maria schedule',
      'summarize_day',
      expect.objectContaining({ employeeName: 'Maria' }),
      'provider_mobile',
    );
  });

  it('omits empty optional intelligence blocks from enriched context', async () => {
    const { gateway, providerCommands } = buildGateway({
      memoryBlock: '',
      ragBlock: '',
      summaryBlock: '',
    });
    await gateway.execute({
      surface: 'provider',
      businessId: 'biz-1',
      prompt: 'my day',
      userId: 'user-1',
      membershipRole: 'staff',
    });
    const context = providerCommands.executeCommand.mock.calls[0][4];
    expect(context._entityMemoryBlock).toBeUndefined();
    expect(context._ragContextBlock).toBeUndefined();
    expect(context._conversationSummary).toBeUndefined();
  });
});
