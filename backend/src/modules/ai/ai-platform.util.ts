import { resolveLocale, t } from '../../common/i18n/messages.js';
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
import * as CommandRegistryBuild from './ai-command-registry.build.js';
import { PUBLIC_ONLY_ASSISTANT_ACTIONS } from './ai-public-only-assistant-actions.js';

export { mapAccessTierToRoleProfile } from './ai-role-profile.util.js';

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
}

/**
 * Union of anonymous public + logged-in customer intents (legacy orchestration; see ai-cmd-0.5).
 * Live re-export from the registry — never snapshot-assign (circular init left that copy undefined; e2e-bug.1 / e2e-bug.90).
 */
export { PUBLIC_ASSISTANT_INTENTS } from './ai-command-registry.build.js';
export type PublicAssistantIntent =
  (typeof CommandRegistryBuild.PUBLIC_ASSISTANT_INTENTS)[number];

/** Read a registry intent list at call time; never throw when circular-init left it undefined. */
export function readRegistryIntentList(
  list: readonly string[] | undefined | null,
): readonly string[] | undefined {
  return Array.isArray(list) && list.length > 0 ? list : undefined;
}

/**
 * Resolve the public-assistant allowlist for the orchestration gate.
 * Prefers the provided/live registry union; falls back to the leaf public-only
 * list so discovery intents never 500 when the circular import race leaves the
 * registry binding undefined (e2e-bug.90).
 */
export function resolvePublicAssistantIntentAllowlistFrom(
  registryList: readonly string[] | null | undefined,
): readonly string[] {
  const primary = readRegistryIntentList(registryList);
  if (primary) return primary;
  return [...PUBLIC_ONLY_ASSISTANT_ACTIONS, 'unknown'];
}

export function resolvePublicAssistantIntentAllowlist(): readonly string[] {
  return resolvePublicAssistantIntentAllowlistFrom(
    CommandRegistryBuild.PUBLIC_ASSISTANT_INTENTS,
  );
}

export function intentAllowlistIncludes(
  list: readonly string[] | undefined | null,
  action: string,
  fallback: readonly string[] = [],
): boolean {
  const resolved = readRegistryIntentList(list) ?? fallback;
  return resolved.includes(action);
}

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
  'unassign_employee_services',
  'transfer_employee_services',
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
    return intentAllowlistIncludes(
      CommandRegistryBuild.PUBLIC_INTENTS,
      action,
      PUBLIC_ONLY_ASSISTANT_ACTIONS,
    );
  }
  if (surface === 'customer') {
    return intentAllowlistIncludes(
      CommandRegistryBuild.CUSTOMER_INTENTS,
      action,
      PUBLIC_ONLY_ASSISTANT_ACTIONS,
    );
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
  // Call-time resolve + leaf fallback — never throw on circular-init undefined (e2e-bug.90).
  return resolvePublicAssistantIntentAllowlist().includes(action);
}

/** e2e-bug.127 — localized denial; blockedAction stays in details only (no snake_case in summary). */
export function buildPublicAssistantDeniedResult(
  action: string,
  locale?: string | null,
): CommandResult {
  return {
    success: false,
    action: 'security_blocked',
    summary: t(resolveLocale(locale), 'assistant.deniedPublic'),
    details: { surface: 'public', blockedAction: action },
  };
}

/** ai-cmd-0.5 — customer gateway action gate (client tier + customer/public union). */
export function validateCustomerAssistantAction(action: string): boolean {
  return (
    intentAllowlistIncludes(
      CommandRegistryBuild.CUSTOMER_INTENTS,
      action,
      PUBLIC_ONLY_ASSISTANT_ACTIONS,
    ) ||
    intentAllowlistIncludes(
      CommandRegistryBuild.PUBLIC_INTENTS,
      action,
      PUBLIC_ONLY_ASSISTANT_ACTIONS,
    )
  );
}

export function buildCustomerAssistantDeniedResult(
  action: string,
  locale?: string | null,
): CommandResult {
  return {
    success: false,
    action: 'security_blocked',
    summary: t(resolveLocale(locale), 'assistant.deniedCustomer'),
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
