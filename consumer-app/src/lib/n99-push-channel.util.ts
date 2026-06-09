import type { AppAnalyticsEventProps } from './app-analytics.js';
import type { ConsumerNotificationPreferences } from './consumer-notification-preferences.util.js';
import {
  isPushReachableState,
  type PushPermissionState,
} from './push-reachability.util.js';
import type { N99AndroidPushChannelId } from './n99-push-channel.fixtures.js';

export {
  N99_ANDROID_PUSH_CHANNEL_IDS,
  N99_PREFERENCE_CHANNEL_SCENARIOS,
  N99_TRANSACTIONAL_REACHABILITY_SCENARIOS,
  type N99AndroidPushChannelId,
} from './n99-push-channel.fixtures.js';

export const N99_PUSH_REACHABILITY_SCOPE_TRANSACTIONAL = 'transactional' as const;

const ANDROID_CHANNEL_DEFINITIONS: Array<{
  id: N99AndroidPushChannelId;
  name: string;
  description: string;
  transactional: boolean;
  enabledImportance: number;
  disabledImportance: number;
}> = [
  {
    id: 'booking_alerts',
    name: 'Booking alerts',
    description: 'Confirmations, reminders, and appointment updates',
    transactional: true,
    enabledImportance: 5,
    disabledImportance: 0,
  },
  {
    id: 'clinic_alerts',
    name: 'Clinic alerts',
    description: 'Lab results and collection booking reminders',
    transactional: true,
    enabledImportance: 5,
    disabledImportance: 0,
  },
  {
    id: 'marketing_offers',
    name: 'Offers and tips',
    description: 'Optional rebooking nudges and promotions',
    transactional: false,
    enabledImportance: 3,
    disabledImportance: 0,
  },
];

export function isTransactionalAndroidPushChannel(channelId: string): boolean {
  return channelId === 'booking_alerts' || channelId === 'clinic_alerts';
}

export function isMarketingAndroidChannelEnabled(
  prefs: ConsumerNotificationPreferences,
): boolean {
  return prefs.pushOffers || prefs.pushNews;
}

export function isTransactionalAndroidChannelEnabled(
  prefs: ConsumerNotificationPreferences,
): boolean {
  return prefs.pushReminders;
}

export interface AndroidPushChannelSyncSpec {
  id: N99AndroidPushChannelId;
  name: string;
  description: string;
  importance: number;
  visibility: 0 | 1;
}

/** n99-4.3 — sync Android channels from adopt-4.8 preference center toggles. */
export function buildAndroidPushChannelSyncSpecs(
  prefs: ConsumerNotificationPreferences,
): AndroidPushChannelSyncSpec[] {
  return ANDROID_CHANNEL_DEFINITIONS.map((definition) => {
    const enabled = definition.transactional
      ? isTransactionalAndroidChannelEnabled(prefs)
      : isMarketingAndroidChannelEnabled(prefs);
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      importance: enabled ? definition.enabledImportance : definition.disabledImportance,
      visibility: 1,
    };
  });
}

export function isTransactionallyReachable(input: {
  permissionState: PushPermissionState;
  pushReminders?: boolean;
}): boolean {
  if (!isPushReachableState(input.permissionState)) return false;
  return input.pushReminders !== false;
}

export function buildTransactionalReachabilityAnalyticsProps(input: {
  permissionState: PushPermissionState;
  pushReminders?: boolean;
}): AppAnalyticsEventProps {
  return {
    pushReachability: isTransactionallyReachable(input),
    pushReachabilityScope: N99_PUSH_REACHABILITY_SCOPE_TRANSACTIONAL,
    pushPermissionState: input.permissionState,
    ...(input.pushReminders != null ? { pushReminders: input.pushReminders } : {}),
  };
}
