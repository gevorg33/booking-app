import type { BusinessNotificationSettings } from '../notifications/notification.types.js';
import { isConfigureWhatsappIntegrationPrompt } from './ai-whatsapp-integration.util.js';

/** Dashboard salon notification channel/reminder settings (ai-cmd-ext-2.19). */
export const DASHBOARD_NOTIFICATION_SETTINGS_MUTATE_INTENTS = [
  'configure_notification_settings',
] as const;

export type DashboardNotificationSettingsMutateIntent =
  (typeof DASHBOARD_NOTIFICATION_SETTINGS_MUTATE_INTENTS)[number];

/** Dashboard mutate intent (ai-cmd-ext-2.19). */
export const CONFIGURE_NOTIFICATION_SETTINGS_INTENT =
  'configure_notification_settings' as const;

export type NotificationSettingsAccessTier = 'M';

export function resolveNotificationSettingsAccessTier(
  action: string,
): NotificationSettingsAccessTier | null {
  return action === CONFIGURE_NOTIFICATION_SETTINGS_INTENT ? 'M' : null;
}

export const NOTIFICATION_SETTINGS_CLASSIFIER_RULES = `- configure_notification_settings: MUTATE — salon/business notification settings on Settings → Notifications (business.settings.notifications). Channel master toggles: emailEnabled, smsEnabled, whatsappEnabled. Appointment reminder toggles: reminder24hEmail/Sms/Whatsapp, reminder1hEmail/Sms/Whatsapp. Optional confirmation toggles: sendConfirmationEmail, sendConfirmationWhatsapp. Compound-friendly: one message may set multiple channels and reminder windows. NOT enable_notifications or appointment_reminder_preferences (signed-in customer prefs), NOT explain_my_notifications (customer read-only), NOT configure_push_recipients (provider mobile push recipients), NOT toggle_business_email_on_customer_change (business alert on customer cancel/reschedule only), NOT configure_whatsapp_integration (WhatsApp template/connection setup), NOT test_push, NOT notification_history.
- Examples:
  - "Configure notification settings — enable email and WhatsApp, disable SMS" → emailEnabled=true, whatsappEnabled=true, smsEnabled=false
  - "Turn on 24-hour email reminders for clients" → reminder24hEmail=true
  - "Disable 1-hour WhatsApp reminders" → reminder1hWhatsapp=false
  - "Enable SMS appointment reminders" → smsEnabled=true
  - "Set notification settings: email on, 24h and 1h WhatsApp reminders on" → emailEnabled=true, reminder24hWhatsapp=true, reminder1hWhatsapp=true`;

export type ConfigureNotificationSettingsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CONFIGURE_NOTIFICATION_SETTINGS_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CONFIGURE_NOTIFICATION_SETTINGS_PROMPTS: ConfigureNotificationSettingsPromptFixture[] =
  [
    {
      id: 'configure-channels-compound',
      prompt:
        'Configure notification settings — enable email and WhatsApp, disable SMS',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: {
        emailEnabled: true,
        whatsappEnabled: true,
        smsEnabled: false,
      },
    },
    {
      id: 'enable-24h-email',
      prompt: 'Turn on 24-hour email reminders for clients',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: { reminder24hEmail: true },
    },
    {
      id: 'disable-1h-whatsapp',
      prompt: 'Disable 1-hour WhatsApp reminders',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: { reminder1hWhatsapp: false },
    },
    {
      id: 'enable-sms-reminders',
      prompt: 'Enable SMS appointment reminders for customers',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: { smsEnabled: true },
    },
    {
      id: 'whatsapp-24h-1h',
      prompt:
        'Set notification settings: email on, 24h and 1h WhatsApp reminders on',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: {
        emailEnabled: true,
        reminder24hWhatsapp: true,
        reminder1hWhatsapp: true,
      },
    },
    {
      id: 'disable-email-channel',
      prompt: 'Turn off email notifications for the salon',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: { emailEnabled: false },
    },
    {
      id: 'enable-whatsapp-channel',
      prompt: 'Enable WhatsApp notifications for booking reminders',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: { whatsappEnabled: true },
    },
    {
      id: '24h-sms-reminder',
      prompt: 'Enable 24h SMS reminders for appointments',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: { reminder24hSms: true },
    },
    {
      id: 'disable-1h-email',
      prompt: 'Turn off 1 hour email appointment reminders',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: { reminder1hEmail: false },
    },
    {
      id: 'confirmation-email-whatsapp',
      prompt:
        'Configure notifications — send confirmation email and WhatsApp on booking',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: {
        sendConfirmationEmail: true,
        sendConfirmationWhatsapp: true,
      },
    },
    {
      id: 'disable-sms-24h',
      prompt: 'Disable 24-hour SMS reminders',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: { reminder24hSms: false },
    },
    {
      id: 'enable-all-channels',
      prompt:
        'Update notification settings: turn on email, SMS, and WhatsApp for the business',
      surface: 'dashboard',
      expectedAction: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      paramsPartial: {
        emailEnabled: true,
        smsEnabled: true,
        whatsappEnabled: true,
      },
    },
  ];

type NotificationChannel = 'email' | 'sms' | 'whatsapp';
type ReminderWindow = '24h' | '1h';

export type ParsedNotificationSettingsConfig = Partial<
  Pick<
    BusinessNotificationSettings,
    | 'emailEnabled'
    | 'smsEnabled'
    | 'whatsappEnabled'
    | 'sendConfirmationEmail'
    | 'sendConfirmationWhatsapp'
    | 'reminder24hEmail'
    | 'reminder1hEmail'
    | 'reminder24hSms'
    | 'reminder1hSms'
    | 'reminder24hWhatsapp'
    | 'reminder1hWhatsapp'
  >
>;

const MUTATE_VERB =
  /\b(configure|set|enable|disable|turn\s+on|turn\s+off|update|activate|deactivate)\b/i;

function isPushRecipientsPrompt(prompt: string): boolean {
  return (
    /\b(configure|set|update|assign|who\s+gets|manage)\b/i.test(prompt) &&
    /\b(push\s+recipients?|push\s+notifications?\s+recipients?|provider\s+push|mobile\s+push)\b/i.test(
      prompt,
    )
  );
}

function isTestPushPromptLocal(prompt: string): boolean {
  return /\b(test|send\s+test|ping)\b/i.test(prompt) && /\bpush\b/i.test(prompt);
}

function isNotificationHistoryPromptLocal(prompt: string): boolean {
  return /\b(notification\s+history|sent\s+notifications?|notification\s+log|recent\s+notifications?|delivery\s+log)\b/i.test(
    prompt,
  );
}

function isBusinessEmailOnCustomerChangePrompt(prompt: string): boolean {
  return (
    (/\b(toggle|enable|disable|turn\s+on|turn\s+off)\b/i.test(prompt) &&
      /\b(email|notify|alert)\b/i.test(prompt) &&
      /\b(customer\s+(?:cancel|reschedule|change)|booking\s+change|when\s+customers?\s+(?:cancel|reschedule))\b/i.test(
        prompt,
      )) ||
    /\bnotify\s+business\s+(?:by\s+)?email\s+when\s+customers?\b/i.test(prompt)
  );
}

function isWhatsAppIntegrationPrompt(prompt: string): boolean {
  return isConfigureWhatsappIntegrationPrompt(prompt);
}

function isCustomerNotificationPrompt(prompt: string): boolean {
  if (/\bnotification\s+settings?\b/i.test(prompt)) return false;
  if (
    /\b(?:salon|business|dashboard|clients?|customers?|booking|appointments?)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return (
    /\bmy\s+(?:notification|reminder)s?\b/i.test(prompt) ||
    /\bwhat\s+notifications?\s+will\s+i\b/i.test(prompt) ||
    /\bwill\s+you\s+(?:whatsapp|text|email)\s+me\b/i.test(prompt) ||
    (/\b(enable|disable|turn\s+on|turn\s+off)\b/i.test(prompt) &&
      /\b(notifications?|reminders?)\b/i.test(prompt) &&
      !/\b(?:24\s*h|1\s*h|email|sms|whatsapp)\b/i.test(prompt))
  );
}

function parseToggle(prompt: string, params: Record<string, unknown>): boolean | null {
  if (typeof params.enabled === 'boolean') return params.enabled;
  if (/\b(enable|turn\s+on|activate)\b/i.test(prompt)) return true;
  if (/\b(disable|turn\s+off|deactivate)\b/i.test(prompt)) return false;
  return null;
}

function parseChannels(prompt: string): NotificationChannel[] {
  const channels = new Set<NotificationChannel>();
  if (/\b(?:email|e-mail)\b/i.test(prompt)) channels.add('email');
  if (/\bsms\b/i.test(prompt) || /\btext\s+message/i.test(prompt)) {
    channels.add('sms');
  }
  if (/\bwhatsapp\b/i.test(prompt)) channels.add('whatsapp');
  return [...channels];
}

function parseReminderWindows(prompt: string): ReminderWindow[] {
  const windows = new Set<ReminderWindow>();
  if (
    /\b(?:24\s*-?\s*(?:h|hour|hr)s?|twenty[\s-]?four\s+hour)\b/i.test(prompt)
  ) {
    windows.add('24h');
  }
  if (/\b(?:1\s*-?\s*(?:h|hour|hr)|one\s+hour)\b/i.test(prompt)) {
    windows.add('1h');
  }
  return [...windows];
}

function channelMasterField(
  channel: NotificationChannel,
): keyof ParsedNotificationSettingsConfig {
  if (channel === 'email') return 'emailEnabled';
  if (channel === 'sms') return 'smsEnabled';
  return 'whatsappEnabled';
}

function reminderField(
  channel: NotificationChannel,
  window: ReminderWindow,
): keyof ParsedNotificationSettingsConfig {
  const suffix =
    channel === 'email' ? 'Email' : channel === 'sms' ? 'Sms' : 'Whatsapp';
  return window === '24h'
    ? (`reminder24h${suffix}` as keyof ParsedNotificationSettingsConfig)
    : (`reminder1h${suffix}` as keyof ParsedNotificationSettingsConfig);
}

function applyChannelToggle(
  config: ParsedNotificationSettingsConfig,
  channel: NotificationChannel,
  toggle: boolean,
): void {
  config[channelMasterField(channel)] = toggle;
}

function applyReminderToggle(
  config: ParsedNotificationSettingsConfig,
  channel: NotificationChannel,
  window: ReminderWindow,
  toggle: boolean,
): void {
  config[reminderField(channel, window)] = toggle;
}

export function isConfigureNotificationSettingsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isPushRecipientsPrompt(text)) return false;
  if (isTestPushPromptLocal(text)) return false;
  if (isNotificationHistoryPromptLocal(text)) return false;
  if (isBusinessEmailOnCustomerChangePrompt(text)) return false;
  if (isWhatsAppIntegrationPrompt(text)) return false;
  if (isCustomerNotificationPrompt(text)) return false;

  const hasMutateVerb = MUTATE_VERB.test(text);
  const hasSettingsPhrase = /\bnotification\s+settings?\b/i.test(text);
  const hasChannelCue = /\b(email|sms|whatsapp|text)\b/i.test(text);
  const hasReminderCue = /\breminders?\b/i.test(text);
  const hasWindowCue =
    /\b(?:24\s*-?\s*(?:h|hour)|1\s*-?\s*(?:h|hour)|twenty[\s-]?four|one\s+hour)\b/i.test(
      text,
    );
  const hasBusinessScope =
    /\b(?:salon|business|dashboard|clients?|customers?|booking|appointments?)\b/i.test(
      text,
    ) || hasSettingsPhrase;
  const hasConfirmationCue =
    /\bconfirmation\b/i.test(text) &&
    /\b(email|whatsapp|sms)\b/i.test(text);

  if (hasSettingsPhrase && hasMutateVerb) return true;
  if (hasMutateVerb && hasConfirmationCue && hasBusinessScope) return true;
  if (hasMutateVerb && hasReminderCue && (hasWindowCue || hasChannelCue) && hasBusinessScope) {
    return true;
  }
  if (
    hasMutateVerb &&
    hasChannelCue &&
    /\bnotifications?\b/i.test(text) &&
    hasBusinessScope
  ) {
    return true;
  }

  if (hasMutateVerb && hasReminderCue && hasChannelCue && hasWindowCue) {
    return true;
  }

  if (
    hasMutateVerb &&
    hasConfirmationCue &&
    /\b(configure|set|send)\b/i.test(text)
  ) {
    return true;
  }

  return false;
}

function parseSegmentSettings(segment: string): ParsedNotificationSettingsConfig {
  const partial: ParsedNotificationSettingsConfig = {};
  const toggle = parseToggle(segment, {});
  if (toggle === null) return partial;

  const channels = parseChannels(segment);
  const windows = parseReminderWindows(segment);
  const isReminder = /\breminders?\b/i.test(segment) || windows.length > 0;
  const isConfirmation = /\bconfirmation\b/i.test(segment);

  if (isConfirmation) {
    for (const channel of channels) {
      if (channel === 'email') partial.sendConfirmationEmail = toggle;
      if (channel === 'whatsapp') partial.sendConfirmationWhatsapp = toggle;
    }
    return partial;
  }

  if (isReminder) {
    const targetWindows =
      windows.length > 0
        ? windows
        : (['24h', '1h'] as ReminderWindow[]).filter((window) =>
            window === '24h'
              ? /\b(?:24\s*(?:h|hour|hr)s?|twenty[\s-]?four)\b/i.test(segment)
              : /\b(?:1\s*(?:h|hour|hr)|one\s+hour)\b/i.test(segment),
          );
    const targetChannels = channels.length ? channels : parseChannels(segment);

    if (targetChannels.length && targetWindows.length) {
      for (const channel of targetChannels) {
        for (const window of targetWindows) {
          applyReminderToggle(partial, channel, window, toggle);
        }
      }
    } else if (targetChannels.length) {
      for (const channel of targetChannels) {
        applyChannelToggle(partial, channel, toggle);
      }
    }
    return partial;
  }

  for (const channel of channels) {
    applyChannelToggle(partial, channel, toggle);
  }
  return partial;
}

export function parseConfigureNotificationSettingsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedNotificationSettingsConfig | null {
  const hasExplicitParams = [
    'emailEnabled',
    'smsEnabled',
    'whatsappEnabled',
    'reminder24hEmail',
    'reminder1hEmail',
    'reminder24hSms',
    'reminder1hSms',
    'reminder24hWhatsapp',
    'reminder1hWhatsapp',
    'sendConfirmationEmail',
    'sendConfirmationWhatsapp',
  ].some((key) => typeof params[key] === 'boolean');

  if (
    !isConfigureNotificationSettingsPrompt(prompt) &&
    !hasExplicitParams &&
    params._forceNotificationSettings !== true
  ) {
    return null;
  }

  const config: ParsedNotificationSettingsConfig = {};

  for (const key of [
    'emailEnabled',
    'smsEnabled',
    'whatsappEnabled',
    'reminder24hEmail',
    'reminder1hEmail',
    'reminder24hSms',
    'reminder1hSms',
    'reminder24hWhatsapp',
    'reminder1hWhatsapp',
    'sendConfirmationEmail',
    'sendConfirmationWhatsapp',
  ] as const) {
    if (typeof params[key] === 'boolean') {
      config[key] = params[key];
    }
  }

  const segments = prompt.split(/,\s*/).filter(Boolean);
  if (segments.length > 1) {
    let carriedToggle: boolean | null = null;
    for (const segment of segments) {
      const segmentToggle = parseToggle(segment, {});
      if (segmentToggle !== null) carriedToggle = segmentToggle;
      const effectiveSegment =
        segmentToggle !== null || carriedToggle === null
          ? segment
          : `${carriedToggle ? 'enable' : 'disable'} ${segment.trim()}`;
      Object.assign(config, parseSegmentSettings(effectiveSegment));
    }
  } else {
    Object.assign(config, parseSegmentSettings(prompt));
  }

  if (/\bemail\s+on\b/i.test(prompt)) config.emailEnabled = true;
  if (/\bemail\s+off\b/i.test(prompt)) config.emailEnabled = false;

  if (
    /\b24h\s+and\s+1h\b/i.test(prompt) &&
    /\bwhatsapp\b/i.test(prompt) &&
    /\b(on|enable|turn\s+on)\b/i.test(prompt)
  ) {
    config.reminder24hWhatsapp = true;
    config.reminder1hWhatsapp = true;
  }

  if (/\bsend\s+confirmation\b/i.test(prompt)) {
    if (/\bemail\b/i.test(prompt)) config.sendConfirmationEmail = true;
    if (/\bwhatsapp\b/i.test(prompt)) config.sendConfirmationWhatsapp = true;
  }

  return Object.keys(config).length ? config : null;
}

export function describeNotificationSettingsPatch(
  patch: ParsedNotificationSettingsConfig,
): string[] {
  const labels: Record<keyof ParsedNotificationSettingsConfig, string> = {
    emailEnabled: 'email channel',
    smsEnabled: 'SMS channel',
    whatsappEnabled: 'WhatsApp channel',
    sendConfirmationEmail: 'confirmation email',
    sendConfirmationWhatsapp: 'confirmation WhatsApp',
    reminder24hEmail: '24h email reminders',
    reminder1hEmail: '1h email reminders',
    reminder24hSms: '24h SMS reminders',
    reminder1hSms: '1h SMS reminders',
    reminder24hWhatsapp: '24h WhatsApp reminders',
    reminder1hWhatsapp: '1h WhatsApp reminders',
  };

  return Object.entries(patch).map(([key, value]) => {
    const label = labels[key as keyof ParsedNotificationSettingsConfig] ?? key;
    return `${label} ${value ? 'enabled' : 'disabled'}`;
  });
}

export function enrichNotificationSettingsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseConfigureNotificationSettingsFromPrompt(prompt, params);
  if (!parsed) return params;
  return { ...params, ...parsed };
}

export function rescueConfigureNotificationSettingsIntent(
  prompt: string,
  action: string,
): {
  action: typeof CONFIGURE_NOTIFICATION_SETTINGS_INTENT;
  rescueReason: string;
} | null {
  if (action === CONFIGURE_NOTIFICATION_SETTINGS_INTENT) return null;
  if (!isConfigureNotificationSettingsPrompt(prompt)) return null;
  return {
    action: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
    rescueReason: CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
  };
}
