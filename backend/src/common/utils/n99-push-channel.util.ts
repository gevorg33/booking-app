import {
  N99_PUSH_TYPE_CHANNEL_SCENARIOS,
  N99_TRANSACTIONAL_PUSH_CHANNELS,
  type N99PushChannelId,
} from './n99-push-channel.fixtures.js';

export {
  N99_PUSH_CHANNEL_IDS,
  N99_PUSH_TYPE_CHANNEL_SCENARIOS,
  N99_TRANSACTIONAL_PUSH_CHANNELS,
  N99_TRANSACTIONAL_REACHABILITY_SCENARIOS,
  type N99PushChannelId,
} from './n99-push-channel.fixtures.js';

export type ConsumerPushPreferenceCategory = 'reminders' | 'offers' | 'news';

export const N99_PUSH_REACHABILITY_SCOPE_TRANSACTIONAL = 'transactional' as const;
export const N99_PUSH_REACHABILITY_SCOPE_MARKETING = 'marketing' as const;

/** n99-4.3 — Android channel for FCM delivery (transactional vs marketing). */
export function resolveConsumerPushAndroidChannelId(
  pushType: string,
): N99PushChannelId {
  if (pushType === 'result_ready' || pushType === 'lab_booking_request') {
    return 'clinic_alerts';
  }
  if (
    pushType === 'rebooking_nudge' ||
    pushType === 'win_back' ||
    pushType === 'activation_concierge'
  ) {
    return 'marketing_offers';
  }
  return 'booking_alerts';
}

/** n99-4.3 — adopt-4.8 preference category for server-side send gating. */
export function resolveConsumerPushPreferenceCategory(
  pushType: string,
): ConsumerPushPreferenceCategory {
  if (
    pushType === 'rebooking_nudge' ||
    pushType === 'win_back' ||
    pushType === 'activation_concierge'
  ) {
    return 'offers';
  }
  return 'reminders';
}

export function isTransactionalAndroidPushChannel(channelId: string): boolean {
  return N99_TRANSACTIONAL_PUSH_CHANNELS.has(channelId as N99PushChannelId);
}

/** n99-4.3 — headline reachability counts transactional delivery only. */
export function isTransactionalReachabilityAnalyticsProps(
  props: Record<string, unknown> | null | undefined,
): boolean {
  if (!props) return false;
  if (props.pushReachabilityScope === N99_PUSH_REACHABILITY_SCOPE_MARKETING) return false;
  if (props.pushReminders === false) return false;
  if (props.pushReachability === true) return true;
  const state = props.pushPermissionState;
  return (
    state === 'full' ||
    state === 'provisional' ||
    state === 'default_on'
  );
}

export function listConsumerPushTypesForChannel(channelId: N99PushChannelId): string[] {
  return N99_PUSH_TYPE_CHANNEL_SCENARIOS.filter((row) => row.channelId === channelId).map(
    (row) => row.pushType,
  );
}
