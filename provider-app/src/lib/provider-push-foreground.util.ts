import { toast } from 'sonner';
import type { ProviderPushPayload } from './provider-push-deep-link.util';
import { PROVIDER_AI_PROMPT_EVENT } from './provider-push-deep-link.util';

export type ForegroundPushLabels = {
  addBufferAction: string;
  dismiss: string;
};

export function foregroundPushMessage(
  payload: ProviderPushPayload,
  notification?: { title?: string; body?: string },
): string {
  if (payload.foregroundHint?.trim()) return payload.foregroundHint.trim();
  if (notification?.body?.trim()) return notification.body.trim();
  if (notification?.title?.trim()) return notification.title.trim();
  return 'New notification';
}

export function showForegroundPushBanner(
  payload: ProviderPushPayload,
  labels: ForegroundPushLabels,
  notification?: { title?: string; body?: string },
): void {
  const message = foregroundPushMessage(payload, notification);
  const aiPrompt = payload.aiPrompt?.trim();

  if (aiPrompt) {
    toast(message, {
      duration: 12_000,
      action: {
        label: labels.addBufferAction,
        onClick: () => {
          window.dispatchEvent(
            new CustomEvent(PROVIDER_AI_PROMPT_EVENT, { detail: { prompt: aiPrompt } }),
          );
        },
      },
      cancel: { label: labels.dismiss, onClick: () => undefined },
    });
    return;
  }

  toast(message, { duration: 8000 });
}
