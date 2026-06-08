import { Between } from 'typeorm';
import type { Repository } from 'typeorm';
import { EventType } from '../../events/event-types.js';
import type { EventStoreService } from '../../events/store/event-store.service.js';
import type { AgentTask } from '../../engine/agent/agent-task.entity.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { AiEventsService } from './ai-events.service.js';
import type {
  BusinessCatalog,
  CommandResult,
} from './command-completion.types.js';
import type { AiSettings, AiSuggestionVariant } from './ai-settings.types.js';
import type { AiSuggestion } from './ai-suggestions.service.js';
import {
  aggregateCommandMetrics,
  buildBranchClassifierHint,
  buildCommandMetricPayload,
  buildPublicAssistantDeniedResult,
  filterBookingsByBranch,
  isTaskStuck,
  pickActiveAbExperiment,
  resolveAbSuggestionVariant,
  resolveBranchScope,
  resolveHitlSlaMinutes,
  isIntentAllowedForRoleProfile,
  resolveVerticalPlugin,
  rescueVerticalIntent,
  scopeEmployeesByBranchActivity,
  validatePublicAssistantAction,
  validateCustomerAssistantAction,
  buildCustomerAssistantDeniedResult,
  type AiCommandMetricEvent,
  type AiCommandMetricsSummary,
  type AiCommandSurface,
  type AiRoleProfile,
  type BranchScope,
} from './ai-platform.util.js';
import type { AiAccuracyAnalyticsSummary } from './ai-platform.util.js';
import type { AiCommandTraceService } from './ai-command-trace.service.js';
import {
  buildHitlEscalationPlanMeta,
  buildHitlEscalationPlanSteps,
} from './ai-platform-plan.util.js';

export interface PlatformLogicDeps {
  eventStore: EventStoreService;
  bookingRepo: Repository<Booking>;
  businessRepo: Repository<Business>;
  agentTaskRepo: Repository<AgentTask>;
  aiEvents: AiEventsService;
  commandTrace?: Pick<
    AiCommandTraceService,
    'getAccuracyAnalytics' | 'loadTraceAnalyticsRowsForEval'
  >;
}

export async function applyBranchScopeToCatalogLogic(
  deps: PlatformLogicDeps,
  businessId: string,
  catalog: BusinessCatalog,
  scope: BranchScope,
): Promise<BusinessCatalog> {
  if (!scope.locationId) return catalog;

  const rangeStart = new Date();
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 90);
  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      locationId: scope.locationId,
      startTime: Between(rangeStart, new Date()),
    },
    select: { employeeId: true },
  });

  const employeeIds = new Set(
    bookings.map((b) => b.employeeId).filter((id): id is string => Boolean(id)),
  );

  return {
    ...catalog,
    employees: scopeEmployeesByBranchActivity(
      catalog.employees,
      employeeIds,
      scope.locationId,
    ),
  };
}

export function resolveBranchContextLogic(
  context: Record<string, unknown> | undefined,
  settings: AiSettings,
): { scope: BranchScope; classifierHint: string | null } {
  const scope = resolveBranchScope(context, settings.enterprise);
  return { scope, classifierHint: buildBranchClassifierHint(scope) };
}

export function gateRoleProfileIntentLogic(
  profile: AiRoleProfile,
  surface: AiCommandSurface,
  action: string,
): CommandResult | null {
  if (isIntentAllowedForRoleProfile(profile, surface, action)) return null;
  return {
    success: false,
    action: 'security_blocked',
    summary: `Your role (${profile}) cannot run "${action}" on ${surface}. Ask an owner or manager.`,
    details: { roleProfile: profile, blockedAction: action },
  };
}

export function rescueVerticalIntentLogic(
  prompt: string,
  businessType: string | undefined,
  settings: AiSettings,
): { action: string; rescueReason: string } | null {
  const plugin = resolveVerticalPlugin(businessType, settings.enterprise);
  return rescueVerticalIntent(prompt, plugin);
}

export function applyAbToSuggestionsLogic(
  businessId: string,
  suggestions: AiSuggestion[],
  settings: AiSettings,
): { suggestions: AiSuggestion[]; variant: AiSuggestionVariant | null } {
  const experiment = pickActiveAbExperiment(settings.enterprise?.abExperiments);
  if (!experiment) return { suggestions, variant: null };

  const variant = resolveAbSuggestionVariant(businessId, experiment)!;

  const patched = suggestions.map((s) =>
    s.id === 'apply-week' || s.id === 'fill-gaps'
      ? { ...s, title: variant.title, prompt: variant.prompt }
      : s,
  );
  return { suggestions: patched, variant };
}

export async function recordCommandOutcomeLogic(
  deps: PlatformLogicDeps,
  params: {
    businessId: string;
    userId?: string;
    result: CommandResult | Record<string, unknown>;
    surface: AiCommandSurface;
    locationId?: string;
    roleProfile?: AiRoleProfile;
    abVariantId?: string;
    autoExecuted?: boolean;
  },
): Promise<void> {
  const metric = buildCommandMetricPayload(params);
  await deps.eventStore.publish({
    eventType: EventType.AI_COMMAND_RECORDED,
    aggregateType: 'ai_command',
    aggregateId: crypto.randomUUID(),
    businessId: params.businessId,
    userId: params.userId,
    payload: metric,
  });
}

export async function getCommandAnalyticsLogic(
  deps: PlatformLogicDeps,
  businessId: string,
  periodDays = 30,
): Promise<AiCommandMetricsSummary> {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - periodDays);

  const events = await deps.eventStore.getEvents({
    businessId,
    eventType: EventType.AI_COMMAND_RECORDED,
    startDate: start,
    endDate: new Date(),
    limit: 5000,
  });

  const metrics: AiCommandMetricEvent[] = events.map(
    (e) => e.payload as AiCommandMetricEvent,
  );
  const summary = aggregateCommandMetrics(metrics, periodDays);

  if (deps.commandTrace) {
    try {
      summary.accuracy = await deps.commandTrace.getAccuracyAnalytics(
        businessId,
        periodDays,
      );
    } catch {
      // Trace table may be unavailable during rollout — keep legacy metrics.
    }
  }

  return summary;
}

export function gatePublicAssistantActionLogic(
  action: string,
): CommandResult | null {
  if (validatePublicAssistantAction(action)) return null;
  return buildPublicAssistantDeniedResult(action);
}

export function gateCustomerAssistantActionLogic(
  action: string,
): CommandResult | null {
  if (validateCustomerAssistantAction(action)) return null;
  return buildCustomerAssistantDeniedResult(action);
}

export async function scanStuckTasksForEscalationLogic(
  deps: PlatformLogicDeps,
  businessId: string,
  settings: AiSettings,
): Promise<Array<{ taskId: string; intent: string; stuckMinutes: number }>> {
  const slaMinutes = resolveHitlSlaMinutes(settings.enterprise);
  const tasks = await deps.agentTaskRepo.find({
    where: { businessId },
    order: { updatedAt: 'ASC' },
    take: 100,
  });

  const now = new Date();
  const escalations: Array<{
    taskId: string;
    intent: string;
    stuckMinutes: number;
  }> = [];

  for (const task of tasks) {
    if (!isTaskStuck(task.updatedAt, task.status, slaMinutes, now)) continue;
    const stuckMinutes = Math.floor(
      (now.getTime() - task.updatedAt.getTime()) / 60000,
    );
    const already = (task.context as Record<string, unknown>)?._escalatedAt;
    if (already) continue;
    escalations.push({ taskId: task.id, intent: task.intent, stuckMinutes });
  }

  return escalations;
}

export async function escalateStuckTaskLogic(
  deps: PlatformLogicDeps,
  businessId: string,
  taskId: string,
  intent: string,
  stuckMinutes: number,
): Promise<void> {
  const steps = buildHitlEscalationPlanSteps({
    businessId,
    taskId,
    intent,
    stuckMinutes,
  });
  const meta = buildHitlEscalationPlanMeta({ intent, taskId, stuckMinutes });

  await deps.eventStore.publish({
    eventType: EventType.AI_TASK_ESCALATED,
    aggregateType: 'agent_task',
    aggregateId: taskId,
    businessId,
    payload: { intent, stuckMinutes, steps, meta },
  });

  deps.aiEvents.emitAlert(businessId, {
    alertType: 'approval',
    title: 'AI task needs attention',
    message: meta.reasoning,
    taskId,
    route: '/dashboard/ai-ops',
  });

  const task = await deps.agentTaskRepo.findOne({
    where: { id: taskId, businessId },
  });
  if (task) {
    task.context = { ...task.context, _escalatedAt: new Date().toISOString() };
    await deps.agentTaskRepo.save(task);
  }
}

export function filterBookingsForBranchLogic<
  T extends { locationId?: string | null },
>(bookings: T[], scope: BranchScope): T[] {
  return filterBookingsByBranch(bookings, scope.locationId);
}
