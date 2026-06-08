import type { AppAnalyticsEventProps } from './app-analytics.js';
import { getConsumerCopy } from './consumer-copy-catalog.js';
import { normalizeConsumerLocale } from './tenant-locale.js';
import {
  buildPushReachabilityAnalyticsProps,
  hasProvisionalPushEngaged,
  hasShownProvisionalUpgrade,
  markProvisionalPushEngaged,
  markProvisionalUpgradeShown,
  shouldShowProvisionalUpgradePrompt,
  type PushPermissionState,
} from './push-reachability.util.js';

export const CONSUMER_PROVISIONAL_PUSH_ENGAGED_EVENT = 'consumer-provisional-push-engaged';

export interface ProvisionalToFullUpgradeInput {
  platform: 'ios' | 'android' | 'web' | string;
  permission: PushPermissionState;
  engaged?: boolean;
  upgradeShown?: boolean;
}

/** n99-4.5 — only iOS provisional users who engaged with a quiet notification. */
export function shouldMarkProvisionalPushEngaged(input: {
  platform: string;
  permission: PushPermissionState;
}): boolean {
  return input.platform === 'ios' && input.permission === 'provisional';
}

/** n99-4.5 — prompt to keep reminders on after provisional engagement. */
export function shouldShowProvisionalToFullUpgradePrompt(
  input: ProvisionalToFullUpgradeInput,
): boolean {
  if (input.platform !== 'ios') return false;
  return shouldShowProvisionalUpgradePrompt({
    permission: input.permission,
    engaged: input.engaged,
    upgradeShown: input.upgradeShown,
  });
}

export function resolveProvisionalUpgradeSlug(input: {
  eventSlug?: string | null;
  pathname?: string | null;
  activePushSlug?: string | null;
}): string | null {
  if (input.eventSlug) return input.eventSlug;
  const match = input.pathname?.match(/^\/s\/([^/]+)/);
  if (match?.[1]) return match[1];
  return input.activePushSlug ?? null;
}

export function notifyProvisionalPushEngaged(slug: string | null): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(CONSUMER_PROVISIONAL_PUSH_ENGAGED_EVENT, {
      detail: { slug },
    }),
  );
}

export function buildProvisionalToFullUpgradeCopy(locale?: string | null): {
  title: string;
  body: string;
  accept: string;
  decline: string;
} {
  const copy = getConsumerCopy(normalizeConsumerLocale(locale) ?? 'en');
  return {
    title: copy.pushProvisionalUpgradeTitle,
    body: copy.pushProvisionalUpgradeBody,
    accept: copy.pushProvisionalUpgradeAccept,
    decline: copy.pushProvisionalUpgradeDecline,
  };
}

export function buildProvisionalToFullUpgradeShownAnalyticsProps(): AppAnalyticsEventProps {
  return buildPushReachabilityAnalyticsProps({ permissionState: 'provisional' });
}

export function buildProvisionalToFullUpgradeAcceptedAnalyticsProps(
  granted: boolean,
): AppAnalyticsEventProps {
  return buildPushReachabilityAnalyticsProps({
    permissionState: 'full',
    pushOptIn: granted,
  });
}

export {
  hasProvisionalPushEngaged,
  hasShownProvisionalUpgrade,
  markProvisionalPushEngaged,
  markProvisionalUpgradeShown,
  shouldShowProvisionalUpgradePrompt,
};
