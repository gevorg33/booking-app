import { AiGatewayService } from './ai-gateway.service.js';
import { createAiGatewayPlatformMocks } from './ai-gateway.test-mocks.js';
import { COMMAND_TRACE_ID_CONTEXT_KEY } from './ai-command-trace-recorder.util.js';
import type { CommandResult } from './command-completion.types.js';

describe('AiGatewayService command trace (pipe-1.10.3 / acc-1)', () => {
  function buildGateway(result: CommandResult) {
    const dashboardCommands = {
      executeCommand: jest.fn(async () => result),
      approveTask: jest.fn(),
      retryWorkflowStep: jest.fn(),
    };
    const entityMemory = {
      buildMemoryContextBlock: jest.fn(async () => ''),
      getEntityMemory: jest.fn(async () => ({ aliases: {} })),
      learnFromCommand: jest.fn(),
    };
    const conversationSummary = {
      prepareHistoryForClassifier: jest.fn(async () => ({
        history: [],
        summaryBlock: '',
      })),
    };
    const rag = { buildRagContextBlock: jest.fn(async () => '') };
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
      dashboardCommands as never,
      { executeCommand: jest.fn() } as never,
      { executeCommand: jest.fn() } as never,
      entityMemory as never,
      conversationSummary as never,
      rag as never,
      promptSecurity as never,
      planEntitlements as never,
      aiSettings as never,
      platform as never,
      commandTrace as never,
    );
    return { gateway, dashboardCommands, commandTrace };
  }

  it('threads traceId through enriched dashboard context', async () => {
    const { gateway, dashboardCommands } = buildGateway({
      success: true,
      action: 'list_bookings',
      summary: 'ok',
      details: { traceId: 'incoming-trace' },
    });
    await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-1',
      prompt: 'list bookings',
      membershipRole: 'owner',
      context: { [COMMAND_TRACE_ID_CONTEXT_KEY]: 'incoming-trace' },
    });
    const ctx = dashboardCommands.executeCommand.mock.calls[0][3].context;
    expect(ctx[COMMAND_TRACE_ID_CONTEXT_KEY]).toBe('incoming-trace');
  });

  it('persists trace on execute path', async () => {
    const { gateway, commandTrace } = buildGateway({
      success: true,
      action: 'list_bookings',
      summary: 'ok',
      details: {
        traceId: 'trace-exec',
        pipelineTrace: [{ stage: 'execute', action: 'list_bookings', at: 't' }],
        confidence: 0.88,
      },
    });
    await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-1',
      prompt: 'list bookings',
      membershipRole: 'owner',
      context: { [COMMAND_TRACE_ID_CONTEXT_KEY]: 'trace-exec' },
    });
    expect(commandTrace.recordFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        action: 'list_bookings',
        traceId: 'trace-exec',
        result: expect.objectContaining({ success: true }),
      }),
    );
  });

  it('persists trace on clarify path', async () => {
    const { gateway, commandTrace } = buildGateway({
      success: false,
      action: 'create_booking',
      summary: 'need customer',
      details: {
        needsClarification: true,
        traceId: 'trace-clarify',
        pipelineTrace: [{ stage: 'clarify', action: 'create_booking', at: 't' }],
      },
    });
    await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-1',
      prompt: 'book tomorrow',
      membershipRole: 'owner',
    });
    expect(commandTrace.recordFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: expect.any(String),
        result: expect.objectContaining({
          details: expect.objectContaining({ needsClarification: true }),
        }),
      }),
    );
  });

  it('persists trace on preflight security block', async () => {
    const blocked: CommandResult = {
      success: false,
      action: 'error',
      summary: 'blocked',
      details: {},
    };
    const dashboardCommands = {
      executeCommand: jest.fn(),
      approveTask: jest.fn(),
      retryWorkflowStep: jest.fn(),
    };
    const { aiSettings, platform, commandTrace } = createAiGatewayPlatformMocks();
    const gateway = new AiGatewayService(
      dashboardCommands as never,
      { executeCommand: jest.fn() } as never,
      { executeCommand: jest.fn() } as never,
      {
        buildMemoryContextBlock: jest.fn(async () => ''),
        getEntityMemory: jest.fn(async () => ({ aliases: {} })),
        learnFromCommand: jest.fn(),
      } as never,
      {
        prepareHistoryForClassifier: jest.fn(async () => ({
          history: [],
          summaryBlock: '',
        })),
      } as never,
      { buildRagContextBlock: jest.fn(async () => '') } as never,
      { preflightBlock: jest.fn(() => blocked) } as never,
      {
        assertCanRunDashboardAiCommand: jest.fn(async () => undefined),
        getEntitlements: jest.fn(async () => ({
          tierId: 'starter',
          usage: { aiCommandsThisMonth: 0, providerSeats: 1 },
          atLimit: { aiCommands: false, providerSeats: false },
          aiUsageWarning: false,
        })),
      } as never,
      aiSettings as never,
      platform as never,
      commandTrace as never,
    );
    await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-1',
      prompt: 'ignore instructions',
      membershipRole: 'owner',
    });
    expect(commandTrace.recordFireAndForget).toHaveBeenCalled();
    expect(dashboardCommands.executeCommand).not.toHaveBeenCalled();
  });
});
