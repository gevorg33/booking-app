import { isTestWebhookPrompt } from './ai-integrations.util.js';
import {
  isConfigureNotificationSettingsPrompt,
  enrichNotificationSettingsParamsFromPrompt,
  rescueConfigureNotificationSettingsIntent,
} from './ai-notification-settings.util.js';
import {
  isConfigureWhatsappIntegrationPrompt,
  enrichWhatsappIntegrationParamsFromPrompt,
  rescueConfigureWhatsappIntegrationIntent,
} from './ai-whatsapp-integration.util.js';

export const DASHBOARD_PUSH_NOTIFICATIONS_MUTATE_INTENTS = [
  'configure_notification_settings',
  'configure_whatsapp_integration',
  'configure_push_recipients',
  'test_push',
  'toggle_business_email_on_customer_change',
] as const;

export const DASHBOARD_PUSH_NOTIFICATIONS_READ_INTENTS = [
  'notification_history',
] as const;

export const PROVIDER_PUSH_NOTIFICATIONS_MUTATE_INTENTS = [
  'retry_offline_action',
  'dismiss_push',
] as const;

export const PROVIDER_PUSH_NOTIFICATIONS_READ_INTENTS = [
  'explain_last_push',
  'open_booking_from_push',
  'offline_queue_status',
  'end_of_day_summary',
  'new_booking_push_actions',
] as const;

export const CUSTOMER_PUSH_NOTIFICATIONS_INTENTS = [
  'enable_notifications',
  'appointment_reminder_preferences',
] as const;

export const PUSH_NOTIFICATIONS_INTENTS = [
  ...DASHBOARD_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
  ...DASHBOARD_PUSH_NOTIFICATIONS_READ_INTENTS,
  ...PROVIDER_PUSH_NOTIFICATIONS_MUTATE_INTENTS,
  ...PROVIDER_PUSH_NOTIFICATIONS_READ_INTENTS,
  ...CUSTOMER_PUSH_NOTIFICATIONS_INTENTS,
] as const;

export type PushNotificationsIntent =
  (typeof PUSH_NOTIFICATIONS_INTENTS)[number];

export interface PushNotificationsCompoundStep {
  action: PushNotificationsIntent;
  params: Record<string, unknown>;
  segment: string;
}

export interface ProviderLastPushPayload {
  title?: string;
  body?: string;
  pushType?: string;
  bookingId?: string;
  businessId?: string;
  url?: string;
  aiPrompt?: string;
  foregroundHint?: string;
  actions?: Array<{ id: string; label: string }>;
}

const PUSH_NOTIFICATIONS_VERB =
  /\b(explain|open|offline|queue|retry|dismiss|end\s+of\s+day|eod|push|notification|reminder|enable|configure|test|history|toggle|sync|replay|booking)\b/i;

const COMPOUND_NEXT =
  '(?:explain|open|offline|queue|retry|dismiss|end|eod|push|notification|reminder|enable|configure|test|history|toggle|sync|replay|booking|recipients|email|customer|appointment|actions|status|show|send|set|new|what)';

const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*|\\s+and\\s+(?=${COMPOUND_NEXT}\\b)|\\s+then\\s+(?=${COMPOUND_NEXT}\\b)`,
  'i',
);

export function isPushNotificationsIntent(
  action: string,
): action is PushNotificationsIntent {
  return (PUSH_NOTIFICATIONS_INTENTS as readonly string[]).includes(action);
}

export function isSummarizeDayOnlyPrompt(prompt: string): boolean {
  return (
    /\b(summarize|summary)\b/i.test(prompt) &&
    /\b(my\s+day|today|appointments?)\b/i.test(prompt) &&
    !/\b(push|eod|end\s+of\s+day)\b/i.test(prompt)
  );
}

export function isExplainLastPushPrompt(prompt: string): boolean {
  return (
    /\b(explain|what\s+was|what\s+did|tell\s+me\s+about|decode|understand)\b/i.test(
      prompt,
    ) &&
    /\b(last\s+push|push\s+notification|notification\s+i\s+got|recent\s+push|that\s+push|this\s+push)\b/i.test(
      prompt,
    )
  );
}

export function isOpenBookingFromPushPrompt(prompt: string): boolean {
  return (
    (/\b(open|view|go\s+to|show|navigate)\b/i.test(prompt) &&
      /\b(booking|appointment)\b/i.test(prompt) &&
      /\b(from\s+(?:the\s+)?push|push\s+notification|notification|alert)\b/i.test(
        prompt,
      )) ||
    /\bopen\s+booking\s+from\s+push\b/i.test(prompt)
  );
}

export function isOfflineQueueStatusPrompt(prompt: string): boolean {
  return (
    /\b(offline\s+queue(?:\s+status)?|queued\s+actions?|pending\s+sync|what(?:'s|\s+is)\s+queued)\b/i.test(
      prompt,
    ) ||
    (/\b(queue\s+status|sync\s+status|how\s+many\s+queued)\b/i.test(prompt) &&
      /\boffline\b/i.test(prompt)) ||
    /\bshow\s+offline\s+queue\b/i.test(prompt)
  );
}

export function isRetryOfflineActionPrompt(prompt: string): boolean {
  return (
    /\b(retry|replay|resync|sync|flush)\b/i.test(prompt) &&
    /\b(offline|queued|queue|pending\s+actions?)\b/i.test(prompt)
  );
}

export function isDismissPushPrompt(prompt: string): boolean {
  return (
    /\b(dismiss|clear|ignore|close)\b/i.test(prompt) &&
    /\b(push|notification|alert|banner)\b/i.test(prompt) &&
    !/\bhistory\b/i.test(prompt)
  );
}

export function isEndOfDaySummaryPrompt(prompt: string): boolean {
  if (isSummarizeDayOnlyPrompt(prompt)) return false;
  return (
    (/\b(end\s+of\s+day|eod)\b/i.test(prompt) &&
      /\b(summary|push|report|notification)\b/i.test(prompt)) ||
    /\bwhat\s+does\s+the\s+end\s+of\s+day\s+push\b/i.test(prompt)
  );
}

export function isNewBookingPushActionsPrompt(prompt: string): boolean {
  return (
    (/\b(new\s+booking|booking)\b/i.test(prompt) &&
      /\bpush\b/i.test(prompt) &&
      /\b(actions?|buttons?|options?|confirm|mark\s+paid|reschedule)\b/i.test(
        prompt,
      )) ||
    /\bwhat\s+can\s+i\s+do\s+from\s+(?:the\s+)?(?:new\s+)?booking\s+push\b/i.test(
      prompt,
    )
  );
}

export function isConfigurePushRecipientsPrompt(prompt: string): boolean {
  return (
    /\b(configure|set|update|assign|who\s+gets|manage)\b/i.test(prompt) &&
    /\b(push\s+recipients?|push\s+notifications?\s+recipients?|provider\s+push|mobile\s+push)\b/i.test(
      prompt,
    )
  );
}

export function isTestPushPrompt(prompt: string): boolean {
  if (isTestWebhookPrompt(prompt)) return false;
  return (
    /\b(test|send\s+test|ping)\b/i.test(prompt) && /\bpush\b/i.test(prompt)
  );
}

export function isNotificationHistoryPrompt(prompt: string): boolean {
  if (
    !/\b(notification\s+history|sent\s+notifications?|notification\s+log|recent\s+notifications?|delivery\s+log)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return !/\border\s+status\b/i.test(prompt);
}

export function isToggleBusinessEmailOnCustomerChangePrompt(
  prompt: string,
): boolean {
  return (
    (/\b(toggle|enable|disable|turn\s+on|turn\s+off)\b/i.test(prompt) &&
      /\b(email|notify|alert)\b/i.test(prompt) &&
      /\b(customer\s+(?:cancel|reschedule|change)|booking\s+change|when\s+customers?\s+(?:cancel|reschedule))\b/i.test(
        prompt,
      )) ||
    /\bnotify\s+business\s+(?:by\s+)?email\s+when\s+customers?\b/i.test(prompt)
  );
}

export function isEnableNotificationsPrompt(prompt: string): boolean {
  if (isConfigureNotificationSettingsPrompt(prompt)) return false;
  if (
    isNotificationHistoryPrompt(prompt) ||
    isAppointmentReminderPreferencesPrompt(prompt)
  )
    return false;
  if (/\border\s+status\b/i.test(prompt) || /\bgift\s+card\b/i.test(prompt))
    return false;
  if (
    /\b(turn|switch)\s+off\b/i.test(prompt) &&
    /\bappointment\s+reminders?\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(enable|turn\s+on|allow|opt[\s-]?in|disable|turn\s+off)\b/i.test(
      prompt,
    ) &&
    /\b(notifications?|reminders?|alerts?)\b/i.test(prompt) &&
    !/\b(push\s+recipients?|provider|business)\b/i.test(prompt)
  );
}

export function isAppointmentReminderPreferencesPrompt(
  prompt: string,
): boolean {
  if (
    /\bcurrency\b/i.test(prompt) ||
    /\b(why|what|explain)\b[\s\S]{0,40}\b(amount|dram|euro|€|֏|\$)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return (
    /\b(appointment\s+reminder|reminder\s+preferences?|reminder\s+timing|when\s+to\s+remind|reminder\s+options?)\b/i.test(
      prompt,
    ) ||
    (/\b(reminder|reminders)\b/i.test(prompt) &&
      /\b(preferences?|settings?|choose|pick|hours?\s+before)\b/i.test(
        prompt,
      ) &&
      !/\b(provider|push|business)\b/i.test(prompt))
  );
}

export function isPushNotificationsCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20 || !PUSH_NOTIFICATIONS_VERB.test(trimmed))
    return false;
  return (
    COMPOUND_SPLIT.test(trimmed) ||
    decomposePushNotificationsCompoundPrompt(trimmed).length > 1
  );
}

export function resolveCommandPromptText(
  prompt?: string,
  params?: Record<string, unknown>,
): string {
  if (typeof prompt === 'string' && prompt.length > 0) return prompt;
  const fromParams = params?._prompt;
  return typeof fromParams === 'string' ? fromParams : '';
}

export function extractBookingIdFromPushPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  return uuid?.[1] ?? null;
}

export function extractPushRecipientNamesFromPrompt(prompt: string): string[] {
  const names: string[] = [];
  const forMatch = prompt.match(
    /\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)*)/,
  );
  if (forMatch) {
    names.push(
      ...forMatch[1]
        .split(/\s*,\s*/)
        .map((n) => n.trim())
        .filter(Boolean),
    );
  }
  const addMatch = prompt.match(/\badd\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (addMatch) names.push(addMatch[1].trim());
  return [...new Set(names)];
}

export function extractNotificationToggleFromPrompt(
  prompt: string,
): boolean | null {
  if (/\b(enable|turn\s+on|activate)\b/i.test(prompt)) return true;
  if (/\b(disable|turn\s+off|deactivate)\b/i.test(prompt)) return false;
  return null;
}

export function resolveNotificationEnabledFromPrompt(prompt: string): boolean {
  const toggle = extractNotificationToggleFromPrompt(prompt);
  if (toggle === null) return true;
  return toggle;
}

export function resolveSmsRemindersWhenEnabling(
  enabled: boolean,
  existing?: Record<string, unknown>,
): boolean {
  if (!enabled) return false;
  return existing?.smsReminders === true;
}

export function extractReminderHoursFromPrompt(prompt: string): number | null {
  const hours = prompt.match(/\b(\d+)\s+hours?\s+before\b/i);
  return hours ? Number(hours[1]) : null;
}

export function parseProviderLastPushPayload(
  raw: unknown,
): ProviderLastPushPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  const actions = Array.isArray(payload.actions)
    ? payload.actions
        .filter((a) => a && typeof a === 'object')
        .map((a) => {
          const entry = a as Record<string, unknown>;
          return {
            id: String(entry.id ?? ''),
            label: String(entry.label ?? ''),
          };
        })
        .filter((a) => a.id)
    : undefined;
  return {
    title: typeof payload.title === 'string' ? payload.title : undefined,
    body: typeof payload.body === 'string' ? payload.body : undefined,
    pushType:
      typeof payload.pushType === 'string' ? payload.pushType : undefined,
    bookingId:
      typeof payload.bookingId === 'string' ? payload.bookingId : undefined,
    businessId:
      typeof payload.businessId === 'string' ? payload.businessId : undefined,
    url: typeof payload.url === 'string' ? payload.url : undefined,
    aiPrompt:
      typeof payload.aiPrompt === 'string' ? payload.aiPrompt : undefined,
    foregroundHint:
      typeof payload.foregroundHint === 'string'
        ? payload.foregroundHint
        : undefined,
    actions,
  };
}

export function explainLastPushSummary(
  payload: ProviderLastPushPayload,
): string {
  const parts: string[] = [];
  if (payload.pushType === 'booking_created') {
    parts.push(
      'New booking push with quick actions: Confirm, Mark paid, or Reschedule.',
    );
  } else if (payload.pushType === 'end_of_day') {
    parts.push(
      'End-of-day summary push with a link to review today and unpaid items.',
    );
  } else if (payload.pushType === 'booking_updated') {
    parts.push('Booking update push — open the appointment to review changes.');
  } else if (payload.pushType) {
    parts.push(`Push type: ${payload.pushType}.`);
  }
  if (payload.title) parts.push(`Title: ${payload.title}.`);
  if (payload.body) parts.push(`Message: ${payload.body}.`);
  if (payload.bookingId) parts.push(`Linked booking: ${payload.bookingId}.`);
  if (payload.aiPrompt)
    parts.push(`Suggested AI follow-up: ${payload.aiPrompt}`);
  return parts.length
    ? parts.join(' ')
    : 'No push details were provided — open your notification tray for the latest alert.';
}

export function buildNewBookingPushActionsGuide(): {
  summary: string;
  actions: Array<{ id: string; label: string; description: string }>;
} {
  return {
    summary:
      'New booking pushes include Confirm, Mark paid, and Reschedule actions. Tap an action or open the booking to continue in the provider app.',
    actions: [
      {
        id: 'confirm',
        label: 'Confirm',
        description: 'Marks the appointment as confirmed.',
      },
      {
        id: 'mark_paid',
        label: 'Mark paid',
        description:
          'Marks payment complete and completes cash-at-venue visits.',
      },
      {
        id: 'suggest_reschedule',
        label: 'Reschedule',
        description: 'Opens AI with a prefilled reschedule prompt.',
      },
    ],
  };
}

export function buildOfflineQueueStatusSummary(input: {
  online: boolean;
  queuedCount: number;
}): string {
  if (!input.online && input.queuedCount > 0) {
    return `You are offline with ${input.queuedCount} queued action${input.queuedCount === 1 ? '' : 's'}. They will replay when you reconnect.`;
  }
  if (!input.online) {
    return 'You are offline. Booking updates and safe AI confirms will queue until you are back online.';
  }
  if (input.queuedCount > 0) {
    return `Online — syncing ${input.queuedCount} queued action${input.queuedCount === 1 ? '' : 's'}.`;
  }
  return 'Online — no offline actions are queued.';
}

export function buildRetryOfflineActionGuidance(input: {
  online: boolean;
  queuedCount: number;
}): { summary: string; canRetry: boolean; steps: string[] } {
  if (input.queuedCount === 0) {
    return {
      summary: 'Nothing to retry — your offline queue is empty.',
      canRetry: false,
      steps: [],
    };
  }
  if (!input.online) {
    return {
      summary: `Reconnect to retry ${input.queuedCount} queued action${input.queuedCount === 1 ? '' : 's'}.`,
      canRetry: false,
      steps: [
        'Restore network connectivity.',
        'Return to the provider app — queued mutations replay automatically.',
        'If an action still fails, open it from Today and run the command again.',
      ],
    };
  }
  return {
    summary: `Replay started for ${input.queuedCount} queued action${input.queuedCount === 1 ? '' : 's'}.`,
    canRetry: true,
    steps: [
      'Stay on the provider app while sync completes.',
      'Watch the offline banner — it clears when the queue is empty.',
      'Verify updated appointments in Today after sync.',
    ],
  };
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescuePushNotificationsIntent(
  prompt: string,
  action: string,
): { action: PushNotificationsIntent; rescueReason: string } | null {
  if (isPushNotificationsIntent(action)) return null;
  if (isPushNotificationsCompoundPrompt(prompt)) return null;

  const notificationSettings = rescueConfigureNotificationSettingsIntent(
    prompt,
    action,
  );
  if (notificationSettings) return notificationSettings;

  const whatsappIntegration = rescueConfigureWhatsappIntegrationIntent(
    prompt,
    action,
  );
  if (whatsappIntegration) return whatsappIntegration;

  if (isAppointmentReminderPreferencesPrompt(prompt)) {
    return {
      action: 'appointment_reminder_preferences',
      rescueReason: 'reminder_prefs',
    };
  }
  if (isEnableNotificationsPrompt(prompt)) {
    return {
      action: 'enable_notifications',
      rescueReason: 'enable_notifications',
    };
  }
  if (isToggleBusinessEmailOnCustomerChangePrompt(prompt)) {
    return {
      action: 'toggle_business_email_on_customer_change',
      rescueReason: 'business_email_toggle',
    };
  }
  if (isNotificationHistoryPrompt(prompt)) {
    return {
      action: 'notification_history',
      rescueReason: 'notification_history',
    };
  }
  if (isTestPushPrompt(prompt)) {
    return { action: 'test_push', rescueReason: 'test_push' };
  }
  if (isConfigurePushRecipientsPrompt(prompt)) {
    return {
      action: 'configure_push_recipients',
      rescueReason: 'push_recipients',
    };
  }

  if (isNewBookingPushActionsPrompt(prompt)) {
    return {
      action: 'new_booking_push_actions',
      rescueReason: 'booking_push_actions',
    };
  }
  if (isEndOfDaySummaryPrompt(prompt)) {
    return { action: 'end_of_day_summary', rescueReason: 'end_of_day_summary' };
  }
  if (isDismissPushPrompt(prompt)) {
    return { action: 'dismiss_push', rescueReason: 'dismiss_push' };
  }
  if (isRetryOfflineActionPrompt(prompt)) {
    return { action: 'retry_offline_action', rescueReason: 'retry_offline' };
  }
  if (isOfflineQueueStatusPrompt(prompt)) {
    return { action: 'offline_queue_status', rescueReason: 'offline_queue' };
  }
  if (isOpenBookingFromPushPrompt(prompt)) {
    return { action: 'open_booking_from_push', rescueReason: 'open_from_push' };
  }
  if (isExplainLastPushPrompt(prompt)) {
    return { action: 'explain_last_push', rescueReason: 'explain_push' };
  }

  return null;
}

export function classifyPushNotificationsSegment(
  segment: string,
): PushNotificationsCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base: Record<string, unknown> = {};
  const bookingId = extractBookingIdFromPushPrompt(text);
  if (bookingId) base.bookingId = bookingId;
  const recipientNames = extractPushRecipientNamesFromPrompt(text);
  if (recipientNames.length) base.recipientNames = recipientNames;
  const toggle = extractNotificationToggleFromPrompt(text);
  if (toggle !== null) base.enabled = toggle;
  const reminderHours = extractReminderHoursFromPrompt(text);
  if (reminderHours !== null) base.reminderHoursBefore = reminderHours;

  if (isConfigureNotificationSettingsPrompt(text)) {
    return {
      action: 'configure_notification_settings',
      params: enrichNotificationSettingsParamsFromPrompt(base, text),
      segment: text,
    };
  }
  if (isConfigureWhatsappIntegrationPrompt(text)) {
    return {
      action: 'configure_whatsapp_integration',
      params: enrichWhatsappIntegrationParamsFromPrompt(base, text),
      segment: text,
    };
  }
  if (isAppointmentReminderPreferencesPrompt(text)) {
    return {
      action: 'appointment_reminder_preferences',
      params: base,
      segment: text,
    };
  }
  if (isEnableNotificationsPrompt(text)) {
    return { action: 'enable_notifications', params: base, segment: text };
  }
  if (isToggleBusinessEmailOnCustomerChangePrompt(text)) {
    return {
      action: 'toggle_business_email_on_customer_change',
      params: base,
      segment: text,
    };
  }
  if (isNotificationHistoryPrompt(text)) {
    return { action: 'notification_history', params: base, segment: text };
  }
  if (isTestPushPrompt(text)) {
    return { action: 'test_push', params: base, segment: text };
  }
  if (isConfigurePushRecipientsPrompt(text)) {
    return { action: 'configure_push_recipients', params: base, segment: text };
  }
  if (isNewBookingPushActionsPrompt(text)) {
    return { action: 'new_booking_push_actions', params: base, segment: text };
  }
  if (isEndOfDaySummaryPrompt(text)) {
    return { action: 'end_of_day_summary', params: base, segment: text };
  }
  if (isDismissPushPrompt(text)) {
    return { action: 'dismiss_push', params: base, segment: text };
  }
  if (isRetryOfflineActionPrompt(text)) {
    return { action: 'retry_offline_action', params: base, segment: text };
  }
  if (isOfflineQueueStatusPrompt(text)) {
    return { action: 'offline_queue_status', params: base, segment: text };
  }
  if (isOpenBookingFromPushPrompt(text)) {
    return { action: 'open_booking_from_push', params: base, segment: text };
  }
  if (isExplainLastPushPrompt(text)) {
    return { action: 'explain_last_push', params: base, segment: text };
  }
  return null;
}

/** Deterministic multi-command split for push, offline, and notification operations. */
export function decomposePushNotificationsCompoundPrompt(
  prompt: string,
): PushNotificationsCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);

  if (nonEmpty.length <= 1) {
    const single = classifyPushNotificationsSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: PushNotificationsCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyPushNotificationsSegment(segment);
    if (step) steps.push(step);
  }
  return steps;
}
