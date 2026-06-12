import { AiGatewayService } from './ai-gateway.service.js';
import { createAiGatewayPlatformMocks } from './ai-gateway.test-mocks.js';

describe('Sprint 37 — AI gateway PHI guard', () => {
  function buildGateway(hipaaEnabled = true) {
    const dashboardCommands = {
      executeCommand: jest.fn(async () => ({
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {},
      })),
    };
    const customerCommands = { executeCommand: jest.fn() };
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
      prepareHistoryForClassifier: jest.fn(
        async (_biz: string, history: unknown) => ({
          history: history ?? [],
          summaryBlock: '',
        }),
      ),
    };
    const rag = { buildRagContextBlock: jest.fn(async () => '') };
    const sprintMocks = createAiGatewayPlatformMocks();
    sprintMocks.aiSettings.getBusinessRecord = jest.fn().mockResolvedValue({
      id: 'biz-clinic',
      settings: {
        businessType: 'clinic',
        hipaa: hipaaEnabled
          ? { enabled: true, baaAcceptedAt: '2026-01-01' }
          : { enabled: false },
      },
    });

    const gateway = new AiGatewayService(
      dashboardCommands as never,
      customerCommands as never,
      providerCommands as never,
      entityMemory as never,
      conversationSummary as never,
      rag as never,
      promptSecurity as never,
      planEntitlements as never,
      sprintMocks.aiSettings as never,
      sprintMocks.platform as never,
      sprintMocks.commandTrace as never,
    );

    return { gateway, dashboardCommands };
  }

  it('allows dashboard AI when HIPAA is off even if context includes PHI fields', async () => {
    const { gateway, dashboardCommands } = buildGateway(false);

    const result = await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-clinic',
      prompt: 'Summarize symptoms',
      membershipRole: 'manager',
      context: { draft: { symptoms: 'headache' } },
    });

    expect(result.success).toBe(true);
    expect(dashboardCommands.executeCommand).toHaveBeenCalled();
  });

  it('allows dashboard AI when HIPAA is on but context has no PHI fields', async () => {
    const { gateway, dashboardCommands } = buildGateway(true);

    const result = await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-clinic',
      prompt: 'List tomorrow appointments',
      membershipRole: 'manager',
      context: { serviceName: 'Consultation' },
    });

    expect(result.success).toBe(true);
    expect(dashboardCommands.executeCommand).toHaveBeenCalled();
  });

  it('blocks dashboard AI when HIPAA context includes PHI fields', async () => {
    const { gateway, dashboardCommands } = buildGateway();

    const result = await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-clinic',
      prompt: 'Summarize this visit',
      membershipRole: 'manager',
      context: { draft: { symptoms: 'severe headache' } },
    });

    expect(result).toMatchObject({
      success: false,
      action: 'security_blocked',
      details: expect.objectContaining({
        reason: 'phi_in_context',
        matchedFields: expect.arrayContaining(['symptoms']),
      }),
    });
    expect(dashboardCommands.executeCommand).not.toHaveBeenCalled();
  });

  it('blocks dashboard AI when HIPAA prompt embeds PHI field payloads', async () => {
    const { gateway, dashboardCommands } = buildGateway();

    const result = await gateway.execute({
      surface: 'dashboard',
      businessId: 'biz-clinic',
      prompt: 'Summarize visit {"symptoms": "severe headache"}',
      membershipRole: 'manager',
    });

    expect(result).toMatchObject({
      success: false,
      action: 'security_blocked',
      details: expect.objectContaining({
        reason: 'phi_in_prompt',
        matchedFields: expect.arrayContaining(['symptoms']),
      }),
    });
    expect(dashboardCommands.executeCommand).not.toHaveBeenCalled();
  });
});
