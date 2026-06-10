import type { AppAnalyticsEventProps } from './app-analytics.js';
import { getConsumerCopy } from './consumer-copy-catalog.js';
import { normalizeConsumerLocale } from './tenant-locale.js';
import {
  buildPushReachabilityAnalyticsProps,
  hasShownPushSettingsReask,
  markPushSettingsReaskShown,
  openNotificationSettings,
  shouldReaskPushPermission,
  type PushPermissionState,
} from './push-reachability.util.js';
import { PUSH_DENIED_REASK_MIN_BOOKINGS } from './push-denied-reask.fixtures.js';

export {
  HIGH_VALUE_PUSH_MOMENT_SCENARIOS,
  PUSH_DENIED_MAX_REASK_COUNT,
  PUSH_DENIED_REASK_MIN_BOOKINGS,
  PUSH_DENIED_REASK_SCENARIOS,
} from './push-denied-reask.fixtures.js';

export const CONSUMER_HIGH_VALUE_PUSH_MOMENT_EVENT = 'consumer-high-value-push-moment';

export interface HighValuePushMomentDetail {
  slug: string;
  completedBookingCount: number;
}

/** n99-4.6 — later high-value moment (2nd+ completed booking). */
export function isHighValuePushMoment(completedBookingCount: number): boolean {
  return completedBookingCount >= PUSH_DENIED_REASK_MIN_BOOKINGS;
}

/** n99-4.6 — max one settings re-ask when notifications were denied. */
export function shouldShowPushDeniedReask(input: {
  permission: PushPermissionState;
  completedBookingCount: number;
  isNative: boolean;
  isFcmBuild: boolean;
  reaskShown?: boolean;
}): boolean {
  if (!input.isNative || !input.isFcmBuild) return false;
  if (!isHighValuePushMoment(input.completedBookingCount)) return false;
  return shouldReaskPushPermission({
    permission: input.permission,
    completedBookingCount: input.completedBookingCount,
    reaskShown: input.reaskShown,
  });
}

export function notifyHighValuePushMoment(detail: HighValuePushMomentDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(CONSUMER_HIGH_VALUE_PUSH_MOMENT_EVENT, { detail }),
  );
}

export function buildPushDeniedReaskCopy(locale?: string | null): {
  title: string;
  body: string;
  openSettings: string;
  skip: string;
} {
  const copy = getConsumerCopy(normalizeConsumerLocale(locale) ?? 'en');
  return {
    title: copy.pushSettingsReaskTitle,
    body: copy.pushSettingsReaskBody,
    openSettings: copy.pushSettingsReaskOpen,
    skip: copy.pushSettingsReaskSkip,
  };
}

export function buildPushDeniedReaskShownAnalyticsProps(): AppAnalyticsEventProps {
  return buildPushReachabilityAnalyticsProps({ permissionState: 'denied' });
}

/** n99-4.6 — deep-link to system notification settings (never re-prompt after shown). */
export async function openPushDeniedReaskSettings(): Promise<boolean> {
  return openNotificationSettings();
}

export {
  hasShownPushSettingsReask,
  markPushSettingsReaskShown,
  shouldReaskPushPermission,
};
