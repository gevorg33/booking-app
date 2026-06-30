import { ForbiddenException } from '@nestjs/common';
import { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';
import { PlanLimitExceededException } from '../billing/plan-limit.exception.js';
import { AiGatewayService } from './ai-gateway.service.js';
import {
  buildCapabilitiesView,
  getEffectiveAllowedIntents,
} from './ai-capability.matrix.js';
import {
  isDashboardAiIntentAllowedByPlan,
  getPlanDeniedDashboardIntents,
} from '../billing/plan-dashboard-ai-intents.util.js';
import { resolveMergedComplexityRoute } from './ai-command-routing.util.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { SubscriptionStatus } from '../billing/subscription-status.enum.js';
import { createAiGatewayPlatformMocks } from './ai-gateway.test-mocks.js';

/**
 * Sprint 15 — AI platform & limits (integration-style wiring tests).
 */
describe('Sprint 15 AI platform integration', () => {
  const businessSolo = {
    id: 'biz-solo',
    subscriptionPlanId: null,
    subscriptionStatus: SubscriptionStatus.INACTIVE,
  };

  const businessStarter = {
    id: 'biz-starter',
    subscriptionPlanId: 'starter',
    subscriptionStatus: SubscriptionStatus.ACTIVE,
  };

  const businessRepo = { findOne: jest.fn() };
  const employeeRepo = { count: jest.fn(async () => 1) };
  const aiUsageService = { getMonthlySummary: jest.fn() };

  const planEntitlements = new PlanEntitlementsService(
    businessRepo as any,
    employeeRepo as any,
    aiUsageService as any,
  );

  const decomposition = {
    isCompoundPrompt: (p: string) => p.includes(' and '),
  } as IntentDecompositionService;
  const complexityRouter = new CommandComplexityRouterService(decomposition);

  function buildGateway(overrides?: {
    dashboardResult?: Record<string, unknown>;
    providerResult?: Record<string, unknown>;
  }) {
    const dashboardCommands = {
      executeCommand: jest.fn(
        async () =>
          overrides?.dashboardResult ?? {
            success: true,
            action: 'list_bookings',
            summary: 'ok',
            details: {},
          },
      ),
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
            details: {},
          },
      ),
    };
    const { aiSettings, platform, commandTrace } = createAiGatewayPlatformMocks();
    const gateway = new AiGatewayService(
      dashboardCommands as any,
      { executeCommand: jest.fn() } as any,
      providerCommands as any,
      {
        buildMemoryContextBlock: jest.fn(async () => ''),
        getEntityMemory: jest.fn(async () => ({ aliases: {} })),
        learnFromCommand: jest.fn(),
      } as any,
      {
        prepareHistoryForClassifier: jest.fn(async () => ({
          history: [],
          summaryBlock: '',
        })),
      } as any,
      { buildRagContextBlock: jest.fn(async () => '') } as any,
      { preflightBlock: jest.fn(() => null) } as any,
      planEntitlements,
      aiSettings as any,
      platform as any,
      commandTrace as any,
      { handleGuideUserFlowAsync: jest.fn() } as any,
    );
    return { gateway, dashboardCommands, providerCommands };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    aiUsageService.getMonthlySummary.mockResolvedValue({
      bySurface: [{ surface: 'dashboard', requests: 0 }],
    });
  });

  describe('capability matrix + plan limits', () => {
    it('solo owner cannot see optimize in effective intents', () => {
      const allowed = getEffectiveAllowedIntents('dashboard', 'owner', 'solo');
      expect(allowed).toContain('create_booking');
      expect(allowed).not.toContain('optimize_schedule');
      expect(getPlanDeniedDashboardIntents('solo').length).toBeGreaterThan(0);
    });

    it('starter unlocks advanced intents', () => {
      expect(
        isDashboardAiIntentAllowedByPlan('starter', 'optimize_schedule'),
      ).toBe(true);
      const view = buildCapabilitiesView('dashboard', 'owner', 'starter');
      expect(view.allowedIntents).toContain('optimize_schedule');
    });
  });

  describe('AiGatewayService + PlanEntitlementsService', () => {
    it('blocks dashboard AI when monthly cap reached', async () => {
      businessRepo.findOne.mockResolvedValue(businessSolo);
      aiUsageService.getMonthlySummary.mockResolvedValue({
        bySurface: [{ surface: 'dashboard', requests: 25 }],
      });
      const { gateway } = buildGateway();
      await expect(
        gateway.execute({
          surface: 'dashboard',
          businessId: 'biz-solo',
          prompt: 'list bookings',
          membershipRole: 'owner',
        }),
      ).rejects.toBeInstanceOf(PlanLimitExceededException);
    });

    it('returns capabilities with solo plan denials and usage', async () => {
      businessRepo.findOne.mockResolvedValue(businessSolo);
      const { gateway } = buildGateway();
      const caps = await gateway.getCapabilities(
        'biz-solo',
        'dashboard',
        'owner',
      );
      expect(caps.planTierId).toBe('solo');
      expect(caps.planDeniedIntents).toContain('day_replan');
      expect(caps.usage.aiCommandsThisMonth).toBe(0);
    });

    it('provider surface skips dashboard AI cap check', async () => {
      businessRepo.findOne.mockResolvedValue(businessSolo);
      aiUsageService.getMonthlySummary.mockResolvedValue({
        bySurface: [{ surface: 'dashboard', requests: 25 }],
      });
      const { gateway } = buildGateway();
      await expect(
        gateway.execute({
          surface: 'provider',
          businessId: 'biz-solo',
          prompt: 'my day',
          userId: 'user-1',
          membershipRole: 'staff',
        }),
      ).resolves.toBeDefined();
    });

    it('injects starter plan tier into dashboard command context', async () => {
      businessRepo.findOne.mockResolvedValue(businessStarter);
      const { gateway, dashboardCommands } = buildGateway();
      await gateway.execute({
        surface: 'dashboard',
        businessId: 'biz-starter',
        prompt: 'optimize schedule',
        membershipRole: 'owner',
        userId: 'u1',
      });
      expect(dashboardCommands.executeCommand).toHaveBeenCalledWith(
        'biz-starter',
        'optimize schedule',
        'u1',
        expect.objectContaining({
          context: expect.objectContaining({ _planTierId: 'starter' }),
        }),
      );
    });

    it('rejects dashboard client role', async () => {
      businessRepo.findOne.mockResolvedValue(businessStarter);
      const { gateway } = buildGateway();
      await expect(
        gateway.execute({
          surface: 'dashboard',
          businessId: 'biz-starter',
          prompt: 'hi',
          membershipRole: 'client',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('ai-i10 routing budget', () => {
    it('skips complexity_route LLM for read-only prompts', async () => {
      const intelligence = {
        routeComplexity: jest.fn(async () => ({
          tier: 'orchestration' as const,
          useDecomposition: false,
        })),
      };
      const route = await resolveMergedComplexityRoute(
        'biz-starter',
        'Show appointments today',
        [],
        complexityRouter,
        intelligence,
      );
      expect(intelligence.routeComplexity).not.toHaveBeenCalled();
      expect(route.tier).toBe('read_only');
    });
  });
});
