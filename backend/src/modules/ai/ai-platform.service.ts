import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { AgentTask } from '../../engine/agent/agent-task.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { AiEventsService } from './ai-events.service.js';
import type {
  BusinessCatalog,
  CommandResult,
} from './command-completion.types.js';
import type { AiSettings } from './ai-settings.types.js';
import { resolveClassificationAppendixVariantId as resolveClassificationAppendixVariantIdUtil } from './ai-classification-ab-harness.util.js';
import type { AiSuggestion } from './ai-suggestions.service.js';
import {
  applyAbToSuggestionsLogic,
  applyBranchScopeToCatalogLogic,
  escalateStuckTaskLogic,
  filterBookingsForBranchLogic,
  gatePublicAssistantActionLogic,
  gateCustomerAssistantActionLogic,
  gateRoleProfileIntentLogic,
  getCommandAnalyticsLogic,
  recordCommandOutcomeLogic,
  rescueVerticalIntentLogic,
  resolveBranchContextLogic,
  scanStuckTasksForEscalationLogic,
  type PlatformLogicDeps,
} from './ai-platform.logic.js';
import {
  buildVerticalClassifierHints,
  enrichPublicSessionWithOrchestrationRules,
  resolveAiRoleProfile,
  resolveExperimentConfidenceHigh,
  resolveVerticalPlugin,
  pickActiveAbExperiment,
  type AiCommandSurface,
  type AiRoleProfile,
  type BranchScope,
} from './ai-platform.util.js';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { mergeAutofillWatchdogIntoSession } from './ai-n99-wrong-execution-watchdog.util.js';

@Injectable()
export class AiPlatformService {
  private readonly deps: PlatformLogicDeps;

  constructor(
    eventStore: EventStoreService,
    aiEvents: AiEventsService,
    commandTrace: AiCommandTraceService,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(AgentTask) agentTaskRepo: Repository<AgentTask>,
  ) {
    this.deps = {
      eventStore,
      bookingRepo,
      businessRepo,
      agentTaskRepo,
      aiEvents,
      commandTrace,
    };
  }

  resolveBranchContext(
    context: Record<string, unknown> | undefined,
    settings: AiSettings,
  ) {
    return resolveBranchContextLogic(context, settings);
  }

  async scopeCatalog(
    businessId: string,
    catalog: BusinessCatalog,
    scope: BranchScope,
  ): Promise<BusinessCatalog> {
    return applyBranchScopeToCatalogLogic(
      this.deps,
      businessId,
      catalog,
      scope,
    );
  }

  filterBookingsForBranch<T extends { locationId?: string | null }>(
    bookings: T[],
    scope: BranchScope,
  ) {
    return filterBookingsForBranchLogic(bookings, scope);
  }

  resolveRoleProfile(
    membershipRole: string | undefined,
    settings: AiSettings,
  ): AiRoleProfile {
    return resolveAiRoleProfile(membershipRole, settings.enterprise);
  }

  gateRoleIntent(
    profile: AiRoleProfile,
    surface: AiCommandSurface,
    action: string,
  ) {
    return gateRoleProfileIntentLogic(profile, surface, action);
  }

  rescueVerticalIntent(
    prompt: string,
    businessType: string | undefined,
    settings: AiSettings,
  ) {
    return rescueVerticalIntentLogic(prompt, businessType, settings);
  }

  buildVerticalHints(
    businessType: string | undefined,
    settings: AiSettings,
  ): string {
    const plugin = resolveVerticalPlugin(businessType, settings.enterprise);
    return buildVerticalClassifierHints(plugin);
  }

  enrichPublicSession(
    session: Record<string, unknown> | undefined,
    businessType: string | undefined,
    settings: AiSettings,
  ) {
    const plugin = resolveVerticalPlugin(businessType, settings.enterprise);
    return enrichPublicSessionWithOrchestrationRules(session, plugin);
  }

  gatePublicAction(action: string) {
    return gatePublicAssistantActionLogic(action);
  }

  gateCustomerAction(action: string) {
    return gateCustomerAssistantActionLogic(action);
  }

  applyAbToSuggestions(
    businessId: string,
    suggestions: AiSuggestion[],
    settings: AiSettings,
  ) {
    return applyAbToSuggestionsLogic(businessId, suggestions, settings);
  }

  resolveConfidenceForExperiment(
    businessId: string,
    baseHigh: number,
    settings: AiSettings,
  ) {
    const experiment = pickActiveAbExperiment(
      settings.enterprise?.abExperiments,
    );
    return resolveExperimentConfidenceHigh(baseHigh, experiment, businessId);
  }

  resolveClassificationAppendixVariantId(
    businessId: string,
    settings: AiSettings,
  ) {
    return resolveClassificationAppendixVariantIdUtil(businessId, settings);
  }

  recordCommandOutcome(params: {
    businessId: string;
    userId?: string;
    result: CommandResult | Record<string, unknown>;
    surface: AiCommandSurface;
    locationId?: string;
    roleProfile?: AiRoleProfile;
    abVariantId?: string;
    autoExecuted?: boolean;
  }) {
    return recordCommandOutcomeLogic(this.deps, params);
  }

  getCommandAnalytics(businessId: string, periodDays = 30) {
    return getCommandAnalyticsLogic(this.deps, businessId, periodDays);
  }

  /** n99-2.7 — tighten autofill confidence when undo/👎 rate rises on auto-fill traces. */
  async hydrateAutofillWatchdogSession(
    businessId: string,
    sessionContext: Record<string, unknown>,
    periodDays = 7,
  ): Promise<void> {
    if (typeof sessionContext._autoFillFieldThreshold === 'number') return;
    if (!this.deps.commandTrace?.loadTraceAnalyticsRowsForEval) return;
    try {
      const rows = await this.deps.commandTrace.loadTraceAnalyticsRowsForEval(
        businessId,
        periodDays,
      );
      mergeAutofillWatchdogIntoSession(sessionContext, rows);
    } catch {
      // Trace unavailable — keep default autofill threshold.
    }
  }

  scanStuckTasks(businessId: string, settings: AiSettings) {
    return scanStuckTasksForEscalationLogic(this.deps, businessId, settings);
  }

  escalateStuckTask(
    businessId: string,
    taskId: string,
    intent: string,
    stuckMinutes: number,
  ) {
    return escalateStuckTaskLogic(
      this.deps,
      businessId,
      taskId,
      intent,
      stuckMinutes,
    );
  }
}
