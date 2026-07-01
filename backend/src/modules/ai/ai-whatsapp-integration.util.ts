import type { UpdateWhatsAppIntegrationDto } from '../notifications/dto/update-whatsapp-integration.dto.js';
import { isTestWebhookPrompt } from './ai-integrations.util.js';

/** Dashboard mutate intent (ai-cmd-ext-2.20). */
export const CONFIGURE_WHATSAPP_INTEGRATION_INTENT =
  'configure_whatsapp_integration' as const;

export const DASHBOARD_WHATSAPP_INTEGRATION_MUTATE_INTENTS = [
  CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
] as const;

export type DashboardWhatsappIntegrationMutateIntent =
  (typeof DASHBOARD_WHATSAPP_INTEGRATION_MUTATE_INTENTS)[number];

export type WhatsappIntegrationAccessTier = 'M';

export function resolveWhatsappIntegrationAccessTier(
  action: string,
): WhatsappIntegrationAccessTier | null {
  return action === CONFIGURE_WHATSAPP_INTEGRATION_INTENT ? 'M' : null;
}

export const WHATSAPP_INTEGRATION_CLASSIFIER_RULES = `- configure_whatsapp_integration: MUTATE — salon WhatsApp Business API setup on Settings → WhatsApp (business.settings.integrations.whatsapp). Connection mode: usePlatformDefault (platform shared account vs own credentials). Fields: phoneNumberId, businessAccountId (WABA), accessToken, templateConfirmation, templateReminder, templateLanguage, templateBodyParams, templateReminderBodyParams, fallbackTemplate, fallbackLanguage, fallbackBodyParams. Compound-friendly with notification onboarding. NOT configure_notification_settings (channel/reminder toggles only), NOT test_push (provider mobile push test), NOT test_webhook, NOT enable_notifications (customer prefs), NOT configure_marketing_registration_email.
- Examples:
  - "Configure WhatsApp integration for the salon" → configure_whatsapp_integration
  - "Use platform default WhatsApp connection" → usePlatformDefault=true
  - "Connect our own WhatsApp Business account" → usePlatformDefault=false
  - "Set WhatsApp confirmation template to appointment_confirmation" → templateConfirmation=appointment_confirmation
  - "Update WhatsApp reminder template to appointment_reminder" → templateReminder=appointment_reminder
  - "Set WhatsApp template language to en" → templateLanguage=en`;

export type ConfigureWhatsappIntegrationPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CONFIGURE_WHATSAPP_INTEGRATION_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CONFIGURE_WHATSAPP_INTEGRATION_PROMPTS: ConfigureWhatsappIntegrationPromptFixture[] =
  [
    {
      id: 'configure-integration',
      prompt: 'Configure WhatsApp integration for the salon',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
    },
    {
      id: 'connect-whatsapp-booking',
      prompt: 'Connect WhatsApp for booking confirmations',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
    },
    {
      id: 'platform-default',
      prompt: 'Use platform default WhatsApp connection',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
      paramsPartial: { usePlatformDefault: true },
    },
    {
      id: 'own-account',
      prompt: 'Connect our own WhatsApp Business account',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
      paramsPartial: { usePlatformDefault: false },
    },
    {
      id: 'confirmation-template',
      prompt: 'Set WhatsApp confirmation template to appointment_confirmation',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
      paramsPartial: { templateConfirmation: 'appointment_confirmation' },
    },
    {
      id: 'reminder-template',
      prompt: 'Update WhatsApp reminder template to appointment_reminder',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
      paramsPartial: { templateReminder: 'appointment_reminder' },
    },
    {
      id: 'template-language',
      prompt: 'Set WhatsApp template language to en',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
      paramsPartial: { templateLanguage: 'en' },
    },
    {
      id: 'phone-waba-ids',
      prompt:
        'Configure WhatsApp phone number ID 123456789012345 and WABA 987654321098765',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
      paramsPartial: {
        phoneNumberId: '123456789012345',
        businessAccountId: '987654321098765',
      },
    },
    {
      id: 'fallback-template',
      prompt: 'Set WhatsApp fallback template to hello_world',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
      paramsPartial: { fallbackTemplate: 'hello_world' },
    },
    {
      id: 'settings-page',
      prompt: 'Configure WhatsApp on the notifications settings page',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
    },
    {
      id: 'template-body-params',
      prompt: 'Set WhatsApp confirmation template body params to 4',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
      paramsPartial: { templateBodyParams: 4 },
    },
    {
      id: 'dual-templates',
      prompt:
        'Configure WhatsApp templates — confirmation template booking_confirmed and reminder template appt_reminder_v2',
      surface: 'dashboard',
      expectedAction: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
      paramsPartial: {
        templateConfirmation: 'booking_confirmed',
        templateReminder: 'appt_reminder_v2',
      },
    },
  ];

export type ParsedWhatsappIntegrationConfig = Partial<
  Pick<
    UpdateWhatsAppIntegrationDto,
    | 'usePlatformDefault'
    | 'phoneNumberId'
    | 'businessAccountId'
    | 'accessToken'
    | 'templateConfirmation'
    | 'templateReminder'
    | 'templateLanguage'
    | 'templateBodyParams'
    | 'templateReminderBodyParams'
    | 'fallbackTemplate'
    | 'fallbackLanguage'
    | 'fallbackBodyParams'
  >
>;

const MUTATE_VERB =
  /\b(configure|set|update|connect|enable|link|switch|use|change)\b/i;

const WHATSAPP_INTEGRATION_SIGNAL =
  /\b(whatsapp\s+integration|whatsapp\s+connection|whatsapp\s+template|whatsapp\s+templates?|connect\s+whatsapp|whatsapp\s+business|whatsapp\s+credentials?|phone\s+number\s+id|waba|business\s+account\s+id|meta\s+whatsapp|platform\s+default\s+whatsapp|own\s+whatsapp)\b/i;

function isWhatsappTestSendPrompt(prompt: string): boolean {
  if (isTestWebhookPrompt(prompt)) return true;
  return (
    /\b(test|send\s+test|ping)\b/i.test(prompt) &&
    /\bwhatsapp\b/i.test(prompt) &&
    !/\bintegration\b/i.test(prompt)
  );
}

function isNotificationChannelToggleOnly(prompt: string): boolean {
  return (
    /\b(enable|disable|turn\s+on|turn\s+off)\b/i.test(prompt) &&
    /\bwhatsapp\b/i.test(prompt) &&
    /\b(notifications?|reminders?|channel)\b/i.test(prompt) &&
    !WHATSAPP_INTEGRATION_SIGNAL.test(prompt) &&
    !/\b(template|integration|connection|phone\s+number|waba|credentials?)\b/i.test(
      prompt,
    )
  );
}

function parseConnectionMode(
  prompt: string,
  params: Record<string, unknown>,
): boolean | undefined {
  if (params.usePlatformDefault === true) return true;
  if (params.usePlatformDefault === false) return false;
  if (
    /\b(platform\s+default|use\s+platform|shared\s+platform|platform\s+whatsapp)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(own\s+account|custom\s+connection|our\s+whatsapp|connect\s+our|tenant\s+credentials?|business\s+account)\b/i.test(
      prompt,
    ) &&
    /\bwhatsapp\b/i.test(prompt)
  ) {
    return false;
  }
  return undefined;
}

function extractTemplateName(
  prompt: string,
  kind: 'confirmation' | 'reminder' | 'fallback',
): string | undefined {
  const quoted = prompt.match(/["']([\w.-]+)["']/);
  if (quoted?.[1]) return quoted[1];

  const patterns: Record<typeof kind, RegExp> = {
    confirmation:
      /\bconfirmation\s+template(?:\s+(?:to|as|name|=))?\s+([\w.-]+)/i,
    reminder: /\breminder\s+template(?:\s+(?:to|as|name|=))?\s+([\w.-]+)/i,
    fallback: /\bfallback\s+template(?:\s+(?:to|as|name|=))?\s+([\w.-]+)/i,
  };
  const match = prompt.match(patterns[kind]);
  if (match?.[1] && !/^(to|as|name|and|for)$/i.test(match[1])) {
    return match[1];
  }

  if (kind === 'confirmation') {
    const inline = prompt.match(
      /\bconfirmation\s+template\s+([\w.-]+)(?:\s+and|\s*$)/i,
    );
    if (inline?.[1]) return inline[1];
  }
  if (kind === 'reminder') {
    const inline = prompt.match(/\breminder\s+template\s+([\w.-]+)/i);
    if (inline?.[1]) return inline[1];
  }
  return undefined;
}

function parseNumericParam(
  prompt: string,
  params: Record<string, unknown>,
  paramKey: keyof ParsedWhatsappIntegrationConfig,
  label: string,
): number | undefined {
  const fromParams = params[paramKey];
  if (typeof fromParams === 'number' && Number.isFinite(fromParams)) {
    return fromParams;
  }
  const match = prompt.match(
    new RegExp(`\\b${label}\\s+(?:body\\s+)?params?\\s+(?:to\\s+)?(\\d+)`, 'i'),
  );
  if (match?.[1]) return Number(match[1]);
  return undefined;
}

function parseLanguage(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  if (typeof params.templateLanguage === 'string') {
    return params.templateLanguage.trim();
  }
  const match = prompt.match(
    /\btemplate\s+language\s+(?:to\s+)?([a-z]{2}(?:_[A-Z]{2})?)\b/i,
  );
  return match?.[1];
}

function parseFallbackLanguage(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  if (typeof params.fallbackLanguage === 'string') {
    return params.fallbackLanguage.trim();
  }
  const match = prompt.match(
    /\bfallback\s+language\s+(?:to\s+)?([a-z]{2}(?:_[A-Z]{2})?)\b/i,
  );
  return match?.[1];
}

function parsePhoneNumberId(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  if (typeof params.phoneNumberId === 'string') {
    return params.phoneNumberId.trim();
  }
  const match = prompt.match(/\bphone\s+number\s+id\s+(\d{8,20})\b/i);
  return match?.[1];
}

function parseBusinessAccountId(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  if (typeof params.businessAccountId === 'string') {
    return params.businessAccountId.trim();
  }
  const waba = prompt.match(/\bwaba\s+(\d{8,20})\b/i);
  if (waba?.[1]) return waba[1];
  const match = prompt.match(
    /\b(?:business\s+account\s+id|whatsapp\s+business\s+account)\s+(\d{8,20})\b/i,
  );
  return match?.[1];
}

export function isConfigureWhatsappIntegrationPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isWhatsappTestSendPrompt(text)) return false;
  if (isNotificationChannelToggleOnly(text)) return false;
  if (
    /\b(marketing|registration)\b/i.test(text) &&
    /\bemail\b/i.test(text) &&
    !WHATSAPP_INTEGRATION_SIGNAL.test(text)
  ) {
    return false;
  }

  if (!/\bwhatsapp\b/i.test(text)) return false;
  if (!MUTATE_VERB.test(text)) return false;

  if (WHATSAPP_INTEGRATION_SIGNAL.test(text)) return true;

  if (
    /\b(template|phone\s+number|waba|platform\s+default|integration|connection|credentials?|fallback)\b/i.test(
      text,
    )
  ) {
    return true;
  }

  return (
    /\b(configure|connect|set\s+up)\b/i.test(text) &&
    /\b(notifications?\s+settings?|settings?\s+page)\b/i.test(text)
  );
}

export function parseConfigureWhatsappIntegrationFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedWhatsappIntegrationConfig | null {
  const explicitKeys = [
    'usePlatformDefault',
    'phoneNumberId',
    'businessAccountId',
    'accessToken',
    'templateConfirmation',
    'templateReminder',
    'templateLanguage',
    'templateBodyParams',
    'templateReminderBodyParams',
    'fallbackTemplate',
    'fallbackLanguage',
    'fallbackBodyParams',
  ] as const;
  const hasExplicitParams = explicitKeys.some(
    (key) => params[key] !== undefined,
  );

  if (
    !isConfigureWhatsappIntegrationPrompt(prompt) &&
    !hasExplicitParams &&
    params._forceWhatsappIntegration !== true
  ) {
    return null;
  }

  const config: ParsedWhatsappIntegrationConfig = {};

  for (const key of explicitKeys) {
    const value = params[key];
    if (value === undefined) continue;
    if (typeof value === 'string' && value.trim()) {
      (config as Record<string, string>)[key] = value.trim();
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      (config as Record<string, boolean | number>)[key] = value;
    }
  }

  const connectionMode = parseConnectionMode(prompt, params);
  if (connectionMode !== undefined) config.usePlatformDefault = connectionMode;

  const templateConfirmation = extractTemplateName(prompt, 'confirmation');
  if (templateConfirmation) config.templateConfirmation = templateConfirmation;
  const templateReminder = extractTemplateName(prompt, 'reminder');
  if (templateReminder) config.templateReminder = templateReminder;
  const fallbackTemplate = extractTemplateName(prompt, 'fallback');
  if (fallbackTemplate) config.fallbackTemplate = fallbackTemplate;

  const templateLanguage = parseLanguage(prompt, params);
  if (templateLanguage) config.templateLanguage = templateLanguage;
  const fallbackLanguage = parseFallbackLanguage(prompt, params);
  if (fallbackLanguage) config.fallbackLanguage = fallbackLanguage;

  const phoneNumberId = parsePhoneNumberId(prompt, params);
  if (phoneNumberId) config.phoneNumberId = phoneNumberId;
  const businessAccountId = parseBusinessAccountId(prompt, params);
  if (businessAccountId) config.businessAccountId = businessAccountId;

  const templateBodyParams = parseNumericParam(
    prompt,
    params,
    'templateBodyParams',
    'confirmation\\s+template',
  );
  if (templateBodyParams !== undefined) {
    config.templateBodyParams = templateBodyParams;
  }
  const templateReminderBodyParams = parseNumericParam(
    prompt,
    params,
    'templateReminderBodyParams',
    'reminder\\s+template',
  );
  if (templateReminderBodyParams !== undefined) {
    config.templateReminderBodyParams = templateReminderBodyParams;
  }

  if (isConfigureWhatsappIntegrationPrompt(prompt)) return config;
  return Object.keys(config).length ? config : null;
}

export function describeWhatsappIntegrationPatch(
  patch: ParsedWhatsappIntegrationConfig,
): string[] {
  const labels: Record<keyof ParsedWhatsappIntegrationConfig, string> = {
    usePlatformDefault: 'connection mode',
    phoneNumberId: 'phone number ID',
    businessAccountId: 'WhatsApp Business Account ID',
    accessToken: 'access token',
    templateConfirmation: 'confirmation template',
    templateReminder: 'reminder template',
    templateLanguage: 'template language',
    templateBodyParams: 'confirmation template body params',
    templateReminderBodyParams: 'reminder template body params',
    fallbackTemplate: 'fallback template',
    fallbackLanguage: 'fallback language',
    fallbackBodyParams: 'fallback body params',
  };

  return Object.entries(patch).map(([key, value]) => {
    const label = labels[key as keyof ParsedWhatsappIntegrationConfig] ?? key;
    if (key === 'usePlatformDefault') {
      return `${label}: ${value ? 'platform default' : 'own account'}`;
    }
    return `${label}: ${String(value)}`;
  });
}

export function enrichWhatsappIntegrationParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseConfigureWhatsappIntegrationFromPrompt(prompt, params);
  if (!parsed) return params;
  return { ...params, ...parsed };
}

export function rescueConfigureWhatsappIntegrationIntent(
  prompt: string,
  action: string,
): {
  action: typeof CONFIGURE_WHATSAPP_INTEGRATION_INTENT;
  rescueReason: string;
} | null {
  if (action === CONFIGURE_WHATSAPP_INTEGRATION_INTENT) return null;
  if (!isConfigureWhatsappIntegrationPrompt(prompt)) return null;
  return {
    action: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
    rescueReason: CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
  };
}
