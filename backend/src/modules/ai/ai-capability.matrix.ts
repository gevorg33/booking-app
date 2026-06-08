import {
  type AccessTier,
  isCustomerIntentAllowed,
  isDashboardIntentAllowed,
  isProviderIntentAllowed,
  isPublicIntentAllowed,
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

/** Map JWT membershipRole (or legacy role string) to access tier. */
export function normalizeActorRole(role?: string | null): AccessTier {
  return resolveAccessTier(role);
}

export function getAllowedIntents(
  surface: AiSurface,
  tier: AccessTier,
): readonly string[] {
  if (surface === 'public') {
    return PUBLIC_INTENTS.filter((action) =>
      isPublicIntentAllowed(tier, action),
    );
  }
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
}

export function buildCapabilitiesView(
  surface: AiSurface,
  membershipRole: string | undefined,
  planTierId: PlanTierId,
): AiCapabilitiesView {
  const accessTier = normalizeActorRole(membershipRole);
  return {
    surface,
    accessTier,
    planTierId,
    allowedIntents: getEffectiveAllowedIntents(surface, accessTier, planTierId),
    planDeniedIntents:
      surface === 'dashboard' ? getPlanDeniedDashboardIntents(planTierId) : [],
    hints: capabilityMatrixForPrompt(surface, accessTier),
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
    return (
      isPublicIntentAllowed(tier, action) && PUBLIC_INTENTS.includes(action)
    );
  }
  if (surface === 'customer') {
    return (
      isCustomerIntentAllowed(tier, action) &&
      CUSTOMER_SURFACE_INTENTS.includes(action)
    );
  }
  if (surface === 'dashboard') {
    return (
      DASHBOARD_INTENTS.includes(action) &&
      isDashboardIntentAllowed(tier, action)
    );
  }
  return (
    PROVIDER_INTENTS.includes(action) &&
    isProviderIntentAllowed(tier, action)
  );
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
    const allowed = getAllowedIntents(surface, tier);
    return `Customer booking assistant (public web + consumer app). Allowed actions (${surface}): ${allowed.join(', ')}`;
  }
  const allowed = getAllowedIntents(surface, tier);
  return `${tierAccessSummary(tier)}. Allowed AI actions (${surface}): ${allowed.join(', ')}`;
}
