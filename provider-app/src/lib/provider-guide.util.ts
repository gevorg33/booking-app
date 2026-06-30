import type {
  GuideFlowNavigateTarget,
  GuideFlowRoleScope,
  MobileGuideListContext,
  MobileGuideLocale,
} from '@mobile-guide/mobile-guide.types.ts';
import { isMobileManagerRole } from './provider-access.js';
import { providerTabPath } from './provider-tab-route.util.js';
import {
  PROVIDER_CLINIC_GUIDE_TOPIC_ID,
  PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID,
} from './provider-guide-gating.fixtures.js';

export {
  PROVIDER_CLINIC_GUIDE_TOPIC_ID,
  PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID,
} from './provider-guide-gating.fixtures.js';

export const PROVIDER_GUIDE_TOPIC_ELEMENT_PREFIX = 'guide-topic-';
export const PROVIDER_GUIDE_PATH = '/tabs/profile/guide';

export function providerGuideTopicElementId(topicId: string): string {
  return `${PROVIDER_GUIDE_TOPIC_ELEMENT_PREFIX}${topicId}`;
}

export function buildProviderGuidePath(
  query?: Record<string, string | undefined | null>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  }
  const qs = params.toString();
  return `${PROVIDER_GUIDE_PATH}${qs ? `?${qs}` : ''}`;
}

export function parseProviderGuideTopicId(
  search: string | null | undefined,
): string | null {
  const topicId = new URLSearchParams(search ?? '').get('topicId')?.trim();
  return topicId || null;
}

export function resolveProviderGuideRoleProfile(
  membershipRole?: string | null,
): GuideFlowRoleScope {
  if (membershipRole === 'owner') return 'owner';
  if (membershipRole === 'manager' || membershipRole === 'admin') return 'manager';
  return 'provider';
}

export function buildProviderGuideListContext(input: {
  membershipRole?: string | null;
  labFeaturesEnabled?: boolean;
}): MobileGuideListContext {
  return {
    surface: 'provider',
    roleProfile: resolveProviderGuideRoleProfile(input.membershipRole),
    vertical: input.labFeaturesEnabled ? 'clinic' : 'salon',
    businessType: input.labFeaturesEnabled ? 'clinic' : undefined,
  };
}

export function isProviderGuideTopicVisible(
  topicId: string,
  input: {
    membershipRole?: string | null;
    labFeaturesEnabled?: boolean;
  },
): boolean {
  if (topicId === PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID) {
    return isProviderGuideManagerContext(input.membershipRole);
  }
  if (topicId === PROVIDER_CLINIC_GUIDE_TOPIC_ID) {
    return input.labFeaturesEnabled === true;
  }
  return true;
}

export function sanitizeProviderGuideTopicId(
  topicId: string | null | undefined,
  input: {
    membershipRole?: string | null;
    labFeaturesEnabled?: boolean;
  },
): string | null {
  const trimmed = topicId?.trim();
  if (!trimmed) return null;
  if (!isProviderGuideTopicVisible(trimmed, input)) return null;
  return trimmed;
}

export function resolveProviderGuideNavigateHref(
  navigate: GuideFlowNavigateTarget,
): string | null {
  if (navigate.path === 'guide') {
    return buildProviderGuidePath(navigate.query);
  }
  if (navigate.path.startsWith('/tabs/')) {
    const params = new URLSearchParams(navigate.query ?? {});
    const qs = params.toString();
    return `${navigate.path}${qs ? `?${qs}` : ''}`;
  }
  if (navigate.path.startsWith('/')) {
    const params = new URLSearchParams(navigate.query ?? {});
    const qs = params.toString();
    return `${navigate.path}${qs ? `?${qs}` : ''}`;
  }
  return null;
}

export function scrollToProviderGuideTopic(
  topicId: string,
  options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition },
): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(providerGuideTopicElementId(topicId));
  if (!el) return false;
  el.scrollIntoView({
    behavior: options?.behavior ?? 'smooth',
    block: options?.block ?? 'start',
  });
  return true;
}

export function resolveProviderGuideLocale(
  locale: string | null | undefined,
): MobileGuideLocale {
  if (locale === 'hy' || locale === 'ru') return locale;
  return 'en';
}

export function isProviderGuideManagerContext(membershipRole?: string | null): boolean {
  return isMobileManagerRole(membershipRole);
}

export function providerGuideProfilePath(): string {
  return providerTabPath('profile');
}
