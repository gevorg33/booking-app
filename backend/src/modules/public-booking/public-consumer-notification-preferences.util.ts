/** adopt-4.8 — public consumer notification preference center. */

import {
  DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES,
  getCustomerNotificationPreferences,
  type CustomerNotificationPreferences,
} from '../notifications/notification.types.js';

export type PublicConsumerPushPreferenceKey =
  | 'pushReminders'
  | 'pushOffers'
  | 'pushNews';

export interface PublicConsumerNotificationPreferencesView {
  pushReminders: boolean;
  pushOffers: boolean;
  pushNews: boolean;
}

export interface UpdatePublicConsumerNotificationPreferencesInput {
  pushReminders?: boolean;
  pushOffers?: boolean;
  pushNews?: boolean;
}

export function mapPublicConsumerNotificationPreferences(
  metadata?: Record<string, unknown> | null,
): PublicConsumerNotificationPreferencesView {
  const prefs = getCustomerNotificationPreferences(metadata ?? undefined);
  return {
    pushReminders: prefs.pushReminders,
    pushOffers: prefs.pushOffers,
    pushNews: prefs.pushNews,
  };
}

export function mergeCustomerNotificationPreferences(
  metadata: Record<string, unknown> | null | undefined,
  input: UpdatePublicConsumerNotificationPreferencesInput,
): CustomerNotificationPreferences {
  const current = getCustomerNotificationPreferences(metadata ?? undefined);
  return {
    ...current,
    ...(input.pushReminders !== undefined
      ? { pushReminders: input.pushReminders }
      : {}),
    ...(input.pushOffers !== undefined ? { pushOffers: input.pushOffers } : {}),
    ...(input.pushNews !== undefined ? { pushNews: input.pushNews } : {}),
  };
}

export function applyCustomerNotificationPreferences(
  metadata: Record<string, unknown> | null | undefined,
  input: UpdatePublicConsumerNotificationPreferencesInput,
): Record<string, unknown> {
  const notifications = mergeCustomerNotificationPreferences(metadata, input);
  return {
    ...(metadata ?? {}),
    notifications,
  };
}

export function hasNotificationPreferenceUpdate(
  input: UpdatePublicConsumerNotificationPreferencesInput,
): boolean {
  return (
    input.pushReminders !== undefined ||
    input.pushOffers !== undefined ||
    input.pushNews !== undefined
  );
}

export const PUBLIC_CONSUMER_PUSH_PREFERENCE_DEFAULTS =
  DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES;
