import { Injectable, ForbiddenException, Logger, Inject, forwardRef } from '@nestjs/common';
import { AiCommandService } from './ai-command.service.js';
import { ProviderAiCommandService } from '../provider-mobile/provider-ai-command.service.js';
import {
  AiSurface,
  capabilityMatrixForPrompt,
  isIntentAllowed,
  normalizeActorRole,
} from './ai-capability.matrix.js';
import { resolveAccessTier } from './access-control.matrix.js';
import { AiEntityMemoryService } from './ai-entity-memory.service.js';
import { AiConversationSummaryService } from './ai-conversation-summary.service.js';
import { AiIntelligenceService } from './ai-intelligence.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { AiPromptSecurityService } from './ai-prompt-security.service.js';
import type { CommandResult } from './command-completion.types.js';
import { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';

export interface AiGatewayExecuteParams {
  surface: AiSurface;
  businessId: string;
  prompt: string;
  userId?: string;
  /** Business membership role from JWT (owner | admin | manager | staff | contributor). */
  membershipRole?: string;
  /** @deprecated Use membershipRole */
  role?: string;
  employeeId?: string | null;
  confirmed?: boolean;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: Record<string, unknown>;
  autoSubmit?: boolean;
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    private dashboardCommands: AiCommandService,
    @Inject(forwardRef(() => ProviderAiCommandService))
    private providerCommands: ProviderAiCommandService,
    private entityMemory: AiEntityMemoryService,
    private conversationSummary: AiConversationSummaryService,
    private intelligence: AiIntelligenceService,
    private complexityRouter: CommandComplexityRouterService,
    private promptSecurity: AiPromptSecurityService,
    private planEntitlements: PlanEntitlementsService,
  ) {}

  getCapabilityHints(surface: AiSurface, tier?: string): string {
    return capabilityMatrixForPrompt(surface, normalizeActorRole(tier));
  }

  async execute(params: AiGatewayExecuteParams): Promise<CommandResult | Record<string, unknown>> {
    const tier = resolveAccessTier(params.membershipRole ?? params.role);
    const surface = params.surface;

    if (surface === 'dashboard' && tier === 'client') {
      throw new ForbiddenException(
        'Dashboard AI requires a business staff, manager, or owner account.',
      );
    }

    const blocked = this.promptSecurity.preflightBlock(params.businessId, params.prompt, surface);
    if (blocked) {
      return this.attachGatewayMeta(blocked, surface, tier);
    }

    if (surface === 'dashboard') {
      await this.planEntitlements.assertCanRunDashboardAiCommand(params.businessId);
    }

    const memoryBlock = await this.entityMemory.buildMemoryContextBlock(params.businessId);

    const { history, summaryBlock } = await this.conversationSummary.prepareHistoryForClassifier(
      params.businessId,
      params.history,
      params.surface === 'dashboard' ? 'dashboard' : 'provider_mobile',
    );

    const enrichedContext: Record<string, unknown> = {
      ...params.context,
      _capabilityHints: this.getCapabilityHints(params.surface, tier),
      _entityMemoryBlock: memoryBlock || undefined,
      _conversationSummary: summaryBlock || undefined,
      _accessTier: tier,
      _actorRole: tier,
      _scopedEmployeeId: params.employeeId ?? null,
    };

    if (params.surface === 'provider') {
      if (!params.userId) {
        throw new ForbiddenException('Provider AI requires authenticated user');
      }
      return this.providerCommands.executeCommand(
        params.businessId,
        params.userId,
        params.prompt,
        history,
        {
          ...enrichedContext,
          confirmed: params.confirmed === true,
        },
      );
    }

    const route = this.complexityRouter.mergeRoutes(
      await this.intelligence.routeComplexity(params.businessId, params.prompt, 'dashboard'),
      this.complexityRouter.routeDeterministic(params.prompt),
    );
    enrichedContext._complexityRoute = route;

    const result = await this.dashboardCommands.executeCommand(
      params.businessId,
      params.prompt,
      params.userId,
      {
        history,
        context: { ...enrichedContext, _complexityRoute: route },
        confirmed: params.confirmed === true,
      },
    );

    if (result.success && result.action !== 'error' && result.action !== 'unknown') {
      void this.entityMemory.learnFromCommand(
        params.businessId,
        params.prompt,
        result.action,
        {
          ...(result.details?.params ?? {}),
          employee: result.details?.employee,
          service: result.details?.serviceName,
        },
      );
    }

    return this.attachGatewayMeta(result, params.surface, tier);
  }

  async approveTask(
    businessId: string,
    taskId: string,
    userId?: string,
    surface: AiSurface = 'dashboard',
  ) {
    if (surface === 'provider') {
      throw new ForbiddenException('Plan approval is dashboard-only');
    }
    return this.dashboardCommands.approveTask(taskId, userId ?? 'system', businessId);
  }

  async retryFailedStep(
    businessId: string,
    taskId: string,
    stepId: string,
    userId?: string,
  ) {
    return this.dashboardCommands.retryWorkflowStep(
      businessId,
      taskId,
      stepId,
      userId ?? 'system',
    );
  }

  assertIntentAllowed(surface: AiSurface, tier: string | undefined, action: string): void {
    if (!isIntentAllowed(surface, normalizeActorRole(tier), action)) {
      throw new ForbiddenException(
        `Action "${action}" is not allowed for your role on ${surface}.`,
      );
    }
  }

  private attachGatewayMeta(
    result: CommandResult,
    surface: AiSurface,
    tier: ReturnType<typeof resolveAccessTier>,
  ): CommandResult {
    return {
      ...result,
      details: {
        ...result.details,
        gateway: { surface, tier },
        executionTimeline: result.details?.executionTimeline ?? result.details?.workflowSteps,
      },
    };
  }
}
