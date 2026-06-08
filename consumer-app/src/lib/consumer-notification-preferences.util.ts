/** adopt-4.8 — consumer notification preference center. */

export type ConsumerPushPreferenceKey =
  | 'pushReminders'
  | 'pushOffers'
  | 'pushNews';

export interface ConsumerNotificationPreferences {
  pushReminders: boolean;
  pushOffers: boolean;
  pushNews: boolean;
}

export type ConsumerNotificationPreferencesPatch = Partial<
  Record<ConsumerPushPreferenceKey, boolean>
>;

export function normalizeConsumerNotificationPreferences(
  raw: unknown,
): ConsumerNotificationPreferences {
  const body = raw as ConsumerNotificationPreferences;
  return {
    pushReminders: body?.pushReminders !== false,
    pushOffers: body?.pushOffers !== false,
    pushNews: body?.pushNews !== false,
  };
}

export function buildConsumerNotificationPreferencesPatch(
  key: ConsumerPushPreferenceKey,
  enabled: boolean,
): ConsumerNotificationPreferencesPatch {
  return { [key]: enabled };
}

export function applyConsumerNotificationPreferencesPatch(
  current: ConsumerNotificationPreferences,
  patch: ConsumerNotificationPreferencesPatch,
): ConsumerNotificationPreferences {
  return {
    pushReminders: patch.pushReminders ?? current.pushReminders,
    pushOffers: patch.pushOffers ?? current.pushOffers,
    pushNews: patch.pushNews ?? current.pushNews,
  };
}

export function shouldShowNotificationPreferencesSection(authed: boolean): boolean {
  return authed;
}
