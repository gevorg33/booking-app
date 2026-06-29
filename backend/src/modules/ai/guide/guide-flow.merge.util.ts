import type { AccessTier } from '../access-control.matrix.js';
import { mapAccessTierToRoleProfile } from '../ai-platform.util.js';
import type { AiRoleProfile } from '../ai-settings.types.js';
import {
  getLimitsForTier,
  type PlanFeatureFlag,
  type PlanTierId,
} from '../../billing/plan-limits.js';
import { resolveVerticalPlaybookId } from '../../onboarding/vertical-playbooks.constants.js';
import type { VerticalPlaybookId } from '../../onboarding/vertical-playbooks.constants.js';
import {
  getGuideFlowOverlayBundle,
  listGuideFlowOverlayBundles,
  listGuideFlowSurfacePlaybooks,
} from './guide-flow.loader.js';
import type {
  GuideFlowListContext,
  GuideFlowPlaybookDef,
  GuideFlowRoleScope,
  GuideFlowSurface,
  GuideVerticalOverlayId,
} from './guide-flow.types.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide-flow.routes.manifest.js';

export function resolveGuideFlowSurfaceFromRoute(
  route?: string,
): GuideFlowSurface | undefined {
  if (!route) return undefined;
  if (route.startsWith('/dashboard')) return 'dashboard';
  if (route.startsWith('/tabs')) return 'provider';
  if (route.startsWith('/s') || route.startsWith('/consumer')) return 'customer';
  if (route === '/book' || route.startsWith('/book/') || route.startsWith('/public')) {
    return 'public';
  }
  return undefined;
}

const VERTICAL_PLAYBOOK_IDS = new Set<VerticalPlaybookId>(['salon', 'clinic', 'tour']);

function resolveBusinessVerticalPlaybookId(input: {
  vertical?: string;
  businessType?: string;
}): VerticalPlaybookId {
  if (input.vertical && VERTICAL_PLAYBOOK_IDS.has(input.vertical as VerticalPlaybookId)) {
    return input.vertical as VerticalPlaybookId;
  }
  if (input.businessType && VERTICAL_PLAYBOOK_IDS.has(input.businessType as VerticalPlaybookId)) {
    return input.businessType as VerticalPlaybookId;
  }
  if (input.vertical) return resolveVerticalPlaybookId(input.vertical);
  if (input.businessType) return resolveVerticalPlaybookId(input.businessType);
  return 'salon';
}

export function resolveActiveGuideVerticalOverlays(input: {
  vertical?: string;
  businessType?: string;
  retailPosEnabled?: boolean;
}): GuideVerticalOverlayId[] {
  const playbookVertical = resolveBusinessVerticalPlaybookId(input);

  const active: GuideVerticalOverlayId[] = [];
  if (playbookVertical === 'clinic') active.push('clinic');
  if (playbookVertical === 'tour') active.push('tour');
  if (input.retailPosEnabled || input.vertical === 'retail') active.push('retail');
  return active;
}

export function resolveGuideFlowRoleScope(input: {
  surface: GuideFlowSurface;
  role?: AccessTier | string;
  roleProfile?: AiRoleProfile | GuideFlowRoleScope;
}): GuideFlowRoleScope | null {
  if (input.roleProfile) {
    const profile = input.roleProfile as GuideFlowRoleScope;
    if (input.surface === 'provider' && profile === 'receptionist') return 'provider';
    if (input.surface === 'customer' || input.surface === 'public') return 'customer';
    return profile;
  }

  if (input.role) {
    const tier = input.role as AccessTier;
    if (input.surface === 'customer' || input.surface === 'public') return 'customer';
    const profile = mapAccessTierToRoleProfile(tier);
    if (input.surface === 'provider' && profile === 'receptionist') return 'provider';
    return profile;
  }

  if (input.surface === 'customer' || input.surface === 'public') return 'customer';
  return null;
}

const PLAN_TIER_ORDER: Record<PlanTierId, number> = {
  solo: 0,
  starter: 1,
  business: 2,
};

/** Maps guide module ids to subscription plan feature flags (ai-guide-1.8.4). */
export const GUIDE_MODULE_PLAN_FLAGS: Readonly<Record<string, PlanFeatureFlag>> = {
  giftCards: 'giftCards',
  promoCodes: 'promoCodes',
  loyalty: 'loyalty',
  memberships: 'memberships',
  stripeConnect: 'stripeConnect',
};

export function resolveGuideFlowPlanTier(ctx: GuideFlowListContext): PlanTierId {
  return ctx.planTierId ?? 'solo';
}

export function isPlanTierAtLeast(current: PlanTierId, required: PlanTierId): boolean {
  return PLAN_TIER_ORDER[current] >= PLAN_TIER_ORDER[required];
}

export function isGuideModuleEnabledByPlan(
  moduleId: string,
  planTierId: PlanTierId,
): boolean {
  const flag = GUIDE_MODULE_PLAN_FLAGS[moduleId];
  if (!flag) return false;
  return getLimitsForTier(planTierId).flags[flag];
}

export function isGuideFlowPlaybookPlanAllowed(
  playbook: GuideFlowPlaybookDef,
  planTierId: PlanTierId = 'solo',
): boolean {
  if (!playbook.requiresPlan) return true;
  return isPlanTierAtLeast(planTierId, playbook.requiresPlan);
}

export function isGuideFlowPlaybookModuleAllowed(
  playbook: GuideFlowPlaybookDef,
  enabledModules?: readonly string[],
  planTierId: PlanTierId = 'solo',
): boolean {
  if (!playbook.requiresModule?.length) return true;
  if (
    enabledModules?.length &&
    playbook.requiresModule.some((moduleId) => enabledModules.includes(moduleId))
  ) {
    return true;
  }
  return playbook.requiresModule.some((moduleId) =>
    isGuideModuleEnabledByPlan(moduleId, planTierId),
  );
}

export function isGuideFlowPlaybookEntitlementAllowed(
  playbook: GuideFlowPlaybookDef,
  ctx: GuideFlowListContext,
): boolean {
  const planTierId = resolveGuideFlowPlanTier(ctx);
  return (
    isGuideFlowPlaybookPlanAllowed(playbook, planTierId) &&
    isGuideFlowPlaybookModuleAllowed(playbook, ctx.enabledModules, planTierId)
  );
}

export function isGuideFlowPlaybookRoleVerticalVisible(
  playbook: GuideFlowPlaybookDef,
  ctx: GuideFlowListContext,
  activeVerticals: readonly GuideVerticalOverlayId[],
): boolean {
  if (playbook.surface !== ctx.surface) return false;

  if (playbook.verticals?.length) {
    const allowed = playbook.verticals.some((id) => activeVerticals.includes(id));
    if (!allowed) return false;
  }

  if (playbook.roles?.length) {
    const roleScope = resolveGuideFlowRoleScope({
      surface: ctx.surface,
      role: ctx.role,
      roleProfile: ctx.roleProfile,
    });
    if (!roleScope || !playbook.roles.includes(roleScope)) return false;
  }

  return true;
}

export function isGuideFlowPlaybookVisible(
  playbook: GuideFlowPlaybookDef,
  ctx: GuideFlowListContext,
  activeVerticals: readonly GuideVerticalOverlayId[],
): boolean {
  if (!isGuideFlowPlaybookRoleVerticalVisible(playbook, ctx, activeVerticals)) {
    return false;
  }
  return isGuideFlowPlaybookEntitlementAllowed(playbook, ctx);
}

export function mergeGuideFlowPlaybooks(ctx: GuideFlowListContext): GuideFlowPlaybookDef[] {
  const activeVerticals = resolveActiveGuideVerticalOverlays(ctx);
  const base = listGuideFlowSurfacePlaybooks(ctx.surface);
  const merged: GuideFlowPlaybookDef[] = [];

  for (const playbook of base) {
    if (isGuideFlowPlaybookVisible(playbook, ctx, activeVerticals)) {
      merged.push(playbook);
    }
  }

  for (const overlayId of activeVerticals) {
    const overlay = getGuideFlowOverlayBundle(overlayId);
    if (!overlay) continue;
    for (const playbook of overlay.playbooks) {
      if (isGuideFlowPlaybookVisible(playbook, ctx, activeVerticals)) {
        merged.push(playbook);
      }
    }
  }

  return merged.sort((a, b) => a.topicId.localeCompare(b.topicId));
}

export function matchGuideFlowRoute(
  route: string | undefined,
  playbook: GuideFlowPlaybookDef,
): boolean {
  if (!route) return false;
  return playbook.routes.some(
    (candidate) => route === candidate || route.startsWith(`${candidate}/`),
  );
}

export function pickGuideFlowPlaybookForRoute(
  route: string | undefined,
  playbooks: readonly GuideFlowPlaybookDef[],
): GuideFlowPlaybookDef | null {
  if (!route) return null;
  const primaryTopicId = resolveGuideFlowRoutePrimaryTopic(route);
  if (primaryTopicId) {
    const primary = playbooks.find((row) => row.topicId === primaryTopicId);
    if (primary && matchGuideFlowRoute(route, primary)) return primary;
  }
  const matches = playbooks.filter((row) => matchGuideFlowRoute(route, row));
  if (matches.length === 0) return null;
  return matches.sort(
    (a, b) =>
      Math.max(...b.routes.map((r) => r.length)) -
        Math.max(...a.routes.map((r) => r.length)) ||
      a.routes.length - b.routes.length ||
      a.topicId.localeCompare(b.topicId),
  )[0];
}

export function listGuideFlowPlaybooks(ctx: GuideFlowListContext): GuideFlowPlaybookDef[] {
  return mergeGuideFlowPlaybooks(ctx);
}

export function listGuideFlowOverlayPlaybookIds(
  overlayId: GuideVerticalOverlayId,
): readonly string[] {
  return getGuideFlowOverlayBundle(overlayId)?.playbooks.map((row) => row.topicId) ?? [];
}

export function listGuideFlowSurfacesWithOverlays(): readonly GuideVerticalOverlayId[] {
  return listGuideFlowOverlayBundles().map((row) => row.id);
}
