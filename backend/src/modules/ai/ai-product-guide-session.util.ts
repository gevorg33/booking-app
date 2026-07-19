import type { PlanTierId } from '../billing/plan-limits.js';
import { resolveAccessTier, type AccessTier } from './access-control.matrix.js';
import { mapAccessTierToRoleProfile } from './ai-role-profile.util.js';
import type { GuideFlowRoleScope } from './guide/guide-flow.types.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import { resolveGuideFlowSurfaceFromRoute } from './guide/guide-flow.merge.util.js';
import type { ProductGuideLogicInput } from './ai-product-guide.logic.js';
import {
  mapProviderMobileGuideRoute,
  mergeProviderMobileGuideContext,
  readProviderMobileRouteTab,
} from './ai-provider-guide-context.util.js';
import { mapPublicBookingGuideRoute } from './ai-public-booking-guide.util.js';
import {
  mapCustomerMobileGuideRoute,
  parseCustomerPathToGuideRoute,
} from './ai-customer-product-guide.util.js';

export { mapPublicBookingGuideRoute } from './ai-public-booking-guide.util.js';
export {
  mapCustomerMobileGuideRoute,
  parseCustomerPathToGuideRoute,
} from './ai-customer-product-guide.util.js';

export interface ProductGuideSessionContext {
  route?: string;
  mobileRoute?: string;
  screenTab?: string;
  locale?: string;
  vertical?: string;
  businessType?: string;
  role?: AccessTier;
  roleProfile?: GuideFlowRoleScope;
  retailPosEnabled?: boolean;
  enabledModules?: readonly string[];
  surface?: GuideFlowSurface;
  planTierId?: PlanTierId;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows = value.filter(
    (row): row is string => typeof row === 'string' && row.trim().length > 0,
  );
  return rows.length ? rows : undefined;
}

export function readPlanTierIdFromPageContext(
  pageCtx?: Record<string, unknown>,
): PlanTierId {
  const raw =
    readString(pageCtx?._planTierId) ?? readString(pageCtx?.planTierId);
  if (raw === 'starter' || raw === 'business' || raw === 'solo') return raw;
  return 'solo';
}

function readPlanTierId(pageCtx?: Record<string, unknown>): PlanTierId {
  return readPlanTierIdFromPageContext(pageCtx);
}

function readEnabledModules(
  pageCtx?: Record<string, unknown>,
): readonly string[] | undefined {
  const direct = readStringArray(pageCtx?.enabledModules);
  if (direct) return direct;

  const modules = pageCtx?.modules;
  if (!modules || typeof modules !== 'object') return undefined;
  const enabled = Object.entries(modules as Record<string, unknown>)
    .filter(([, active]) => active === true)
    .map(([key]) => key);
  return enabled.length ? enabled : undefined;
}

export function resolveGuideFlowSurface(
  surface?: CommandSurface | GuideFlowSurface,
  route?: string,
): GuideFlowSurface {
  if (
    surface === 'dashboard' ||
    surface === 'provider' ||
    surface === 'customer' ||
    surface === 'public'
  ) {
    return surface;
  }
  return resolveGuideFlowSurfaceFromRoute(route) ?? 'dashboard';
}

/** Map provider mobile screen context to guide-flow route (ai-guide-1.4.2). */
export { mapProviderMobileGuideRoute } from './ai-provider-guide-context.util.js';

export function resolveAccessTierFromSession(
  pageCtx?: Record<string, unknown>,
): AccessTier | undefined {
  const raw =
    readString(pageCtx?._accessTier) ??
    readString(pageCtx?._actorRole) ??
    readString(pageCtx?.accessTier) ??
    readString(pageCtx?.role);
  if (!raw) return undefined;
  return resolveAccessTier(raw);
}

export function resolveRoleProfileFromSession(
  surface: GuideFlowSurface,
  pageCtx?: Record<string, unknown>,
  accessTier?: AccessTier,
): GuideFlowRoleScope | undefined {
  const explicit =
    readString(pageCtx?._roleProfile) ?? readString(pageCtx?.roleProfile);
  if (
    explicit === 'owner' ||
    explicit === 'manager' ||
    explicit === 'receptionist' ||
    explicit === 'provider' ||
    explicit === 'customer'
  ) {
    return explicit;
  }

  const tier = accessTier ?? resolveAccessTierFromSession(pageCtx);
  if (!tier) {
    if (surface === 'customer' || surface === 'public') return 'customer';
    return undefined;
  }

  if (surface === 'customer' || surface === 'public') return 'customer';
  if (tier === 'staff' && surface === 'provider') return 'provider';
  return mapAccessTierToRoleProfile(tier);
}

export function resolveProductGuideSessionContext(
  session?: { context?: Record<string, unknown> },
  surfaceHint?: CommandSurface | GuideFlowSurface,
): ProductGuideSessionContext {
  const pageCtx = mergeProviderMobileGuideContext(session?.context);
  const surface = resolveGuideFlowSurface(
    surfaceHint,
    readString(pageCtx?.route),
  );

  let route = readString(pageCtx?.route);
  if (!route) {
    if (surface === 'public') route = mapPublicBookingGuideRoute(pageCtx);
    else if (surface === 'provider')
      route = mapProviderMobileGuideRoute(pageCtx);
    else if (surface === 'customer')
      route = mapCustomerMobileGuideRoute(pageCtx);
  } else if (surface === 'provider') {
    route = mapProviderMobileGuideRoute(pageCtx) ?? route;
  }

  const accessTier = resolveAccessTierFromSession(pageCtx);
  const roleProfile = resolveRoleProfileFromSession(
    surface,
    pageCtx,
    accessTier,
  );

  return {
    route,
    mobileRoute: readString(pageCtx?.mobileRoute),
    screenTab: readProviderMobileRouteTab(pageCtx),
    locale: readString(pageCtx?.locale),
    vertical:
      readString(pageCtx?.vertical) ??
      readString(pageCtx?._verticalPlugin) ??
      readString(pageCtx?.businessType),
    businessType: readString(pageCtx?.businessType),
    role: accessTier,
    roleProfile,
    retailPosEnabled: readBoolean(pageCtx?.retailPosEnabled),
    enabledModules: readEnabledModules(pageCtx),
    planTierId: readPlanTierId(pageCtx),
    surface,
  };
}

export function buildProductGuideLogicInput(input: {
  businessId: string;
  prompt: string;
  params?: Record<string, unknown>;
  session?: { context?: Record<string, unknown> };
  surface?: CommandSurface | GuideFlowSurface;
  locale?: string;
  userId?: string;
}): ProductGuideLogicInput {
  const sessionContext = resolveProductGuideSessionContext(
    input.session,
    input.surface,
  );
  return {
    businessId: input.businessId,
    prompt: input.prompt,
    params: input.params,
    route: sessionContext.route,
    locale: input.locale ?? sessionContext.locale,
    vertical: sessionContext.vertical,
    role: sessionContext.role,
    roleProfile: sessionContext.roleProfile,
    retailPosEnabled: sessionContext.retailPosEnabled,
    enabledModules: sessionContext.enabledModules,
    userId: input.userId,
    surface: sessionContext.surface,
    session: input.session,
  };
}
