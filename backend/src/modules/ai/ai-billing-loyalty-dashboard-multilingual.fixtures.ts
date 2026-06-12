import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { BillingLoyaltyDashboardIntent } from './ai-billing-loyalty-dashboard.util.js';
import {
  BILLING_LOYALTY_EN_SCENARIO_IDS,
  OPEN_BILLING_SETTINGS_PROMPTS,
  SUMMARIZE_LOYALTY_PROGRAM_PROMPTS,
} from './ai-billing-loyalty-dashboard.fixtures.js';

export type BillingLoyaltyMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: BillingLoyaltyDashboardIntent;
  rescueReason: BillingLoyaltyDashboardIntent;
};

const OPEN_BILLING_I18N: Record<string, { hy: string; ru: string }> = {
  'billing-open-settings-en': {
    hy: 'Բացիր billing settings',
    ru: 'Открой billing settings',
  },
  'billing-manage-subscription-en': {
    hy: 'Կառավարիր subscription և billing portal',
    ru: 'Управляй subscription и billing portal',
  },
  'billing-what-plan-en': {
    hy: 'Ինչ plan ենք',
    ru: 'Какой plan у нас',
  },
  'billing-upgrade-plan-en': {
    hy: 'Upgrade արա subscription plan-ը',
    ru: 'Апгрейдни subscription plan',
  },
  'billing-payment-method-en': {
    hy: 'Բացիր invoice և payment method settings',
    ru: 'Открой invoice и payment method settings',
  },
  'billing-portal-link-en': {
    hy: 'Ցույց տուր billing portal link',
    ru: 'Покажи billing portal link',
  },
  'billing-downgrade-en': {
    hy: 'Downgrade արա subscription plan billing-ում',
    ru: 'Даунгрейдни subscription plan в billing',
  },
  'billing-manage-seats-en': {
    hy: 'Կառավարիր billing և seat limits',
    ru: 'Управляй billing и seat limits',
  },
  'billing-subscription-settings-en': {
    hy: 'Բացիր subscription settings',
    ru: 'Открой subscription settings',
  },
  'billing-view-payment-en': {
    hy: 'Դիտիր payment method settings',
    ru: 'Посмотри payment method settings',
  },
  'billing-access-portal-en': {
    hy: 'Մուտք billing portal մեր account-ի համար',
    ru: 'Зайди в billing portal нашего account',
  },
};

const LOYALTY_I18N: Record<string, { hy: string; ru: string }> = {
  'loyalty-summarize-en': {
    hy: 'Ամփոփիր loyalty program-ը',
    ru: 'Суммируй loyalty program',
  },
  'loyalty-how-works-en': {
    hy: 'Ինչպես է աշխատում loyalty-ն',
    ru: 'Как работает loyalty',
  },
  'loyalty-explain-settings-en': {
    hy: 'Բացատրիր loyalty program settings-ը',
    ru: 'Объясни loyalty program settings',
  },
  'loyalty-overview-en': {
    hy: 'Loyalty points overview business-ի համար',
    ru: 'Loyalty points overview для business',
  },
  'loyalty-summary-en': {
    hy: 'Տուր loyalty program summary',
    ru: 'Дай loyalty program summary',
  },
  'loyalty-earn-points-en': {
    hy: 'Ինչպես են customers-ը loyalty points վաստակում',
    ru: 'Как customers зарабатывают loyalty points',
  },
  'loyalty-rewards-setup-en': {
    hy: 'Ամփոփիր մեր loyalty rewards setup-ը',
    ru: 'Суммируй наш loyalty rewards setup',
  },
  'loyalty-explain-points-en': {
    hy: 'Բացատրիր loyalty points-ը այստեղ',
    ru: 'Объясни loyalty points здесь',
  },
  'loyalty-program-overview-en': {
    hy: 'Լոյալթի ծրագրի ամփոփում',
    ru: 'Обзор программы лояльности',
  },
  'loyalty-rules-en': {
    hy: 'Որոնք են loyalty program rules-ը',
    ru: 'Какие loyalty program rules',
  },
  'loyalty-manager-summary-en': {
    hy: 'Ամփոփիր loyalty settings managers-ի համար',
    ru: 'Суммируй loyalty settings для managers',
  },
};

const ALL_I18N: Record<string, { hy: string; ru: string }> = {
  ...OPEN_BILLING_I18N,
  ...LOYALTY_I18N,
};

const EN_BY_ID = new Map(
  [...OPEN_BILLING_SETTINGS_PROMPTS, ...SUMMARIZE_LOYALTY_PROGRAM_PROMPTS].map(
    (row) => [row.id, row],
  ),
);

function buildBillingLoyaltyMultilingualScenarios(): BillingLoyaltyMultilingualScenario[] {
  const rows: BillingLoyaltyMultilingualScenario[] = [];
  for (const enScenarioId of BILLING_LOYALTY_EN_SCENARIO_IDS) {
    const i18n = ALL_I18N[enScenarioId];
    const enRow = EN_BY_ID.get(enScenarioId);
    if (!i18n || !enRow) continue;
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: enRow.expectedAction,
        rescueReason: enRow.expectedAction,
      });
    }
  }
  return rows;
}

export const BILLING_LOYALTY_MULTILINGUAL_SCENARIOS =
  buildBillingLoyaltyMultilingualScenarios();
