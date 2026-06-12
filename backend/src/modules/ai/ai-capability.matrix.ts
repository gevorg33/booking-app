import {
  type AccessTier,
  isCustomerIntentAllowed,
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  resolveAccessTier,
  tierAccessSummary,
} from './access-control.matrix.js';
import {
  CUSTOMER_INTENTS,
  CUSTOMER_MUTATING_INTENTS,
  DASHBOARD_INTENTS,
  DASHBOARD_MUTATING_INTENTS,
  PROVIDER_INTENTS,
  PROVIDER_MUTATING_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import {
  isPublicOnlyAssistantAction,
  PUBLIC_ONLY_ASSISTANT_ACTIONS,
  type PublicOnlyAssistantAction,
} from './customer-ai-command.util.js';
import {
  getPlanDeniedDashboardIntents,
  isDashboardAiIntentAllowedByPlan,
} from '../billing/plan-dashboard-ai-intents.util.js';
import type { PlanTierId } from '../billing/plan-limits.js';

export type { AccessTier } from './access-control.matrix.js';

export type AiSurface = 'dashboard' | 'provider' | 'customer' | 'public';

/** @deprecated Use AccessTier — kept for backward-compatible exports */
export type AiActorRole = AccessTier;

const DASHBOARD_MUTATING = new Set(DASHBOARD_MUTATING_INTENTS);
const PROVIDER_MUTATING = new Set(PROVIDER_MUTATING_INTENTS);
const CUSTOMER_MUTATING = new Set(CUSTOMER_MUTATING_INTENTS);

/** Customer gateway includes logged-in self-service + anonymous public booking assistant intents (ai-cmd-0.5). */
const CUSTOMER_SURFACE_INTENTS = [
  ...new Set([...CUSTOMER_INTENTS, ...PUBLIC_INTENTS]),
] as const;

/**
 * Discovery + anonymous booking intents executed in `PublicBookingAssistantService`
 * when the consumer mobile gateway classifies them (ai-cmd-customer-0.1).
 *
 * Subset of `PUBLIC_INTENTS` — not every public-registry intent is delegated here;
 * explain/checkout/clinic self-service public intents stay on customer dispatch or
 * public-only handlers per registry bindings.
 */
export const CUSTOMER_PUBLIC_DELEGATED_INTENTS = PUBLIC_ONLY_ASSISTANT_ACTIONS;

export type CustomerPublicDelegatedIntent = PublicOnlyAssistantAction;

/** Logged-in customer intents handled by `dispatchCustomerIntent` (not public delegation). */
export function getCustomerNativeIntents(
  tier: AccessTier = 'client',
): readonly string[] {
  return getAllowedIntents('customer', tier).filter(
    (action) => !isPublicOnlyAssistantAction(action),
  );
}

/** Public-assistant intents allowed on the customer gateway and routed via `runPublicAssistant()`. */
export function getPublicDelegatedCustomerIntents(
  tier: AccessTier = 'client',
): readonly string[] {
  return PUBLIC_ONLY_ASSISTANT_ACTIONS.filter((action) =>
    isCustomerIntentAllowed(tier, action),
  );
}

/**
 * Rescue path expectations for shared vs customer-only features (ai-cmd-customer-0.1).
 *
 * Shared discovery rescue must stay wired on **both** `PublicBookingAssistantService.chat()`
 * and `CustomerAiCommandService.rescueIntent()`. Customer-only domains intentionally
 * rescue on the customer path only.
 */
export const CUSTOMER_PUBLIC_RESCUE_ROUTING = {
  sharedDiscovery: {
    summary:
      'Budget, rank, and OR availability — rescue + enrich on public and customer entry paths.',
    publicHandler: 'PublicBookingAssistantService.chat()',
    customerHandler:
      'CustomerAiCommandService.rescueIntent() → applyBudgetAndRankServiceDiscoveryRescue + disambiguateMisclassifiedAvailabilityIntent',
    intents: [
      'list_services',
      'recommend_specialists',
      'check_availability',
      'book_appointment',
    ] as const,
  },
  customerOnly: {
    summary:
      'Account, payments, packages, clinic self-service, adoption — customer rescue only (by design).',
    publicHandler:
      'Not duplicated when the intent is customer-scoped in the registry.',
    customerHandler: 'CustomerAiCommandService.rescueIntent() domain rescues',
    examples: [
      'rescuePaymentsIntent',
      'rescueConsumerClinicTestResultsIntent',
      'rescueSelfServiceBookingIntent',
      'rescueConsumerAdoptionIntent',
    ] as const,
  },
} as const;

/** CI guard — every delegated public-assistant action must be on public + customer surfaces. */
export function validateCustomerPublicDelegatedIntents(): string[] {
  const errors: string[] = [];
  for (const action of PUBLIC_ONLY_ASSISTANT_ACTIONS) {
    if (!PUBLIC_INTENTS.includes(action)) {
      errors.push(`${action} missing from PUBLIC_INTENTS`);
    }
    if (!CUSTOMER_SURFACE_INTENTS.includes(action)) {
      errors.push(`${action} missing from customer surface union`);
    }
    if (!isCustomerIntentAllowed('client', action)) {
      errors.push(`${action} not allowed for client tier on customer surface`);
    }
  }
  return errors;
}

/** Map JWT membershipRole (or legacy role string) to access tier. */
export function normalizeActorRole(role?: string | null): AccessTier {
  return resolveAccessTier(role);
}

export function getAllowedIntents(
  surface: AiSurface,
  tier: AccessTier,
): readonly string[] {
  if (surface === 'public') return PUBLIC_INTENTS;
  if (surface === 'customer') {
    return CUSTOMER_SURFACE_INTENTS.filter((action) =>
      isCustomerIntentAllowed(tier, action),
    );
  }
  if (surface === 'dashboard') {
    return DASHBOARD_INTENTS.filter((action) =>
      isDashboardIntentAllowed(tier, action),
    );
  }
  return PROVIDER_INTENTS.filter((action) =>
    isProviderIntentAllowed(tier, action),
  );
}

export function getEffectiveAllowedIntents(
  surface: AiSurface,
  accessTier: AccessTier,
  planTierId: PlanTierId = 'solo',
): readonly string[] {
  return getAllowedIntents(surface, accessTier).filter((action) =>
    surface === 'dashboard'
      ? isDashboardAiIntentAllowedByPlan(planTierId, action)
      : true,
  );
}

export interface AiCapabilitiesView {
  surface: AiSurface;
  accessTier: AccessTier;
  planTierId: PlanTierId;
  allowedIntents: readonly string[];
  planDeniedIntents: readonly string[];
  hints: string;
  /** Populated for `surface: customer` — intents routed via `runPublicAssistant()`. */
  publicDelegatedIntents?: readonly string[];
  /** Populated for `surface: customer` — intents routed via `dispatchCustomerIntent()`. */
  customerNativeIntents?: readonly string[];
  /** Populated for `surface: customer` — rescue routing summary (ai-cmd-customer-0.1). */
  rescueRoutingNotes?: string;
}

export function buildCapabilitiesView(
  surface: AiSurface,
  membershipRole: string | undefined,
  planTierId: PlanTierId,
): AiCapabilitiesView {
  const accessTier = normalizeActorRole(membershipRole);
  const base: AiCapabilitiesView = {
    surface,
    accessTier,
    planTierId,
    allowedIntents: getEffectiveAllowedIntents(surface, accessTier, planTierId),
    planDeniedIntents:
      surface === 'dashboard' ? getPlanDeniedDashboardIntents(planTierId) : [],
    hints: capabilityMatrixForPrompt(surface, accessTier),
  };

  if (surface !== 'customer') {
    return base;
  }

  return {
    ...base,
    publicDelegatedIntents: getPublicDelegatedCustomerIntents(accessTier),
    customerNativeIntents: getCustomerNativeIntents(accessTier),
    rescueRoutingNotes: CUSTOMER_PUBLIC_RESCUE_ROUTING.sharedDiscovery.summary,
  };
}

export function isIntentAllowed(
  surface: AiSurface,
  tier: AccessTier,
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
    return (
      isCustomerIntentAllowed(tier, action) &&
      CUSTOMER_SURFACE_INTENTS.includes(action)
    );
  }
  return surface === 'dashboard'
    ? isDashboardIntentAllowed(tier, action)
    : isProviderIntentAllowed(tier, action);
}

export function isMutatingIntent(surface: AiSurface, action: string): boolean {
  if (surface === 'provider') return PROVIDER_MUTATING.has(action);
  if (surface === 'customer') return CUSTOMER_MUTATING.has(action);
  return DASHBOARD_MUTATING.has(action);
}

export function capabilityMatrixForPrompt(
  surface: AiSurface,
  tier: AccessTier,
): string {
  if (surface === 'public') {
    return `Public booking assistant. Allowed actions: ${PUBLIC_INTENTS.join(', ')}`;
  }
  if (surface === 'customer') {
    const native = getCustomerNativeIntents(tier);
    const delegated = getPublicDelegatedCustomerIntents(tier);
    return `Customer booking assistant (public web + consumer app). Native self-service actions (${native.length}): ${native.join(', ')}. Discovery/booking delegated to PublicBookingAssistantService (${delegated.length}): ${delegated.join(', ')}. Rescue: ${CUSTOMER_PUBLIC_RESCUE_ROUTING.sharedDiscovery.summary}`;
  }
  const allowed = getAllowedIntents(surface, tier);
  return `${tierAccessSummary(tier)}. Allowed AI actions (${surface}): ${allowed.join(', ')}`;
}
