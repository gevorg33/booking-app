import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

/** parity-2.4 — intent + surface + tier keys that must have EN/HY/RU eval coverage. */
export interface Parity24IntentSpec {
  intent: string;
  surface: CommandSurface;
  accessTier: AccessTier;
}

export interface Parity24EvalScenario {
  id: string;
  intent: string;
  surface: CommandSurface;
  accessTier: AccessTier;
  locale: AiEvalLocale;
  prompt: string;
  expectedAction: string;
  rescueReason?: string;
  domain?: string;
}

export const PARITY_24_INTENT_SPECS: readonly Parity24IntentSpec[] = [
  { intent: 'list_reviews', surface: 'dashboard', accessTier: 'manager' },
  { intent: 'update_team_member_role', surface: 'dashboard', accessTier: 'owner' },
  { intent: 'update_bookings', surface: 'provider', accessTier: 'staff' },
  { intent: 'show_appointments', surface: 'provider', accessTier: 'staff' },
  { intent: 'list_bookings', surface: 'provider', accessTier: 'staff' },
  { intent: 'block_schedule', surface: 'provider', accessTier: 'staff' },
  { intent: 'check_availability', surface: 'provider', accessTier: 'staff' },
  { intent: 'update_bookings', surface: 'dashboard', accessTier: 'staff' },
  { intent: 'show_appointments', surface: 'dashboard', accessTier: 'staff' },
  { intent: 'list_bookings', surface: 'dashboard', accessTier: 'staff' },
  { intent: 'block_schedule', surface: 'dashboard', accessTier: 'staff' },
  { intent: 'check_availability', surface: 'dashboard', accessTier: 'staff' },
  { intent: 'cancel_my_booking', surface: 'customer', accessTier: 'client' },
  { intent: 'reschedule_my_booking', surface: 'customer', accessTier: 'client' },
  { intent: 'list_my_appointments', surface: 'customer', accessTier: 'client' },
  { intent: 'get_manage_link', surface: 'customer', accessTier: 'client' },
  { intent: 'my_profile', surface: 'customer', accessTier: 'client' },
  { intent: 'my_subscriptions', surface: 'customer', accessTier: 'client' },
  { intent: 'my_gift_cards', surface: 'customer', accessTier: 'client' },
  { intent: 'choose_payment_method', surface: 'customer', accessTier: 'client' },
  {
    intent: 'manage_notification_preferences',
    surface: 'customer',
    accessTier: 'client',
  },
  { intent: 'loyalty_points_balance', surface: 'customer', accessTier: 'client' },
  { intent: 'discover_packages', surface: 'customer', accessTier: 'client' },
  { intent: 'buy_gift_card', surface: 'customer', accessTier: 'client' },
  { intent: 'booking_help', surface: 'public', accessTier: 'client' },
  { intent: 'my_profile', surface: 'public', accessTier: 'client' },
  { intent: 'my_subscriptions', surface: 'public', accessTier: 'client' },
  { intent: 'my_gift_cards', surface: 'public', accessTier: 'client' },
  { intent: 'loyalty_points_balance', surface: 'public', accessTier: 'client' },
  { intent: 'discover_packages', surface: 'public', accessTier: 'client' },
  { intent: 'buy_gift_card', surface: 'public', accessTier: 'client' },
  { intent: 'submit_review', surface: 'public', accessTier: 'client' },
  { intent: 'my_appointments', surface: 'public', accessTier: 'client' },
] as const;

type TriLocalePrompts = { en: string; hy: string; ru: string };

/** Prefix HY/RU script when prompts reuse English rescue keywords (parity-2.4 eval). */
function parity24LocalePrompt(locale: AiEvalLocale, prompt: string): string {
  if (locale === 'en') return prompt;
  if (/[\u0530-\u058F\u0400-\u04FF]/.test(prompt)) return prompt;
  if (locale === 'hy') return `Հարցում՝ ${prompt}`;
  return `Запрос: ${prompt}`;
}

const PARITY_24_PROMPTS: Record<
  string,
  TriLocalePrompts & { rescueReason?: string; domain?: string }
> = {
  'list_reviews:dashboard': {
    en: 'Show recent reviews in the inbox',
    hy: 'Show recent reviews inbox-ում',
    ru: 'Покажи recent reviews inbox',
    rescueReason: 'list_reviews',
    domain: 'crm',
  },
  'update_team_member_role:dashboard': {
    en: 'Make Anna a manager on the team',
    hy: 'Make Anna a manager on the team — թիմ',
    ru: 'Make Anna a manager on the team — команда',
    rescueReason: 'update_team_member_role',
    domain: 'schedule',
  },
  'update_bookings:provider': {
    en: 'Check in my 2pm appointment',
    hy: 'Check in իմ 2pm appointment',
    ru: 'Check in моей записи на 14:00',
    rescueReason: 'staff_scope_check_in',
    domain: 'booking',
  },
  'show_appointments:provider': {
    en: "Who's next on my schedule?",
    hy: "Who's next on my schedule?",
    ru: "Who's next on my schedule?",
    rescueReason: 'staff_scope_whos_next',
    domain: 'booking',
  },
  'list_bookings:provider': {
    en: 'List my assigned bookings today',
    hy: 'List my assigned bookings today',
    ru: 'List my assigned bookings today',
    rescueReason: 'staff_scope_assigned_bookings',
    domain: 'booking',
  },
  'block_schedule:provider': {
    en: 'Block lunch break 12:00 to 13:00 today',
    hy: 'Block lunch break 12:00 to 13:00 today',
    ru: 'Block lunch break 12:00 to 13:00 today',
    rescueReason: 'staff_scope_break',
    domain: 'schedule',
  },
  'check_availability:provider': {
    en: 'Am I free at 4pm tomorrow?',
    hy: 'Am I free at 4pm tomorrow?',
    ru: 'Am I free at 4pm tomorrow?',
    rescueReason: 'staff_scope_availability',
    domain: 'schedule',
  },
  'update_bookings:dashboard': {
    en: 'Mark my next appointment as in progress',
    hy: 'Mark my next appointment as in progress',
    ru: 'Mark my next appointment as in progress',
    rescueReason: 'staff_scope_check_in',
    domain: 'booking',
  },
  'show_appointments:dashboard': {
    en: 'Show my schedule for today',
    hy: 'Show my schedule for today',
    ru: 'Show my schedule for today',
    rescueReason: 'staff_scope_own_schedule',
    domain: 'booking',
  },
  'list_bookings:dashboard': {
    en: 'List my assigned bookings today',
    hy: 'List my assigned bookings today',
    ru: 'List my assigned bookings today',
    rescueReason: 'staff_scope_assigned_bookings',
    domain: 'booking',
  },
  'block_schedule:dashboard': {
    en: 'Block lunch on my schedule today',
    hy: 'Block lunch on my schedule today',
    ru: 'Block lunch on my schedule today',
    rescueReason: 'staff_scope_break',
    domain: 'schedule',
  },
  'check_availability:dashboard': {
    en: 'Do I have open slots this afternoon?',
    hy: 'Do I have open slots this afternoon?',
    ru: 'Do I have open slots this afternoon?',
    rescueReason: 'staff_scope_availability',
    domain: 'schedule',
  },
  'cancel_my_booking:customer': {
    en: 'Cancel my booking tomorrow',
    hy: 'Cancel my booking tomorrow',
    ru: 'Cancel my booking tomorrow',
    rescueReason: 'cancel_my',
    domain: 'booking',
  },
  'reschedule_my_booking:customer': {
    en: 'Reschedule my appointment to Friday',
    hy: 'Reschedule my appointment to Friday',
    ru: 'Reschedule my appointment to Friday',
    rescueReason: 'reschedule_my',
    domain: 'booking',
  },
  'list_my_appointments:customer': {
    en: 'List my upcoming appointments',
    hy: 'List my upcoming appointments',
    ru: 'List my upcoming appointments',
    rescueReason: 'list_appointments',
    domain: 'booking',
  },
  'get_manage_link:customer': {
    en: 'Send me the manage link for my booking',
    hy: 'Send me the manage link for my booking',
    ru: 'Send me the manage link for my booking',
    rescueReason: 'manage_link',
    domain: 'booking',
  },
  'my_profile:customer': {
    en: 'Show my profile',
    hy: 'Show my profile',
    ru: 'Show my profile',
    rescueReason: 'my_profile',
    domain: 'crm',
  },
  'my_subscriptions:customer': {
    en: 'Show my subscriptions',
    hy: 'Show my subscriptions',
    ru: 'Show my subscriptions',
    rescueReason: 'my_subscriptions',
    domain: 'crm',
  },
  'my_gift_cards:customer': {
    en: 'Show my gift cards',
    hy: 'Show my gift cards',
    ru: 'Show my gift cards',
    rescueReason: 'my_gift_cards',
    domain: 'gift',
  },
  'choose_payment_method:customer': {
    en: 'Choose payment method cash or card',
    hy: 'Choose payment method cash or card',
    ru: 'Choose payment method cash or card',
    rescueReason: 'payment_method',
    domain: 'payments',
  },
  'manage_notification_preferences:customer': {
    en: 'Turn off marketing offers in notifications',
    hy: 'Turn off marketing offers in notifications',
    ru: 'Turn off marketing offers in notifications',
    rescueReason: 'manage_notification_prefs',
    domain: 'integrations',
  },
  'loyalty_points_balance:customer': {
    en: 'Show my reward points balance',
    hy: 'Show my reward points balance',
    ru: 'Show my reward points balance',
    rescueReason: 'loyalty_balance',
    domain: 'crm',
  },
  'discover_packages:customer': {
    en: 'What packages are available?',
    hy: 'What packages are available?',
    ru: 'What packages are available?',
    rescueReason: 'discover_packages',
    domain: 'catalog',
  },
  'buy_gift_card:customer': {
    en: 'Buy a fifty dollar gift card',
    hy: 'Buy a fifty dollar gift card',
    ru: 'Buy a fifty dollar gift card',
    rescueReason: 'buy_gift_card',
    domain: 'gift',
  },
  'booking_help:public': {
    en: 'Help me manage and cancel my visit',
    hy: 'Help me manage and cancel my visit',
    ru: 'Help me manage and cancel my visit',
    rescueReason: 'public_manage_booking',
    domain: 'booking',
  },
  'my_profile:public': {
    en: 'Show my account profile',
    hy: 'Show my account profile',
    ru: 'Show my account profile',
    rescueReason: 'my_profile',
    domain: 'crm',
  },
  'my_subscriptions:public': {
    en: 'List my subscriptions on my account',
    hy: 'List my subscriptions on my account',
    ru: 'List my subscriptions on my account',
    rescueReason: 'my_subscriptions',
    domain: 'crm',
  },
  'my_gift_cards:public': {
    en: 'My ordered gift cards',
    hy: 'My ordered gift cards',
    ru: 'My ordered gift cards',
    rescueReason: 'my_gift_cards',
    domain: 'gift',
  },
  'loyalty_points_balance:public': {
    en: 'Show my reward points balance',
    hy: 'Show my reward points balance',
    ru: 'Show my reward points balance',
    rescueReason: 'loyalty_balance',
    domain: 'crm',
  },
  'discover_packages:public': {
    en: 'Browse available packages',
    hy: 'Browse available packages',
    ru: 'Browse available packages',
    rescueReason: 'discover_packages',
    domain: 'catalog',
  },
  'buy_gift_card:public': {
    en: 'Buy a fifty dollar gift card',
    hy: 'Buy a fifty dollar gift card',
    ru: 'Buy a fifty dollar gift card',
    rescueReason: 'buy_gift_card',
    domain: 'gift',
  },
  'submit_review:public': {
    en: 'Leave a review for my visit',
    hy: 'Leave a review for my visit',
    ru: 'Leave a review for my visit',
    rescueReason: 'submit_review',
    domain: 'crm',
  },
  'my_appointments:public': {
    en: 'Show my appointments on my account',
    hy: 'Show my appointments on my account',
    ru: 'Show my appointments on my account',
    rescueReason: 'my_appointments',
    domain: 'booking',
  },
};

export function parity24SpecKey(spec: Parity24IntentSpec): string {
  return `${spec.intent}:${spec.surface}`;
}

export function buildParity24EvalScenarios(): Parity24EvalScenario[] {
  const locales: AiEvalLocale[] = ['en', 'hy', 'ru'];
  const scenarios: Parity24EvalScenario[] = [];

  for (const spec of PARITY_24_INTENT_SPECS) {
    const prompts = PARITY_24_PROMPTS[parity24SpecKey(spec)];
    if (!prompts) {
      throw new Error(`parity-2.4 missing prompts for ${parity24SpecKey(spec)}`);
    }
    for (const locale of locales) {
      scenarios.push({
        id: `parity24-${spec.intent}-${spec.surface}-${locale}`,
        intent: spec.intent,
        surface: spec.surface,
        accessTier: spec.accessTier,
        locale,
        prompt: parity24LocalePrompt(locale, prompts[locale]),
        expectedAction: spec.intent,
        rescueReason: prompts.rescueReason,
        domain: prompts.domain,
      });
    }
  }

  return scenarios;
}

export const PARITY_24_EVAL_SCENARIOS = buildParity24EvalScenarios();
