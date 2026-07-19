/** prov-exp-1 / ai-cmd-provider-5.10.4 — provider mobile dismiss/clear a push notification or alert. */

export const PROVIDER_DISMISS_PUSH_CLASSIFIER_RULES = `- dismiss_push: MUTATE — clear/dismiss a push notification or in-app alert banner without opening or marking it read. Triggers: dismiss notification, clear this push, ignore that alert, close this banner. NOT mark_all_notifications_read / mark_booking_notifications_read (marks as read instead of clearing), NOT open_booking_from_push (navigates to the booking instead of clearing).`;

export const PROVIDER_DISMISS_PUSH_PROMPT_SCENARIOS = [
  { id: 'dismiss-push-notification-en', prompt: 'Dismiss notification', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-dismiss-this-en', prompt: 'Dismiss this notification', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-clear-this-en', prompt: 'Clear this push', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-ignore-alert-en', prompt: 'Ignore that alert', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-close-banner-en', prompt: 'Close this banner', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-dismiss-alert-en', prompt: 'Dismiss the alert', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-clear-notification-en', prompt: 'Clear that notification', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-ignore-push-notification-en', prompt: 'Ignore this push notification', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-clear-banner-en', prompt: 'Clear the banner', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-dismiss-alert-now-en', prompt: 'Dismiss this alert now', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-hy', prompt: 'Փակիր այս ծանուցումը', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-close-hy', prompt: 'Ջնջիր այս ազդագիրը', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-ru', prompt: 'Закрой это уведомление', surface: 'provider' as const, expectedAction: 'dismiss_push' },
  { id: 'dismiss-push-remove-ru', prompt: 'Убери этот алерт', surface: 'provider' as const, expectedAction: 'dismiss_push' },
] as const;
