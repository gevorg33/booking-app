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
import { AiSettingsService } from './ai-settings.service.js';
import { AiPlatformService } from './ai-platform.service.js';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { AiClassificationEngineService } from './ai-classification-engine.service.js';
import type { AiCommandSurface } from './ai-platform.util.js';
import {
  assessPhiInAiContext,
  phiAiBlockMessage,
} from '../../common/utils/phi-ai-guard.util.js';

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
  private readonly classificationEngine: AiClassificationEngineService;

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
    classificationEngine: AiClassificationEngineService,
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
    this.classificationEngine = classificationEngine;
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
    const traceId = crypto.randomUUID();
    const startedAtMs = Date.now();
    const tier = resolveAccessTier(params.membershipRole ?? params.role);
    const surface = params.surface;

    if (surface === 'dashboard' && tier === 'client') {
      throw new ForbiddenException(
        'Dashboard AI requires a business staff, manager, or owner account.',
      );
    }

    const businessRecord = await this.aiSettings.getBusinessRecord(
      params.businessId,
    );
    const businessSettings = businessRecord.settings as Record<string, unknown>;

    const blocked = this.promptSecurity.preflightBlock(
      params.businessId,
      params.prompt,
      surface,
    );
    if (blocked) {
      const attached = attachGatewayMeta(blocked, surface, tier, traceId);
      void this.recordTrace(
        params,
        attached,
        traceId,
        startedAtMs,
        tier,
        businessSettings,
      );
      return attached;
    }

    const phiGuard = assessPhiInAiContext(
      businessRecord.settings,
      businessRecord.settings?.businessType as string | undefined,
      { context: params.context, prompt: params.prompt },
    );
    if (phiGuard.blocked) {
      const blockedResult = attachGatewayMeta(
        {
          success: false,
          action: 'security_blocked',
          summary: phiAiBlockMessage(phiGuard.reason),
          details: {
            securityBlocked: true,
            reason: phiGuard.reason,
            matchedFields: phiGuard.matchedFields,
          },
        },
        surface,
        tier,
        traceId,
      );
      void this.recordTrace(
        params,
        blockedResult,
        traceId,
        startedAtMs,
        tier,
        businessSettings,
      );
      return blockedResult;
    }

    if (surface === 'dashboard') {
      await this.planEntitlements.assertCanRunDashboardAiCommand(
        params.businessId,
      );
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
    const classificationAbVariantId =
      this.platform.resolveClassificationAppendixVariantId(
        params.businessId,
        aiConfig,
      );

    const [memoryBlock, entityMemory, ragBlock] = await Promise.all([
      this.entityMemory.buildMemoryContextBlock(params.businessId),
      this.entityMemory.getEntityMemory(params.businessId),
      this.rag.buildRagContextBlock(params.businessId, params.prompt),
    ]);
    const classificationAppendix =
      await this.classificationEngine.buildClassifierAppendix({
        businessId: params.businessId,
        prompt: params.prompt,
        surface: params.surface,
        entityMemory,
        abVariantId: classificationAbVariantId,
      });

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
      _traceId: traceId,
      _capabilityHints: this.getCapabilityHints(params.surface, tier),
      _entityMemoryBlock: memoryBlock || undefined,
      _entityMemoryAliases: entityMemory.aliases,
      _entityMemoryParaphrases: entityMemory.paraphrases ?? [],
      _conversationSummary: summaryBlock || undefined,
      _ragContextBlock: ragBlock || undefined,
      _classificationEngineBlock: classificationAppendix.block || undefined,
      _classificationEngineMeta: {
        fewShotCount: classificationAppendix.fewShotCount,
        shortlistCount: classificationAppendix.shortlistCount,
        shortlist: classificationAppendix.shortlist,
        abVariantId: classificationAppendix.abVariantId,
      },
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

      const attached = attachGatewayMeta(result, params.surface, tier, traceId);
      void this.recordOutcome(
        params,
        attached,
        'customer',
        roleProfile,
        scope.locationId,
        abVariantId,
      );
      void this.recordTrace(
        params,
        attached,
        traceId,
        startedAtMs,
        tier,
        businessSettings,
        scope.locationId,
        abVariantId,
        enrichedContext,
      );
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
      const attached = attachGatewayMeta(
        result as CommandResult,
        params.surface,
        tier,
        traceId,
      );
      void this.recordTrace(
        params,
        attached,
        traceId,
        startedAtMs,
        tier,
        businessSettings,
        scope.locationId,
        abVariantId,
        enrichedContext,
      );
      return attached;
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

    const attached = attachGatewayMeta(result, params.surface, tier, traceId);
    void this.recordOutcome(
      params,
      attached,
      surface,
      roleProfile,
      scope.locationId,
      abVariantId,
    );
    void this.recordTrace(
      params,
      attached,
      traceId,
      startedAtMs,
      tier,
      businessSettings,
      scope.locationId,
      abVariantId,
      enrichedContext,
    );
    return attached;
  }

  private recordTrace(
    params: AiGatewayExecuteParams,
    result: CommandResult | Record<string, unknown>,
    traceId: string,
    startedAtMs: number,
    tier: string,
    businessSettings?: Record<string, unknown>,
    locationId?: string,
    abVariantId?: string,
    context?: Record<string, unknown>,
  ) {
    const routingTier = (
      context?._complexityRoute as { tier?: string } | undefined
    )?.tier;
    void this.commandTrace.recordTrace({
      traceId,
      businessId: params.businessId,
      surface: params.surface as AiCommandSurface,
      userId: params.userId,
      role: tier,
      rawPrompt: params.prompt,
      result,
      startedAtMs,
      locationId,
      abVariantId,
      businessSettings,
      routingTier,
    });
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
