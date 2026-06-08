import type { ConsumerPushPayload } from './consumer-native-push.util.js';

export type ConsumerForegroundPushLabels = {
  viewAction: string;
  dismiss: string;
};

export const CONSUMER_FOREGROUND_PUSH_EVENT = 'consumer:foreground-push';

export interface ConsumerForegroundPushDetail {
  message: string;
  payload: ConsumerPushPayload;
}

export function foregroundConsumerPushMessage(
  payload: ConsumerPushPayload,
  notification?: { title?: string; body?: string },
): string {
  if (payload.foregroundHint?.trim()) return payload.foregroundHint.trim();
  if (notification?.body?.trim()) return notification.body.trim();
  if (notification?.title?.trim()) return notification.title.trim();
  return 'New notification';
}

export function showConsumerForegroundPushBanner(
  payload: ConsumerPushPayload,
  notification?: { title?: string; body?: string },
): void {
  const message = foregroundConsumerPushMessage(payload, notification);
  window.dispatchEvent(
    new CustomEvent<ConsumerForegroundPushDetail>(CONSUMER_FOREGROUND_PUSH_EVENT, {
      detail: { message, payload },
    }),
  );
}
