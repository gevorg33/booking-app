/** adopt-6.6 / adopt-6.7 — growth loop AI intents (EN/HY/RU). */

export const CUSTOMER_ADOPT_6_GROWTH_INTENTS = [
  'explain_my_notifications',
  'manage_notification_preferences',
  'refer_a_friend',
  'rebook_last_appointment',
  'find_my_saved_salons',
] as const;

export const PROVIDER_ADOPT_6_GROWTH_INTENTS = [
  'explain_push_setup',
  'enable_push_notifications',
] as const;

export const ADOPT_6_GROWTH_INTENTS = [
  ...CUSTOMER_ADOPT_6_GROWTH_INTENTS,
  ...PROVIDER_ADOPT_6_GROWTH_INTENTS,
] as const;

export type CustomerAdopt6GrowthIntent = (typeof CUSTOMER_ADOPT_6_GROWTH_INTENTS)[number];
export type ProviderAdopt6GrowthIntent = (typeof PROVIDER_ADOPT_6_GROWTH_INTENTS)[number];

export const CUSTOMER_ADOPT_6_CLASSIFIER_RULES = `
- explain_my_notifications — user asks what notifications they get, why they received a message, or how reminders work (EN/HY/RU: "what notifications", "why did I get this", "հիշեցումներ", "уведомления").
- manage_notification_preferences — user wants to change reminder/marketing/offers settings (not first-time enable only): "notification settings", "reminder preferences", "turn off offers".
- refer_a_friend — invite friends, share referral link/code, get reward for inviting (EN/HY/RU: "refer a friend", "invite", "Ուղղորդել", "пригласить друга").
- rebook_last_appointment — repeat last visit, same service/provider, book again (EN/HY/RU: "rebook", "book again", "նույն ծառայությունը", "записаться снова").
- find_my_saved_salons — list pinned or recently visited salons in the consumer app (EN/HY/RU: "saved salons", "my salons", "պահված", "мои салоны").
`.trim();

export const PROVIDER_ADOPT_6_CLASSIFIER_RULES = `
- explain_push_setup — provider asks how push works, why notifications are off, or setup steps on iOS/Android.
- enable_push_notifications — provider wants to turn on booking push alerts on this device (not date-format settings).
`.trim();

export const CUSTOMER_ADOPT_6_PROMPT_SCENARIOS = [
  { id: 'en-explain-notifications', prompt: 'What notifications do I get?', surface: 'customer' as const, action: 'explain_my_notifications' },
  { id: 'hy-explain-notifications', prompt: 'Ինչ հիշեցումներ եմ ստանում', surface: 'customer' as const, action: 'explain_my_notifications' },
  { id: 'ru-explain-notifications', prompt: 'Какие уведомления я получаю?', surface: 'customer' as const, action: 'explain_my_notifications' },
  { id: 'en-manage-prefs', prompt: 'Change my reminder preferences', surface: 'customer' as const, action: 'manage_notification_preferences' },
  { id: 'hy-manage-prefs', prompt: 'Փոխել հիշեցումների կարգավորումները', surface: 'customer' as const, action: 'manage_notification_preferences' },
  { id: 'ru-manage-prefs', prompt: 'Настроить напоминания', surface: 'customer' as const, action: 'manage_notification_preferences' },
  { id: 'en-refer', prompt: 'Refer a friend and get a reward', surface: 'customer' as const, action: 'refer_a_friend' },
  { id: 'hy-refer', prompt: 'Ուղղորդել ընկերոջս', surface: 'customer' as const, action: 'refer_a_friend' },
  { id: 'ru-refer', prompt: 'Пригласить друга', surface: 'customer' as const, action: 'refer_a_friend' },
  { id: 'en-rebook', prompt: 'Rebook my last appointment', surface: 'customer' as const, action: 'rebook_last_appointment' },
  { id: 'hy-rebook', prompt: 'Կրկին ամրագրել վերջին այցը', surface: 'customer' as const, action: 'rebook_last_appointment' },
  { id: 'ru-rebook', prompt: 'Записаться снова на прошлую услугу', surface: 'customer' as const, action: 'rebook_last_appointment' },
  { id: 'en-saved-salons', prompt: 'Show my saved salons', surface: 'customer' as const, action: 'find_my_saved_salons' },
  { id: 'hy-saved-salons', prompt: 'Ցույց տուր պահված սalon-ները', surface: 'customer' as const, action: 'find_my_saved_salons' },
  { id: 'ru-saved-salons', prompt: 'Мои сохранённые салоны', surface: 'customer' as const, action: 'find_my_saved_salons' },
  { id: 'en-explain-notifications-why', prompt: 'Why did I get a booking reminder?', surface: 'customer' as const, action: 'explain_my_notifications' },
  { id: 'en-explain-notifications-how', prompt: 'How do appointment alerts work?', surface: 'customer' as const, action: 'explain_my_notifications' },
  { id: 'en-manage-prefs-offers', prompt: 'Turn off marketing offers in notifications', surface: 'customer' as const, action: 'manage_notification_preferences' },
  { id: 'en-manage-prefs-settings', prompt: 'Open my notification settings', surface: 'customer' as const, action: 'manage_notification_preferences' },
  { id: 'en-refer-link', prompt: 'Share my invite link with a friend', surface: 'customer' as const, action: 'refer_a_friend' },
  { id: 'en-refer-reward', prompt: 'How do I get referral rewards?', surface: 'customer' as const, action: 'refer_a_friend' },
  { id: 'en-rebook-same', prompt: 'Book the same haircut again', surface: 'customer' as const, action: 'rebook_last_appointment' },
  { id: 'en-rebook-provider', prompt: 'Same provider as my last visit please', surface: 'customer' as const, action: 'rebook_last_appointment' },
  { id: 'en-saved-recent', prompt: 'Show recently visited salons', surface: 'customer' as const, action: 'find_my_saved_salons' },
  { id: 'en-saved-favorites', prompt: 'List my favorite salons in the app', surface: 'customer' as const, action: 'find_my_saved_salons' },
] as const;

export const PROVIDER_ADOPT_6_PROMPT_SCENARIOS = [
  { id: 'en-explain-push', prompt: 'How do push notifications work?', surface: 'provider' as const, action: 'explain_push_setup' },
  { id: 'hy-explain-push', prompt: 'Ինչպե՞ս են աշխատում push-ը', surface: 'provider' as const, action: 'explain_push_setup' },
  { id: 'ru-explain-push', prompt: 'Как настроить push-уведомления?', surface: 'provider' as const, action: 'explain_push_setup' },
  { id: 'en-enable-push', prompt: 'Enable push notifications for new bookings', surface: 'provider' as const, action: 'enable_push_notifications' },
  { id: 'hy-enable-push', prompt: 'Միացնել push-ը նոր ամրագրումների համար', surface: 'provider' as const, action: 'enable_push_notifications' },
  { id: 'ru-enable-push', prompt: 'Включить push о новых записях', surface: 'provider' as const, action: 'enable_push_notifications' },
  { id: 'en-explain-push-why-off', prompt: 'Why are my booking push alerts off?', surface: 'provider' as const, action: 'explain_push_setup' },
  { id: 'en-explain-push-setup-steps', prompt: 'Help me set up push on my phone', surface: 'provider' as const, action: 'explain_push_setup' },
  { id: 'en-enable-push-bookings', prompt: 'Turn on push alerts for new bookings', surface: 'provider' as const, action: 'enable_push_notifications' },
  { id: 'en-enable-push-device', prompt: 'Allow push notifications on this device', surface: 'provider' as const, action: 'enable_push_notifications' },
] as const;

export function isAdopt6GrowthIntent(action: string): action is (typeof ADOPT_6_GROWTH_INTENTS)[number] {
  return (ADOPT_6_GROWTH_INTENTS as readonly string[]).includes(action);
}

export function isExplainMyNotificationsPrompt(prompt: string): boolean {
  if (/\bpush notifications work\b/i.test(prompt)) return false;
  if (prompt.includes('կարգավոր') || /настро/i.test(prompt)) return false;
  if (
    /(€|₽|֏|\$|currency|euro|ruble|dram|AMD|EUR|RUB|USD|արժույթ|евро|руб)/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\bwhy\b/i.test(prompt) &&
    /\b(confirmation|amount|price|symbol|€|₽|whatsapp|email)\b/i.test(prompt)
  ) {
    return false;
  }
  if (/\b(booking push|push alerts?|provider push)\b/i.test(prompt)) {
    return false;
  }
  return (
    (/\b(explain|what|which|why|how)\b/i.test(prompt) &&
      /\b(notifications?|reminders?|messages?|alerts?)\b/i.test(prompt) &&
      !/\b(preferences?|settings?|turn off|disable|manage)\b/i.test(prompt)) ||
    prompt.includes('հիշեցում') ||
    /уведомлен/i.test(prompt)
  );
}

export function isManageNotificationPreferencesPrompt(prompt: string): boolean {
  if (isExplainPushSetupPrompt(prompt) || isEnablePushNotificationsPrompt(prompt)) {
    return false;
  }
  if (
    /\b(open|view|go\s+to|navigate)\b/i.test(prompt) &&
    /\b(booking|appointment)\b/i.test(prompt) &&
    /\bpush\b/i.test(prompt)
  ) {
    return false;
  }
  const hyRuManage =
    (prompt.includes('կարգավոր') &&
      (prompt.includes('հիշեցում') ||
        /\bpush\b/i.test(prompt) ||
        prompt.includes('թ'))) ||
    (/настро/i.test(prompt) &&
      (/уведомлен/i.test(prompt) ||
        /напоминан/i.test(prompt) ||
        /\bpush\b/i.test(prompt)));
  return (
    (/\b(manage|change|update|set|adjust|open|turn off|disable|enable)\b/i.test(
      prompt,
    ) &&
      /\b(notification|reminder|marketing|offers?|preferences?|settings?)\b/i.test(
        prompt,
      )) ||
    hyRuManage
  );
}

export function isReferAFriendPrompt(prompt: string): boolean {
  return (
    (/\b(refer|referral|invite|share|send)\b/i.test(prompt) &&
      /\b(friend|buddy|colleague|referral|invite link|reward)\b/i.test(prompt)) ||
    prompt.includes('ուղղորդ') ||
    prompt.includes('ընկեր') ||
    /приглас/i.test(prompt) ||
    prompt.includes('друг')
  );
}

export function isRebookLastAppointmentPrompt(prompt: string): boolean {
  if (
    /\b(configure|scheduling\s+mode|compatibility|combo|block)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(rebook|book again|repeat|same (?:service|provider|stylist|appointment|time|slot|\w+)|last (visit|booking|appointment))\b/i.test(
      prompt,
    ) ||
    prompt.includes('կրկին') ||
    prompt.includes('վերջին') ||
    /снова/i.test(prompt) ||
    /прошл/i.test(prompt)
  );
}

export function isFindMySavedSalonsPrompt(prompt: string): boolean {
  return (
    (/\b(saved|recent(?:ly)?|my|favorite|favourite)\b/i.test(prompt) &&
      /\b(salons?|venues?|places?|locations?)\b/i.test(prompt)) ||
    prompt.includes('պահված') ||
    /сохран/i.test(prompt)
  );
}

/** Defer to configure_provider_push_date_format (avoid import cycle with date-format util). */
function isProviderPushDateFormatConfigurePrompt(prompt: string): boolean {
  if (
    /\b(?:do|does|what|which|why|how|explain|show|describe)\b/i.test(prompt) ||
    /(ինչու|բացատրիր|ցույց\s+տուր|^\s*ինչ\b)/i.test(prompt) ||
    /(как|какой|почему|что|объясни|покажи)/i.test(prompt)
  ) {
    return false;
  }

  const mutateCue =
    /\b(?:configure|set|use|enable|switch|apply|wire|format|turn on|activate)\b/i.test(
      prompt,
    ) ||
    /(կարգավոր|սահման|օգտագործ|միացն)/i.test(prompt) ||
    /(настро|установ|использ|включ)/i.test(prompt);

  if (!mutateCue) return false;

  if (
    /\b(push|notification|fcm|firebase|alert)\b/i.test(prompt) &&
    /\b(?:time|hour|12|24|timeformat|booking\s+time|date\s+format|time\s+settings)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /(push|ծանուցում|հաղորդագր)/i.test(prompt) &&
    /(ժամ|12|24|ձևաչափ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    /(push|уведомлен|fcm)/i.test(prompt) &&
    /(времени|12|24|час|формат)/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function isExplainPushSetupPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (isProviderPushDateFormatConfigurePrompt(prompt)) return false;
  if (/\bpush\s+recipients?\b/i.test(prompt)) return false;
  if (/\blast push\b/i.test(prompt) || /\bexplain last push\b/i.test(prompt)) {
    return false;
  }
  return (
    (/\b(explain|how|why|setup|set up|configure|help)\b/i.test(prompt) &&
      /\b(push|notification|alert)\b/i.test(prompt) &&
      !/\b(enable|turn on|activate)\b/i.test(prompt)) ||
    (/push/i.test(prompt) &&
      (lower.includes('ինչպես') || lower.includes('ինչպե') || /как/i.test(prompt)))
  );
}

export function isEnablePushNotificationsPrompt(prompt: string): boolean {
  if (isProviderPushDateFormatConfigurePrompt(prompt)) return false;
  const lower = prompt.toLowerCase();
  return (
    (/\b(enable|turn on|activate|allow|subscribe)\b/i.test(prompt) &&
      /\b(push|notification|alert)\b/i.test(prompt)) ||
    (/push/i.test(prompt) && (lower.includes('միաց') || /включ/i.test(prompt)))
  );
}

export function rescueProviderAdopt6GrowthIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if ((PROVIDER_ADOPT_6_GROWTH_INTENTS as readonly string[]).includes(action)) {
    return { action, rescueReason: 'already_adopt6' };
  }
  if (isProviderPushDateFormatConfigurePrompt(prompt)) {
    return null;
  }
  if (isEnablePushNotificationsPrompt(prompt)) {
    return { action: 'enable_push_notifications', rescueReason: 'enable_push' };
  }
  if (isExplainPushSetupPrompt(prompt)) {
    return { action: 'explain_push_setup', rescueReason: 'explain_push_setup' };
  }
  return null;
}

export function rescueCustomerAdopt6GrowthIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if ((CUSTOMER_ADOPT_6_GROWTH_INTENTS as readonly string[]).includes(action)) {
    return { action, rescueReason: 'already_adopt6' };
  }
  if (isManageNotificationPreferencesPrompt(prompt)) {
    return { action: 'manage_notification_preferences', rescueReason: 'manage_notification_prefs' };
  }
  if (isExplainMyNotificationsPrompt(prompt)) {
    return { action: 'explain_my_notifications', rescueReason: 'explain_notifications' };
  }
  if (isReferAFriendPrompt(prompt)) {
    return { action: 'refer_a_friend', rescueReason: 'refer_friend' };
  }
  if (isRebookLastAppointmentPrompt(prompt)) {
    return { action: 'rebook_last_appointment', rescueReason: 'rebook_last' };
  }
  if (isFindMySavedSalonsPrompt(prompt)) {
    return { action: 'find_my_saved_salons', rescueReason: 'saved_salons' };
  }
  return null;
}

export function rescueAdopt6GrowthIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  return (
    rescueProviderAdopt6GrowthIntent(prompt, action) ??
    rescueCustomerAdopt6GrowthIntent(prompt, action)
  );
}

export {
  buildReferralShareUrl,
  deriveReferralCodeFromCustomerId,
} from '../../common/utils/referral-program.util.js';
