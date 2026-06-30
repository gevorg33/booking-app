import { CATALOG_INTENTS } from './ai-catalog.util.js';
import {
  DASHBOARD_PAYMENTS_MUTATE_INTENTS,
  DASHBOARD_PAYMENTS_READ_INTENTS,
} from './ai-payments.util.js';

function uniqueIntents<const T extends readonly string[]>(
  intents: T,
): readonly T[number][] {
  return [...new Set(intents)] as readonly T[number][];
}

export const DASHBOARD_CATALOG_DISPATCH_INTENTS = CATALOG_INTENTS;

export const DASHBOARD_PAYMENTS_DISPATCH_INTENTS = uniqueIntents([
  ...DASHBOARD_PAYMENTS_MUTATE_INTENTS,
  ...DASHBOARD_PAYMENTS_READ_INTENTS,
  'adjust_gift_card_balance',
  'extend_gift_card_expiry',
  'refund_gift_card_order',
]);

export const DASHBOARD_SETTINGS_DISPATCH_INTENTS = [
  'configure_notification_settings',
  'configure_whatsapp_integration',
  'configure_marketing_automation',
  'configure_stripe_connect',
  'configure_loyalty_settings',
  'configure_push_recipients',
  'configure_marketing_registration_email',
  'configure_online_booking',
  'configure_business_currency',
  'configure_business_tax',
  'configure_privacy_retention',
  'configure_granular_consent',
  'enable_hipaa_mode',
  'configure_hipaa_session_timeout',
  'configure_stacked_tax_rules',
  'configure_business_languages',
  'configure_business_date_format',
  'migrate_dashboard_date_display',
  'bulk_strip_disabled_locale_translations',
  'set_service_tax_rate',
] as const;

export const DASHBOARD_CORE_DISPATCH_INTENTS = uniqueIntents([
  ...DASHBOARD_CATALOG_DISPATCH_INTENTS,
  ...DASHBOARD_PAYMENTS_DISPATCH_INTENTS,
  ...DASHBOARD_SETTINGS_DISPATCH_INTENTS,
]);

export type DashboardCatalogDispatchIntent =
  (typeof DASHBOARD_CATALOG_DISPATCH_INTENTS)[number];
export type DashboardPaymentsDispatchIntent =
  (typeof DASHBOARD_PAYMENTS_DISPATCH_INTENTS)[number];
export type DashboardSettingsDispatchIntent =
  (typeof DASHBOARD_SETTINGS_DISPATCH_INTENTS)[number];
export type DashboardCoreDispatchIntent =
  (typeof DASHBOARD_CORE_DISPATCH_INTENTS)[number];

const catalogSet = new Set<string>(DASHBOARD_CATALOG_DISPATCH_INTENTS);
const paymentsSet = new Set<string>(DASHBOARD_PAYMENTS_DISPATCH_INTENTS);
const settingsSet = new Set<string>(DASHBOARD_SETTINGS_DISPATCH_INTENTS);
const coreSet = new Set<string>(DASHBOARD_CORE_DISPATCH_INTENTS);

export function isDashboardCatalogDispatchIntent(
  action: string,
): action is DashboardCatalogDispatchIntent {
  return catalogSet.has(action);
}

export function isDashboardPaymentsDispatchIntent(
  action: string,
): action is DashboardPaymentsDispatchIntent {
  return paymentsSet.has(action);
}

export function isDashboardSettingsDispatchIntent(
  action: string,
): action is DashboardSettingsDispatchIntent {
  return settingsSet.has(action);
}

export function isDashboardCoreDispatchIntent(
  action: string,
): action is DashboardCoreDispatchIntent {
  return coreSet.has(action);
}
