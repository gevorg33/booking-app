import { AiGatewayService } from './ai-gateway.service.js';
import { createAiGatewayPlatformMocks } from './ai-gateway.test-mocks.js';
import {
  AI_CMD_RESCUE_SCENARIOS,
  scenariosBySurface,
} from './ai-cmd-eval.fixtures.js';
import type { CommandResult } from './command-completion.types.js';

/**
 * Gateway routing per domain/surface (ai-cmd-t3).
 * Verifies AiGatewayService delegates to the correct command service.
 */
describe('ai-cmd gateway integration (ai-cmd-t3)', () => {
  function buildGateway(overrides?: {
    dashboardResult?: CommandResult;
    customerResult?: CommandResult;
    providerResult?: CommandResult;
  }) {
    const dashboardCommands = {
      executeCommand: jest.fn(
        async () =>
          overrides?.dashboardResult ?? {
            success: true,
            action: 'list_bookings',
            summary: 'dashboard ok',
            details: {},
          },
      ),
      approveTask: jest.fn(),
      retryWorkflowStep: jest.fn(),
    };
    const customerCommands = {
      executeCommand: jest.fn(
        async () =>
          overrides?.customerResult ?? {
            success: true,
            action: 'book_package',
            summary: 'customer ok',
            details: {},
          },
      ),
    };
    const providerCommands = {
      executeCommand: jest.fn(
        async () =>
          overrides?.providerResult ?? {
            success: true,
            action: 'summarize_day',
            summary: 'provider ok',
            details: {},
          },
      ),
    };
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
      dashboardCommands,
      customerCommands,
      providerCommands,
      entityMemory,
    };
  }

  describe('dashboard surface', () => {
    const dashboardScenarios = scenariosBySurface('dashboard').slice(0, 5);

    it.each(dashboardScenarios.map((s) => [s.id, s.prompt]))(
      'routes dashboard prompt %s through dashboard command service',
      async (_id, prompt) => {
        const {
          gateway,
          dashboardCommands,
          customerCommands,
          providerCommands,
        } = buildGateway();
        await gateway.execute({
          surface: 'dashboard',
          businessId: 'biz-1',
          prompt,
          membershipRole: 'owner',
        });
        expect(dashboardCommands.executeCommand).toHaveBeenCalledWith(
          'biz-1',
          prompt,
          undefined,
          expect.objectContaining({
            context: expect.objectContaining({ _accessTier: 'owner' }),
          }),
        );
        expect(customerCommands.executeCommand).not.toHaveBeenCalled();
        expect(providerCommands.executeCommand).not.toHaveBeenCalled();
      },
    );
  });

  describe('customer surface', () => {
    const customerScenarios = scenariosBySurface('customer').slice(0, 5);

    it.each(customerScenarios.map((s) => [s.id, s.prompt]))(
      'routes customer prompt %s through customer command service',
      async (_id, prompt) => {
        const {
          gateway,
          dashboardCommands,
          customerCommands,
          providerCommands,
        } = buildGateway();
        await gateway.execute({
          surface: 'customer',
          businessId: 'biz-1',
          prompt,
          membershipRole: 'client',
          context: { slug: 'salon', customerId: 'cust-1' },
        });
        expect(customerCommands.executeCommand).toHaveBeenCalledWith(
          'biz-1',
          prompt,
          expect.any(Array),
          expect.objectContaining({
            slug: 'salon',
            customerId: 'cust-1',
            _accessTier: 'client',
          }),
        );
        expect(dashboardCommands.executeCommand).not.toHaveBeenCalled();
        expect(providerCommands.executeCommand).not.toHaveBeenCalled();
      },
    );
  });

  describe('provider surface', () => {
    const providerScenarios = scenariosBySurface('provider').slice(0, 5);

    it.each(providerScenarios.map((s) => [s.id, s.prompt]))(
      'routes provider prompt %s through provider command service',
      async (_id, prompt) => {
        const {
          gateway,
          dashboardCommands,
          customerCommands,
          providerCommands,
        } = buildGateway();
        await gateway.execute({
          surface: 'provider',
          businessId: 'biz-1',
          userId: 'user-1',
          prompt,
          membershipRole: 'provider',
          context: { employeeId: 'emp-1' },
        });
        expect(providerCommands.executeCommand).toHaveBeenCalledWith(
          'biz-1',
          'user-1',
          prompt,
          expect.any(Array),
          expect.objectContaining({ employeeId: 'emp-1', confirmed: false }),
        );
        expect(dashboardCommands.executeCommand).not.toHaveBeenCalled();
        expect(customerCommands.executeCommand).not.toHaveBeenCalled();
      },
    );
  });

  it('records entity memory on customer gateway success', async () => {
    const { gateway, entityMemory } = buildGateway({
      customerResult: {
        success: true,
        action: 'book_package',
        summary: 'Booked',
        details: { packageId: 'pkg-1' },
      },
    });
    await gateway.execute({
      surface: 'customer',
      businessId: 'biz-1',
      prompt: AI_CMD_RESCUE_SCENARIOS.find(
        (s) => s.id === 'customer-book-package',
      )!.prompt,
      membershipRole: 'client',
      context: { slug: 'salon', customerId: 'cust-1' },
    });
    expect(entityMemory.learnFromCommand).toHaveBeenCalled();
  });
});
