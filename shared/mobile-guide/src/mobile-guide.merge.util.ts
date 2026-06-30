import type {
  GuideFlowOverlayBundle,
  GuideFlowPlaybookDef,
  GuideFlowRoleScope,
  GuideVerticalOverlayId,
  MobileGuideListContext,
  MobileGuidePlanTierId,
  MobileGuideSurface,
} from './mobile-guide.types.ts';

const VERTICAL_PLAYBOOK_IDS = new Set(['salon', 'clinic', 'tour']);

const PLAN_TIER_ORDER: Record<MobileGuidePlanTierId, number> = {
  solo: 0,
  starter: 1,
  business: 2,
};

/** Module ids that map to subscription tiers on mobile (subset of backend GUIDE_MODULE_PLAN_FLAGS). */
const MODULE_MIN_PLAN: Readonly<Record<string, MobileGuidePlanTierId>> = {
  giftCards: 'starter',
  promoCodes: 'starter',
  loyalty: 'business',
  memberships: 'business',
  stripeConnect: 'business',
};

function resolveBusinessVertical(input: {
  vertical?: string;
  businessType?: string;
}): string {
  if (input.vertical && VERTICAL_PLAYBOOK_IDS.has(input.vertical)) return input.vertical;
  if (input.businessType && VERTICAL_PLAYBOOK_IDS.has(input.businessType)) {
    return input.businessType;
  }
  return input.vertical ?? input.businessType ?? 'salon';
}

export function resolveActiveGuideVerticalOverlays(input: {
  vertical?: string;
  businessType?: string;
  retailPosEnabled?: boolean;
}): GuideVerticalOverlayId[] {
  const playbookVertical = resolveBusinessVertical(input);
  const active: GuideVerticalOverlayId[] = [];
  if (playbookVertical === 'clinic') active.push('clinic');
  if (playbookVertical === 'tour') active.push('tour');
  if (input.retailPosEnabled || input.vertical === 'retail') active.push('retail');
  return active;
}

export function resolveGuideFlowRoleScope(input: {
  surface: MobileGuideSurface;
  roleProfile?: GuideFlowRoleScope;
}): GuideFlowRoleScope | null {
  if (input.roleProfile) {
    if (input.surface === 'provider' && input.roleProfile === 'receptionist') {
      return 'provider';
    }
    if (input.surface === 'customer') return 'customer';
    return input.roleProfile;
  }
  if (input.surface === 'customer') return 'customer';
  return null;
}

export function resolveGuideFlowPlanTier(ctx: MobileGuideListContext): MobileGuidePlanTierId {
  return ctx.planTierId ?? 'solo';
}

export function isPlanTierAtLeast(
  current: MobileGuidePlanTierId,
  required: MobileGuidePlanTierId,
): boolean {
  return PLAN_TIER_ORDER[current] >= PLAN_TIER_ORDER[required];
}

export function isGuideModuleEnabledByPlan(
  moduleId: string,
  planTierId: MobileGuidePlanTierId,
): boolean {
  const required = MODULE_MIN_PLAN[moduleId];
  if (!required) return false;
  return isPlanTierAtLeast(planTierId, required);
}

export function isGuideFlowPlaybookPlanAllowed(
  playbook: GuideFlowPlaybookDef,
  planTierId: MobileGuidePlanTierId = 'solo',
): boolean {
  if (!playbook.requiresPlan) return true;
  return isPlanTierAtLeast(planTierId, playbook.requiresPlan);
}

export function isGuideFlowPlaybookModuleAllowed(
  playbook: GuideFlowPlaybookDef,
  enabledModules?: readonly string[],
  planTierId: MobileGuidePlanTierId = 'solo',
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
  ctx: MobileGuideListContext,
): boolean {
  const planTierId = resolveGuideFlowPlanTier(ctx);
  return (
    isGuideFlowPlaybookPlanAllowed(playbook, planTierId) &&
    isGuideFlowPlaybookModuleAllowed(playbook, ctx.enabledModules, planTierId)
  );
}

export function isGuideFlowPlaybookRoleVerticalVisible(
  playbook: GuideFlowPlaybookDef,
  ctx: MobileGuideListContext,
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
      roleProfile: ctx.roleProfile,
    });
    if (!roleScope || !playbook.roles.includes(roleScope)) return false;
  }

  return true;
}

export function isGuideFlowPlaybookVisible(
  playbook: GuideFlowPlaybookDef,
  ctx: MobileGuideListContext,
  activeVerticals: readonly GuideVerticalOverlayId[],
): boolean {
  if (!isGuideFlowPlaybookRoleVerticalVisible(playbook, ctx, activeVerticals)) {
    return false;
  }
  return isGuideFlowPlaybookEntitlementAllowed(playbook, ctx);
}

export function mergeGuideFlowPlaybooks(
  ctx: MobileGuideListContext,
  base: readonly GuideFlowPlaybookDef[],
  overlays: readonly GuideFlowOverlayBundle[],
): GuideFlowPlaybookDef[] {
  const activeVerticals = resolveActiveGuideVerticalOverlays(ctx);
  const merged: GuideFlowPlaybookDef[] = [];

  for (const playbook of base) {
    if (isGuideFlowPlaybookVisible(playbook, ctx, activeVerticals)) {
      merged.push(playbook);
    }
  }

  for (const overlayId of activeVerticals) {
    const overlay = overlays.find((row) => row.id === overlayId);
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
