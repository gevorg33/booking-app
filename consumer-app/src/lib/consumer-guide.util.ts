import { shouldShowPatientResultsTab } from './clinic-service.js';
import { buildSalonPath } from './deep-link.js';
import { buildConsumerAssistantHref } from './consumer-assistant-navigate.util.js';
import {
  CONSUMER_CLINIC_GUIDE_TOPIC_ID,
} from './consumer-guide-clinic-gating.fixtures.js';
import type { PublicBusinessProfile } from './types.js';
import type {
  GuideFlowNavigateTarget,
  MobileGuideListContext,
  MobileGuideLocale,
} from '@mobile-guide/mobile-guide.types.ts';

export { CONSUMER_CLINIC_GUIDE_TOPIC_ID } from './consumer-guide-clinic-gating.fixtures.js';

export const CONSUMER_GUIDE_TOPIC_ELEMENT_PREFIX = 'guide-topic-';

export function consumerGuideTopicElementId(topicId: string): string {
  return `${CONSUMER_GUIDE_TOPIC_ELEMENT_PREFIX}${topicId}`;
}

export function buildConsumerGuidePath(
  slug: string,
  query?: Record<string, string | undefined | null>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  }
  const qs = params.toString();
  return buildSalonPath(slug, `/guide${qs ? `?${qs}` : ''}`);
}

export function parseConsumerGuideTopicId(
  search: string | null | undefined,
): string | null {
  const topicId = new URLSearchParams(search ?? '').get('topicId')?.trim();
  return topicId || null;
}

export function shouldShowConsumerClinicGuideTopic(
  businessType: string | undefined | null,
): boolean {
  return shouldShowPatientResultsTab(businessType);
}

export function buildConsumerGuideListContext(
  profile: Pick<PublicBusinessProfile, 'businessType' | 'giftCardsPurchaseEnabled'> | null | undefined,
): MobileGuideListContext {
  const businessType = profile?.businessType;
  let vertical: string | undefined = 'salon';
  if (shouldShowPatientResultsTab(businessType)) {
    vertical = 'clinic';
  } else if (businessType === 'tour') {
    vertical = 'tour';
  }

  const enabledModules: string[] = [];
  if (profile?.giftCardsPurchaseEnabled) enabledModules.push('giftCards');

  return {
    surface: 'customer',
    vertical,
    businessType,
    enabledModules: enabledModules.length ? enabledModules : undefined,
  };
}

export function isConsumerGuideTopicVisibleForBusiness(
  topicId: string,
  businessType: string | undefined | null,
): boolean {
  if (topicId === CONSUMER_CLINIC_GUIDE_TOPIC_ID) {
    return shouldShowConsumerClinicGuideTopic(businessType);
  }
  return true;
}

export function sanitizeConsumerGuideTopicId(
  topicId: string | null | undefined,
  businessType: string | undefined | null,
): string | null {
  const trimmed = topicId?.trim();
  if (!trimmed) return null;
  if (!isConsumerGuideTopicVisibleForBusiness(trimmed, businessType)) return null;
  return trimmed;
}

export function resolveConsumerGuideNavigateHref(
  slug: string,
  navigate: GuideFlowNavigateTarget,
): string | null {
  if (navigate.path === 'guide') {
    return buildConsumerGuidePath(slug, navigate.query);
  }
  if (navigate.path.startsWith('/s/')) {
    const params = new URLSearchParams(navigate.query ?? {});
    const qs = params.toString();
    return `${navigate.path}${qs ? `?${qs}` : ''}`;
  }
  if (navigate.path.startsWith('/')) {
    const params = new URLSearchParams(navigate.query ?? {});
    const qs = params.toString();
    return buildSalonPath(slug, `${navigate.path}${qs ? `?${qs}` : ''}`);
  }
  return buildConsumerAssistantHref(slug, {
    path: navigate.path,
    query: navigate.query ?? {},
  });
}

export function scrollToConsumerGuideTopic(
  topicId: string,
  options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition },
): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(consumerGuideTopicElementId(topicId));
  if (!el) return false;
  el.scrollIntoView({
    behavior: options?.behavior ?? 'smooth',
    block: options?.block ?? 'start',
  });
  return true;
}

export function resolveConsumerGuideLocale(
  locale: string | null | undefined,
): MobileGuideLocale {
  if (locale === 'hy' || locale === 'ru') return locale;
  return 'en';
}
