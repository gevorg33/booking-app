import {
  Injectable,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AiCommandService } from './ai-command.service.js';
import { CustomerAiCommandService } from './customer-ai-command.service.js';
import { ProviderAiCommandService } from '../provider-mobile/provider-ai-command.service.js';
import {
  AiSurface,
  buildCapabilitiesView,
  capabilityMatrixForPrompt,
  isIntentAllowed,
  normalizeActorRole,
  type AiCapabilitiesView,
} from './ai-capability.matrix.js';
import { resolveAccessTier } from './access-control.matrix.js';
import { AiEntityMemoryService } from './ai-entity-memory.service.js';
import { AiConversationSummaryService } from './ai-conversation-summary.service.js';
import { AiRagService } from './ai-rag.service.js';
import { AiPromptSecurityService } from './ai-prompt-security.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  attachGatewayMeta,
  buildEntityMemoryLearnPayload,
  buildCustomerEntityMemoryLearnPayload,
  buildProviderEntityMemoryLearnPayload,
  shouldLearnFromCommandResult,
} from './ai-gateway-meta.util.js';
import {
  PlanEntitlementsService,
  type PlanEntitlementsView,
} from '../billing/plan-entitlements.service.js';
import { PlanLimitExceededException } from '../billing/plan-limit.exception.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiPlatformService } from './ai-platform.service.js';
import type { AiCommandSurface } from './ai-platform.util.js';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import {
  buildGatewayCommandTraceInput,
  COMMAND_TRACE_ID_CONTEXT_KEY,
  resolveCommandTraceId,
  shouldPersistCommandTrace,
} from './ai-command-trace-recorder.util.js';
import type { AiCommandTraceSurface } from './entities/ai-command-trace.entity.js';
import {
  assessPhiInAiContext,
  phiAiBlockMessage,
} from '../../common/utils/phi-ai-guard.util.js';
import {
  ASSISTANT_MODE_CONTEXT_KEY,
  resolveAssistantMode,
  type AssistantMode,
} from './ai-assistant-mode.util.js';
import {
  GUIDE_HANDOFF_CONTEXT_KEY,
  type GuideHandoffDispatch,
} from './ai-product-guide-handoff.util.js';
import {
  buildAiUnavailableErrorWithGuideLink,
  runAiUnavailableStaticGuideFallback,
  shouldOfferAiUnavailableGuideFallback,
} from './ai-product-guide-ai-unavailable.util.js';
import { AiProductGuideService } from './ai-product-guide.service.js';

export interface AiGatewayCapabilitiesView extends AiCapabilitiesView {
  usage: PlanEntitlementsView['usage'];
  atAiLimit: boolean;
  aiUsageWarning: boolean;
}

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
  /** ai-guide-1.0.3 — optional guide vs act routing; inferred from prompt when omitted. */
  assistantMode?: AssistantMode;
  /** ai-guide-1.2.5 — direct dispatch from product guide “Do this for me”. */
  guideHandoff?: GuideHandoffDispatch;
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly dashboardCommands: AiCommandService;
  private readonly customerCommands: CustomerAiCommandService;
  private readonly providerCommands: ProviderAiCommandService;
  private readonly entityMemory: AiEntityMemoryService;
  private readonly conversationSummary: AiConversationSummaryService;
  private readonly rag: AiRagService;
  private readonly promptSecurity: AiPromptSecurityService;
  private readonly planEntitlements: PlanEntitlementsService;
  private readonly aiSettings: AiSettingsService;
  private readonly platform: AiPlatformService;
  private readonly commandTrace: AiCommandTraceService;
  private readonly productGuide: AiProductGuideService;

  /* istanbul ignore start */
  constructor(
    dashboardCommands: AiCommandService,
    @Inject(forwardRef(() => CustomerAiCommandService))
    customerCommands: CustomerAiCommandService,
    @Inject(forwardRef(() => ProviderAiCommandService))
    providerCommands: ProviderAiCommandService,
    entityMemory: AiEntityMemoryService,
    conversationSummary: AiConversationSummaryService,
    rag: AiRagService,
    promptSecurity: AiPromptSecurityService,
    planEntitlements: PlanEntitlementsService,
    aiSettings: AiSettingsService,
    platform: AiPlatformService,
    commandTrace: AiCommandTraceService,
    productGuide: AiProductGuideService,
  ) {
    this.dashboardCommands = dashboardCommands;
    this.customerCommands = customerCommands;
    this.providerCommands = providerCommands;
    this.entityMemory = entityMemory;
    this.conversationSummary = conversationSummary;
    this.rag = rag;
    this.promptSecurity = promptSecurity;
    this.planEntitlements = planEntitlements;
    this.aiSettings = aiSettings;
    this.platform = platform;
    this.commandTrace = commandTrace;
    this.productGuide = productGuide;
  }
  /* istanbul ignore end */

  getCapabilityHints(surface: AiSurface, tier?: string): string {
    return capabilityMatrixForPrompt(surface, normalizeActorRole(tier));
  }

  async getCapabilities(
    businessId: string,
    surface: AiSurface,
    membershipRole?: string,
  ): Promise<AiGatewayCapabilitiesView> {
    const entitlements =
      await this.planEntitlements.getEntitlements(businessId);
    const view = buildCapabilitiesView(
      surface,
      membershipRole,
      entitlements.tierId,
    );
    return {
      ...view,
      usage: entitlements.usage,
      atAiLimit:
        surface === 'dashboard' ? entitlements.atLimit.aiCommands : false,
      aiUsageWarning:
        surface === 'dashboard' ? entitlements.aiUsageWarning : false,
    };
  }

  async execute(
    params: AiGatewayExecuteParams,
  ): Promise<CommandResult | Record<string, unknown>> {
    const startedAt = Date.now();
    const traceId = resolveCommandTraceId(params.context);
    const tier = resolveAccessTier(params.membershipRole ?? params.role);
    const surface = params.surface;

    if (surface === 'dashboard' && tier === 'client') {
      throw new ForbiddenException(
        'Dashboard AI requires a business staff, manager, or owner account.',
      );
    }

    const blocked = this.promptSecurity.preflightBlock(
      params.businessId,
      params.prompt,
      surface,
    );
    if (blocked) {
      const attached = attachGatewayMeta(blocked, surface, tier);
      this.persistCommandTrace({
        params,
        result: blocked,
        surface: this.toTraceSurface(surface),
        traceId,
        startedAt,
        role: tier,
      });
      return attached;
    }

    const businessRecord = await this.aiSettings.getBusinessRecord(
      params.businessId,
    );
    const phiGuard = assessPhiInAiContext(
      businessRecord.settings,
      businessRecord.settings?.businessType as string | undefined,
      { context: params.context, prompt: params.prompt },
    );
    if (phiGuard.blocked) {
      const phiBlocked: CommandResult = {
        success: false,
        action: 'security_blocked',
        summary: phiAiBlockMessage(phiGuard.reason),
        details: {
          securityBlocked: true,
          reason: phiGuard.reason,
          matchedFields: phiGuard.matchedFields,
          traceId,
        },
      };
      const attached = attachGatewayMeta(phiBlocked, surface, tier);
      this.persistCommandTrace({
        params,
        result: phiBlocked,
        surface: this.toTraceSurface(surface),
        traceId,
        startedAt,
        role: tier,
      });
      return attached;
    }

    if (surface === 'dashboard') {
      try {
        await this.planEntitlements.assertCanRunDashboardAiCommand(
          params.businessId,
        );
      } catch (error) {
        if (
          error instanceof PlanLimitExceededException &&
          shouldOfferAiUnavailableGuideFallback(params.prompt, surface, {
            context: params.context,
          })
        ) {
          const fallback = await runAiUnavailableStaticGuideFallback({
            productGuide: this.productGuide,
            businessId: params.businessId,
            prompt: params.prompt,
            surface: 'dashboard',
            reason: 'quota_exceeded',
            session: { context: params.context },
            userId: params.userId,
            locale:
              typeof params.context?.locale === 'string'
                ? params.context.locale
                : undefined,
          });
          if (fallback) {
            const attached = attachGatewayMeta(fallback, surface, tier);
            this.persistCommandTrace({
              params,
              result: fallback,
              surface: this.toTraceSurface(surface),
              traceId,
              startedAt,
              role: tier,
            });
            return attached;
          }
        }
        throw error;
      }
    }

    const entitlements = await this.planEntitlements.getEntitlements(
      params.businessId,
    );
    const aiConfig = await this.aiSettings.getSettings(params.businessId);
    const roleProfile = this.platform.resolveRoleProfile(
      params.membershipRole ?? params.role,
      aiConfig,
    );
    const { scope, classifierHint } = this.platform.resolveBranchContext(
      params.context,
      aiConfig,
    );
    const { high: confidenceHigh, abVariantId } =
      this.platform.resolveConfidenceForExperiment(
        params.businessId,
        aiConfig.confidence.high,
        aiConfig,
      );

    const [memoryBlock, entityMemory, ragBlock] = await Promise.all([
      this.entityMemory.buildMemoryContextBlock(params.businessId),
      this.entityMemory.getEntityMemory(params.businessId),
      this.rag.buildRagContextBlock(params.businessId, params.prompt),
    ]);

    const historyChannel =
      params.surface === 'dashboard'
        ? 'dashboard'
        : params.surface === 'customer'
          ? 'customer'
          : 'provider_mobile';
    const { history, summaryBlock } =
      await this.conversationSummary.prepareHistoryForClassifier(
        params.businessId,
        params.history,
        historyChannel,
      );

    const enrichedContext: Record<string, unknown> = {
      ...params.context,
      [ASSISTANT_MODE_CONTEXT_KEY]: resolveAssistantMode({
        prompt: params.prompt,
        surface: params.surface,
        explicit: params.assistantMode ?? params.context?.[ASSISTANT_MODE_CONTEXT_KEY],
      }),
      _capabilityHints: this.getCapabilityHints(params.surface, tier),
      _entityMemoryBlock: memoryBlock || undefined,
      _entityMemoryAliases: entityMemory.aliases,
      _conversationSummary: summaryBlock || undefined,
      _ragContextBlock: ragBlock || undefined,
      _accessTier: tier,
      _actorRole: tier,
      _roleProfile: roleProfile,
      _membershipRole: params.membershipRole ?? params.role,
      _planTierId: entitlements.tierId,
      _scopedEmployeeId: params.employeeId ?? null,
      _locationId: scope.locationId,
      _branchHint: classifierHint ?? undefined,
      _confidenceHigh: confidenceHigh,
      _abVariantId: abVariantId,
      [COMMAND_TRACE_ID_CONTEXT_KEY]: traceId,
      ...(params.guideHandoff
        ? { [GUIDE_HANDOFF_CONTEXT_KEY]: params.guideHandoff }
        : {}),
    };

    if (params.surface === 'customer') {
      const result = await this.customerCommands.executeCommand(
        params.businessId,
        params.prompt,
        history,
        enrichedContext,
      );

      if (shouldLearnFromCommandResult(result)) {
        void this.entityMemory.learnFromCommand(
          params.businessId,
          params.prompt,
          result.action,
          buildCustomerEntityMemoryLearnPayload(result),
          'customer',
        );
      }

      const attached = attachGatewayMeta(result, params.surface, tier);
      void this.recordOutcome(
        params,
        result,
        'customer',
        roleProfile,
        scope.locationId,
        abVariantId,
      );
      this.persistCommandTrace({
        params,
        result,
        surface: 'customer',
        traceId,
        startedAt,
        role: roleProfile,
      });
      return attached;
    }

    if (params.surface === 'provider') {
      if (!params.userId) {
        throw new ForbiddenException('Provider AI requires authenticated user');
      }
      const result = await this.providerCommands.executeCommand(
        params.businessId,
        params.userId,
        params.prompt,
        history,
        {
          ...enrichedContext,
          confirmed: params.confirmed === true,
        },
      );

      if (shouldLearnFromCommandResult(result)) {
        void this.entityMemory.learnFromCommand(
          params.businessId,
          params.prompt,
          result.action,
          buildProviderEntityMemoryLearnPayload(
            result as unknown as Record<string, unknown>,
          ),
          'provider_mobile',
        );
      }

      void this.recordOutcome(
        params,
        result,
        'provider',
        roleProfile,
        scope.locationId,
        abVariantId,
      );
      this.persistCommandTrace({
        params,
        result,
        surface: 'provider',
        traceId,
        startedAt,
        role: roleProfile,
      });
      return result;
    }

    const result = await this.dashboardCommands.executeCommand(
      params.businessId,
      params.prompt,
      params.userId,
      {
        history,
        context: enrichedContext,
        confirmed: params.confirmed === true,
      },
    );

    if (shouldLearnFromCommandResult(result)) {
      void this.entityMemory.learnFromCommand(
        params.businessId,
        params.prompt,
        result.action,
        buildEntityMemoryLearnPayload(result),
      );
    }

    const attached = attachGatewayMeta(result, params.surface, tier);
    void this.recordOutcome(
      params,
      result,
      surface,
      roleProfile,
      scope.locationId,
      abVariantId,
    );
    this.persistCommandTrace({
      params,
      result,
      surface: this.toTraceSurface(surface),
      traceId,
      startedAt,
      role: roleProfile,
    });
    return attached;
  }

  private toTraceSurface(surface: AiSurface): AiCommandTraceSurface {
    if (surface === 'customer') return 'customer';
    if (surface === 'provider') return 'provider';
    return 'dashboard';
  }

  private persistCommandTrace(opts: {
    params: AiGatewayExecuteParams;
    result: CommandResult;
    surface: AiCommandTraceSurface;
    traceId: string;
    startedAt: number;
    role?: string;
  }): void {
    if (!shouldPersistCommandTrace(opts.result)) return;
    const input = buildGatewayCommandTraceInput({
      params: opts.params,
      result: opts.result,
      surface: opts.surface,
      role: opts.role,
      traceId: opts.traceId,
      latencyMs: Date.now() - opts.startedAt,
    });
    this.commandTrace.recordFireAndForget(input);
  }

  private recordOutcome(
    params: AiGatewayExecuteParams,
    result: CommandResult,
    surface: AiCommandSurface,
    roleProfile: string,
    locationId?: string,
    abVariantId?: string,
  ) {
    void this.platform.recordCommandOutcome({
      businessId: params.businessId,
      userId: params.userId,
      result,
      surface,
      locationId,
      roleProfile:
        roleProfile as import('./ai-settings.types.js').AiRoleProfile,
      abVariantId,
      autoExecuted: Boolean(result.details?.autoExecuted),
    });
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
    return this.dashboardCommands.approveTask(
      taskId,
      userId ?? 'system',
      businessId,
    );
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

  assertIntentAllowed(
    surface: AiSurface,
    tier: string | undefined,
    action: string,
  ): void {
    if (!isIntentAllowed(surface, normalizeActorRole(tier), action)) {
      throw new ForbiddenException(
        `Action "${action}" is not allowed for your role on ${surface}.`,
      );
    }
  }
}
