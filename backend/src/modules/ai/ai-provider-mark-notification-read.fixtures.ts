/** ai-cmd-provider-6.8.6 — provider mobile: mark a single notification-center row as read. */

export const PROVIDER_MARK_NOTIFICATION_READ_CLASSIFIER_RULES = `- mark_notification_read: MUTATE — mark exactly one notification-center entry as read (by explicit id from context, or "the latest"/"that one"). Triggers: mark this notification as read, mark that push as read, mark my latest notification as read. Uses POST …/push/notifications/:id/read. NOT mark_all_notifications_read (every unread), NOT mark_booking_notifications_read (every notification tied to one booking), NOT dismiss_push (clears/hides without marking read).`;

export const PROVIDER_MARK_NOTIFICATION_READ_PROMPT_SCENARIOS = [
  { id: 'mark-notification-read-this-en', prompt: 'Mark this notification as read', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
  { id: 'mark-notification-read-that-push-en', prompt: 'Mark that push as read', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
  { id: 'mark-notification-read-latest-en', prompt: 'Mark my latest notification as read', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
  { id: 'mark-notification-read-this-alert-en', prompt: 'Mark this alert as read', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
  { id: 'mark-notification-read-that-one-en', prompt: 'Mark that one as read', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
  { id: 'mark-notification-read-latest-push-en', prompt: 'Mark the latest push as read', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
  { id: 'mark-notification-read-hy', prompt: 'Նշիր այս ծանուցումը որպես կարդացված', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
  { id: 'mark-notification-read-latest-hy', prompt: 'Նշիր իմ վերջին ծանուցումը որպես կարդացված', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
  { id: 'mark-notification-read-ru', prompt: 'Отметь это уведомление как прочитанное', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
  { id: 'mark-notification-read-latest-ru', prompt: 'Отметь моё последнее уведомление как прочитанное', surface: 'provider' as const, expectedAction: 'mark_notification_read' },
] as const;
