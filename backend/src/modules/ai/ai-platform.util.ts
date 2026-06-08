import type { AiEvalLabelQueueSource } from './entities/ai-eval-label-queue.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type {
  AiAbExperiment,
  AiEnterpriseSettings,
  AiRoleProfile,
  AiSuggestionVariant,
} from './ai-settings.types.js';

export type { AiRoleProfile } from './ai-settings.types.js';
import type { AccessTier } from './access-control.matrix.js';
import { resolveAccessTier } from './access-control.matrix.js';
import { resolveVerticalPlaybookId } from '../onboarding/vertical-playbooks.constants.js';
import {
  CUSTOMER_INTENTS,
  PUBLIC_ASSISTANT_INTENTS as REGISTRY_PUBLIC_ASSISTANT_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';

export type AiCommandSurface = 'dashboard' | 'provider' | 'customer' | 'public';

export type AiCommandOutcome =
  | 'success'
  | 'clarify'
  | 'approval'
  | 'security_blocked'
  | 'failed'
  | 'unknown';

export interface BranchScope {
  locationId?: string;
  locationName?: string;
}

export interface AiCommandMetricEvent {
  outcome: AiCommandOutcome;
  action: string;
  surface: AiCommandSurface;
  locationId?: string;
  roleProfile?: AiRoleProfile;
  abVariantId?: string;
  clarify?: boolean;
  approval?: boolean;
  autoExecuted?: boolean;
  timestamp: string;
}

export interface AiConfusionMatrixEntry {
  from: string;
  to: string;
  count: number;
  share: number;
  retryCount: number;
  undoCount: number;
}

export interface AiConfusionMatrixExport {
  periodDays: number;
  totalCorrections: number;
  pairs: AiConfusionMatrixEntry[];
}

/** acc-1.10 — anonymized failing / low-confidence prompt cluster for triage. */
export interface AiWorstPromptFailureSignals {
  suspected_miss: number;
  wrong_execution: number;
  clarify_abandoned: number;
  thumbs_down: number;
  failed_outcome: number;
  low_confidence: number;
  /** acc-6.7 — human handoff / request_human_help traces. */
  human_escalation: number;
}

export interface AiWorstPromptEntry {
  rank: number;
  promptHash: string;
  promptSnippet: string;
  action: string;
  surface: string;
  locale: string;
  failureCount: number;
  avgConfidence: number | null;
  failureSignals: AiWorstPromptFailureSignals;
  correctedAction: string | null;
  lastSeenAt: string;
  /** acc-4.8 — distinguish bad clarifies queued for labeling. */
  harvestSource?: 'harvest' | 'clarify_quality' | 'escalation';
  clarifyKind?: string | null;
  nextTurnOutcome?: string;
}

/** acc-4.8 — clarify turns that failed to resolve on the next user message. */
export interface AiWorstClarifyEntry {
  rank: number;
  promptHash: string;
  promptSnippet: string;
  action: string;
  surface: string;
  locale: string;
  clarifyKind: string | null;
  failureCount: number;
  nextTurnOutcome: string;
  lastSeenAt: string;
}

export interface AiWorstPromptsExport {
  periodDays: number;
  totalFailures: number;
  prompts: AiWorstPromptEntry[];
}

/** Draft eval cases for acc-2 labeling queue (acc-1.10 → acc-2.1). */
export interface AiWorstPromptEvalDraft {
  id: string;
  prompt: string;
  locale: 'en' | 'hy' | 'ru' | 'translit';
  surface: 'dashboard' | 'provider' | 'customer' | 'public';
  expect: {
    action?: string;
    rescuedAction?: string;
  };
  source: 'acc-1.10';
  promptHash: string;
  triageRank: number;
  note: string;
}

export interface AiWorstPromptsEvalExport {
  periodDays: number;
  generatedAt: string;
  businessId: string;
  drafts: AiWorstPromptEvalDraft[];
}

/** acc-2.1/2.2 — production prompt labeling queue. */
export type AiEvalLabelQueueStatus =
  | 'pending'
  | 'labeled'
  | 'dismissed'
  | 'exported';

export type AiEvalLabelOutcome = 'execution' | 'clarify';

export interface AiEvalLabelQueueItem {
  id: string;
  promptHash: string;
  promptSnippet: string;
  locale: string;
  surface: string;
  classifiedAction: string;
  correctedAction: string | null;
  confidence: number | null;
  failureCount: number;
  failureSignals: AiWorstPromptFailureSignals | null;
  status: AiEvalLabelQueueStatus;
  labelOutcome: AiEvalLabelOutcome;
  expectedAction: string | null;
  expectedRescuedAction: string | null;
  rescueFromAction: string | null;
  expectedParams: Record<string, unknown> | null;
  expectedClarifyFields: string[] | null;
  evalCaseId: string | null;
  source: AiEvalLabelQueueSource;
  fixType?: string | null;
  fixStatus?: string | null;
  fixRef?: string | null;
  closureSummary?: string | null;
  closureAppliedAt?: string | null;
  createdAt: string;
  labeledAt: string | null;
}

export interface AiEvalLabelQueueExport {
  businessId: string;
  status: AiEvalLabelQueueStatus;
  total: number;
  items: AiEvalLabelQueueItem[];
}

export interface AiEvalLabelQueueUpdate {
  labelOutcome?: AiEvalLabelOutcome | null;
  expectedAction?: string | null;
  expectedRescuedAction?: string | null;
  rescueFromAction?: string | null;
  expectedParams?: Record<string, unknown> | null;
  expectedClarifyFields?: string[] | null;
}

export interface AiEvalLabeledCaseExport {
  businessId: string;
  itemId: string;
  evalCase: Record<string, unknown>;
  fixtureSnippet: string;
  appendedToFixtures: boolean;
  fixturesPath?: string;
  appendReason?: string;
  harvestedCaseCount?: number;
  closurePlan?: Record<string, unknown>;
}

export interface AiEvalFixturesModuleExport {
  businessId: string;
  generatedAt: string;
  caseCount: number;
  moduleSource: string;
  cases: Record<string, unknown>[];
}

/** acc-2.1 — weekly production prompt harvest summary. */
export interface AiEvalHarvestResult {
  periodDays: number;
  candidates: number;
  inserted: number;
  updated: number;
  skipped: number;
}

/** acc-1.11 — rolling 7-day accuracy SLO vs 99% target. */
export const ACCURACY_SLO_TARGET = 0.99;
export const ACCURACY_SLO_WEEKLY_ALERT_DELTA = -0.02;
/** acc-4.8 — clarify → success on next turn target. */
export const CLARIFY_NEXT_TURN_SUCCESS_TARGET = 0.9;
export { CLARIFY_NEAR_99_TARGET } from './ai-n99-clarify-success.fixtures.js';

export interface AiAccuracySloTrendPoint {
  date: string;
  accuracy: number;
  total: number;
}

export interface AiAccuracySloExport {
  periodDays: number;
  target: number;
  rolling7DayAccuracy: number;
  previous7DayAccuracy: number;
  weeklyDelta: number;
  gapToTarget: number;
  meetsTarget: boolean;
  alert: boolean;
  rolling7CommandCount: number;
  trend: AiAccuracySloTrendPoint[];
}

export interface AiAccuracyAnalyticsSummary {
  periodDays: number;
  totalCommands: number;
  noClarifyCompletionRate: number;
  clarifyRate: number;
  /** acc-4.8 — clarify → executed same intent on immediate next turn */
  clarifySuccessRate: number;
  clarifyQualityTarget: number;
  clarifyQualityMeetsTarget: boolean;
  clarifyNextTurnSampleSize: number;
  clarifyNextTurnSuccessCount: number;
  clarifyAbandonRate: number;
  /** n99-1 — stretch target and rolling gate. */
  clarifyNear99Target?: number;
  clarifyNear99MeetsTarget?: boolean;
  clarifyNear99Gate?: import('./ai-n99-clarify-success.util.js').ClarifyNear99ExitGateResult;
  /** n99-2 — stretch target and rolling no-clarify gate. */
  noClarifyNear99Target?: number;
  noClarifyNear99MeetsTarget?: boolean;
  noClarifyNear99Gate?: import('./ai-n99-no-clarify-completion.util.js').NoClarifyNear99ExitGateResult;
  clarifyQualityByIntent?: Record<
    string,
    import('./ai-n99-clarify-success.util.js').ClarifyQualitySegmentStats
  >;
  clarifyQualityByLocale?: Record<
    string,
    import('./ai-n99-clarify-success.util.js').ClarifyQualitySegmentStats
  >;
  misclassificationRate: number;
  explicitNegativeRate: number;
  byIntent: Record<
    string,
    { total: number; accurate: number; clarify: number; failures: number }
  >;
  byLocale: Record<string, { total: number; accurate: number }>;
  bySurface: Record<string, { total: number; accurate: number }>;
  confusionMatrix: AiConfusionMatrixEntry[];
  worstPrompts: AiWorstPromptEntry[];
  worstClarifies: AiWorstClarifyEntry[];
  accuracySlo: AiAccuracySloExport;
  /** acc-6.7 — human handoff rate from trace rows. */
  escalation?: {
    escalationCount: number;
    escalationRate: number;
    targetRate: number;
    meetsTarget: boolean;
  };
  /** acc-6.8 — rolling 30-day 99% program exit gate. */
  exitGate?: import('./ai-accuracy-exit-gate.util.js').AccuracyExitGateResult;
}

export interface AiCommandMetricsSummary {
  periodDays: number;
  totalCommands: number;
  successRate: number;
  clarifyRate: number;
  approvalRate: number;
  autoExecuteRate: number;
  byIntent: Record<
    string,
    { total: number; success: number; clarify: number; approval: number }
  >;
  byLocationId: Record<string, number>;
  targets: {
    completionRate: number;
    clarifyRecoveryRate: number;
    autoExecuteRate: number;
    approvalExecuteRate: number;
  };
  /** acc-1.8 — populated when ai_command_trace data exists */
  accuracy?: AiAccuracyAnalyticsSummary;
}

/** Union of anonymous public + logged-in customer intents (legacy orchestration; see ai-cmd-0.5). */
export const PUBLIC_ASSISTANT_INTENTS = REGISTRY_PUBLIC_ASSISTANT_INTENTS;

export type PublicAssistantIntent = (typeof PUBLIC_ASSISTANT_INTENTS)[number];

/** ai-e3 — receptionist deny-list (front desk; no owner/financial ops). */
export const RECEPTIONIST_DENIED_INTENTS = new Set([
  'payment_sweep',
  'summarize_utilization',
  'summarize_staff',
  'summarize_customers',
  'optimize_schedule',
  'swap_schedules',
  'rebalance_capacity',
  'holiday_mode',
  'onboard_provider_schedule',
  'import_services_from_menu',
  'update_service_prices',
  'staff_service_matrix',
  'revenue_forecast',
  'no_show_recovery',
  'sick_day_replan',
  'day_replan',
  'assign_employee_services',
  'create_service',
  'create_services',
  'bulk_smart_cancel',
]);

export const DEFAULT_HITL_SLA_MINUTES = 30;

export interface VerticalAiPlugin {
  id: 'salon' | 'clinic' | 'fitness';
  label: string;
  intentHints: string[];
  rescuePatterns: Array<{ pattern: RegExp; action: string }>;
}

export const VERTICAL_AI_PLUGINS: Record<
  VerticalAiPlugin['id'],
  VerticalAiPlugin
> = {
  salon: {
    id: 'salon',
    label: 'Salon',
    intentHints: ['color services', 'stylist', 'walk-in', 'blowout'],
    rescuePatterns: [
      {
        pattern: /\b(color|highlight|balayage)\b.+\b(senior|master)\b/i,
        action: 'staff_service_matrix',
      },
      {
        pattern: /\bwalk[\s-]?in\b.+\b(slot|availability)\b/i,
        action: 'check_availability',
      },
    ],
  },
  clinic: {
    id: 'clinic',
    label: 'Clinic',
    intentHints: ['appointment type', 'provider', 'insurance', 'follow-up'],
    rescuePatterns: [
      {
        pattern: /\b(follow[\s-]?up|recall)\b.+\b(patient|client)/i,
        action: 'summarize_bookings',
      },
      {
        pattern: /\bcompliance\b.+\bhour/i,
        action: 'check_schedule_compliance',
      },
    ],
  },
  fitness: {
    id: 'fitness',
    label: 'Fitness',
    intentHints: ['class', 'trainer', 'membership', 'session pack'],
    rescuePatterns: [
      {
        pattern: /\b(class|group)\b.+\b(capacity|fill)\b/i,
        action: 'fill_unused_slots',
      },
      {
        pattern: /\btrainer\b.+\b(schedule|swap)\b/i,
        action: 'swap_schedules',
      },
    ],
  },
};

/** ai-e1 — resolve branch scope from command context and settings. */
export function resolveBranchScope(
  context: Record<string, unknown> | undefined,
  enterprise?: AiEnterpriseSettings,
): BranchScope {
  const locationId =
    (typeof context?.locationId === 'string' && context.locationId) ||
    (typeof context?._locationId === 'string' && context._locationId) ||
    enterprise?.defaultLocationId ||
    undefined;
  const locationName =
    typeof context?.locationName === 'string'
      ? context.locationName
      : undefined;
  return locationId || locationName ? { locationId, locationName } : {};
}

export function buildBranchClassifierHint(scope: BranchScope): string | null {
  if (!scope.locationId && !scope.locationName) return null;
  const label = scope.locationName ?? scope.locationId;
  return `Branch scope: ${label}. Only consider staff and bookings for this location unless the user explicitly asks for all locations.`;
}

export function filterBookingsByBranch<
  T extends { locationId?: string | null },
>(bookings: T[], locationId?: string | null): T[] {
  if (!locationId) return bookings;
  return bookings.filter((b) => b.locationId === locationId);
}

export function scopeEmployeesByBranchActivity<T extends { id: string }>(
  employees: T[],
  employeeIdsAtBranch: Set<string>,
  locationId?: string | null,
): T[] {
  if (!locationId) return employees;
  if (!employeeIdsAtBranch.size) return [];
  return employees.filter((e) => employeeIdsAtBranch.has(e.id));
}

/** ai-e3 — map JWT role + enterprise overrides to AI role profile. */
export function resolveAiRoleProfile(
  membershipRole: string | undefined | null,
  enterprise?: AiEnterpriseSettings,
): AiRoleProfile {
  const key = (membershipRole ?? '').toLowerCase();
  const override = enterprise?.roleProfiles?.[key];
  if (override) return override;

  const tier = resolveAccessTier(membershipRole);
  if (tier === 'owner') return 'owner';
  if (tier === 'manager') return 'manager';
  if (key === 'contributor') return 'provider';
  if (tier === 'staff') return 'receptionist';
  return 'owner';
}

export function isIntentAllowedForRoleProfile(
  profile: AiRoleProfile,
  surface: AiCommandSurface,
  action: string,
): boolean {
  if (
    action === 'unknown' ||
    action === 'error' ||
    action === 'security_blocked'
  )
    return true;
  if (surface === 'public') {
    return PUBLIC_INTENTS.includes(action);
  }
  if (surface === 'customer') {
    return CUSTOMER_INTENTS.includes(action);
  }
  if (profile === 'owner' || profile === 'manager') return true;
  if (profile === 'provider') {
    return surface === 'provider' || !RECEPTIONIST_DENIED_INTENTS.has(action);
  }
  if (profile === 'receptionist') {
    return !RECEPTIONIST_DENIED_INTENTS.has(action);
  }
  return false;
}

/** ai-e4 — resolve vertical plugin from settings or business type. */
export function resolveVerticalPlugin(
  businessType: string | undefined | null,
  enterprise?: AiEnterpriseSettings,
): VerticalAiPlugin {
  const id =
    enterprise?.verticalPlugin ??
    (businessType?.includes('clinic') || businessType?.includes('dental')
      ? 'clinic'
      : businessType?.includes('gym') || businessType?.includes('fitness')
        ? 'fitness'
        : resolveVerticalPlaybookId(businessType ?? 'other'));
  return VERTICAL_AI_PLUGINS[
    id === 'clinic' ? 'clinic' : id === 'fitness' ? 'fitness' : 'salon'
  ];
}

export function rescueVerticalIntent(
  prompt: string,
  plugin: VerticalAiPlugin,
): { action: string; rescueReason: string } | null {
  for (const rule of plugin.rescuePatterns) {
    if (rule.pattern.test(prompt)) {
      return {
        action: rule.action,
        rescueReason: `platform_vertical_${plugin.id}`,
      };
    }
  }
  return null;
}

export function buildVerticalClassifierHints(plugin: VerticalAiPlugin): string {
  return `${plugin.label} vertical — common topics: ${plugin.intentHints.join(', ')}.`;
}

/** ai-e5 — deterministic A/B bucket from business + experiment id. */
export function assignAbVariant(
  businessId: string,
  experimentId: string,
  variantCount: number,
): number {
  if (variantCount <= 1) return 0;
  let hash = 0;
  const key = `${businessId}:${experimentId}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % variantCount;
}

export function pickActiveAbExperiment(
  experiments?: AiAbExperiment[],
): AiAbExperiment | null {
  return (
    experiments?.find(
      (e) => e.enabled && (e.suggestionVariants?.length ?? 0) > 1,
    ) ?? null
  );
}

/** acc-3.10 — active classifier appendix A/B experiment (ai-e5). */
export function pickActiveClassificationAbExperiment(
  experiments?: AiAbExperiment[],
): AiAbExperiment | null {
  return (
    experiments?.find(
      (experiment) =>
        experiment.enabled &&
        (experiment.classificationVariants?.length ?? 0) > 1,
    ) ?? null
  );
}

export function resolveAbSuggestionVariant(
  businessId: string,
  experiment: AiAbExperiment,
): AiSuggestionVariant | null {
  const variants = experiment.suggestionVariants ?? [];
  if (!variants.length) return null;
  const idx = assignAbVariant(businessId, experiment.id, variants.length);
  return variants[idx] ?? variants[0];
}

export function resolveExperimentConfidenceHigh(
  baseHigh: number,
  experiment: AiAbExperiment | null,
  businessId: string,
): { high: number; abVariantId?: string } {
  if (!experiment?.confidenceHigh) {
    const variant = experiment
      ? resolveAbSuggestionVariant(businessId, experiment)
      : null;
    return { high: baseHigh, abVariantId: variant?.id };
  }
  const variant = resolveAbSuggestionVariant(businessId, experiment);
  return { high: experiment.confidenceHigh, abVariantId: variant?.id };
}

/** ai-e6 — classify command result for analytics. */
export function classifyCommandOutcome(
  result: CommandResult | Record<string, unknown>,
): AiCommandOutcome {
  const action = String(result.action ?? 'unknown');
  if (action === 'security_blocked') return 'security_blocked';
  if (action === 'error') return 'failed';

  const details = (result.details ?? {}) as Record<string, unknown>;
  if (details.requiresApproval === true || details.approvalRequired === true)
    return 'approval';
  const missing = details.missing;
  if (
    details.clarify === true ||
    (Array.isArray(missing) && missing.length > 0) ||
    action === 'clarify'
  ) {
    return 'clarify';
  }
  if (result.success === false) return 'failed';
  if (result.success === true && action !== 'unknown') return 'success';
  return 'unknown';
}

export function buildCommandMetricPayload(params: {
  result: CommandResult | Record<string, unknown>;
  surface: AiCommandSurface;
  locationId?: string;
  roleProfile?: AiRoleProfile;
  abVariantId?: string;
  autoExecuted?: boolean;
}): AiCommandMetricEvent {
  const outcome = classifyCommandOutcome(params.result);
  const action = String(params.result.action ?? 'unknown');
  return {
    outcome,
    action,
    surface: params.surface,
    locationId: params.locationId,
    roleProfile: params.roleProfile,
    abVariantId: params.abVariantId,
    clarify: outcome === 'clarify',
    approval: outcome === 'approval',
    autoExecuted: params.autoExecuted === true,
    timestamp: new Date().toISOString(),
  };
}

export function aggregateCommandMetrics(
  events: AiCommandMetricEvent[],
  periodDays = 30,
): AiCommandMetricsSummary {
  const total = events.length;
  const success = events.filter((e) => e.outcome === 'success').length;
  const clarify = events.filter((e) => e.clarify).length;
  const approval = events.filter((e) => e.approval).length;
  const autoExec = events.filter((e) => e.autoExecuted).length;

  const byIntent: AiCommandMetricsSummary['byIntent'] = {};
  const byLocationId: Record<string, number> = {};

  for (const e of events) {
    byIntent[e.action] ??= { total: 0, success: 0, clarify: 0, approval: 0 };
    byIntent[e.action].total += 1;
    if (e.outcome === 'success') byIntent[e.action].success += 1;
    if (e.clarify) byIntent[e.action].clarify += 1;
    if (e.approval) byIntent[e.action].approval += 1;
    if (e.locationId) {
      byLocationId[e.locationId] = (byLocationId[e.locationId] ?? 0) + 1;
    }
  }

  return {
    periodDays,
    totalCommands: total,
    successRate: total ? success / total : 0,
    clarifyRate: total ? clarify / total : 0,
    approvalRate: total ? approval / total : 0,
    autoExecuteRate: total ? autoExec / total : 0,
    byIntent,
    byLocationId,
    targets: {
      completionRate: 0.75,
      clarifyRecoveryRate: 0.9,
      autoExecuteRate: 0.6,
      approvalExecuteRate: 0.8,
    },
  };
}

/** ai-e7 — detect stuck human-in-the-loop tasks. */
export function isTaskStuck(
  updatedAt: Date | string,
  status: string,
  slaMinutes: number,
  now = new Date(),
): boolean {
  const stuckStatuses = new Set([
    'pending_validation',
    'validated',
    'executing',
  ]);
  if (!stuckStatuses.has(status)) return false;
  const updated =
    typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
  const ageMs = now.getTime() - updated.getTime();
  return ageMs >= slaMinutes * 60 * 1000;
}

export function resolveHitlSlaMinutes(
  enterprise?: AiEnterpriseSettings,
): number {
  const minutes = enterprise?.hitlSlaMinutes;
  return Number.isFinite(minutes) && minutes! > 0
    ? minutes!
    : DEFAULT_HITL_SLA_MINUTES;
}

/** ai-e8 — public assistant orchestration gate (same rules as dashboard security surface). */
export function validatePublicAssistantAction(action: string): boolean {
  return (PUBLIC_ASSISTANT_INTENTS as readonly string[]).includes(action);
}

export function buildPublicAssistantDeniedResult(
  action: string,
): CommandResult {
  return {
    success: false,
    action: 'security_blocked',
    summary: `The booking assistant cannot perform "${action}". Try rephrasing or use the booking flow.`,
    details: { surface: 'public', blockedAction: action },
  };
}

/** ai-cmd-0.5 — customer gateway action gate (client tier + customer/public union). */
export function validateCustomerAssistantAction(action: string): boolean {
  return CUSTOMER_INTENTS.includes(action) || PUBLIC_INTENTS.includes(action);
}

export function buildCustomerAssistantDeniedResult(
  action: string,
): CommandResult {
  return {
    success: false,
    action: 'security_blocked',
    summary: `The customer assistant cannot perform "${action}". Try rephrasing or use the booking menu.`,
    details: { surface: 'customer', blockedAction: action },
  };
}

export function enrichPublicSessionWithOrchestrationRules(
  session: Record<string, unknown> | undefined,
  plugin: VerticalAiPlugin,
): Record<string, unknown> {
  return {
    ...session,
    _orchestrationSurface: 'public',
    _verticalPlugin: plugin.id,
    _verticalHints: plugin.intentHints.join(', '),
  };
}

export function mapAccessTierToRoleProfile(tier: AccessTier): AiRoleProfile {
  if (tier === 'owner') return 'owner';
  if (tier === 'manager') return 'manager';
  if (tier === 'staff') return 'receptionist';
  return 'provider';
}
