import { EXPLAIN_CHECKOUT_TAX_PROMPTS } from './ai-checkout-tax.fixtures.js';
import type { CheckoutTaxAspect } from './ai-checkout-tax.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type CheckoutTaxMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: AiEvalLocale;
  prompt: string;
  aspect: CheckoutTaxAspect;
  rescueReason: 'explain_checkout_tax';
};

export const CHECKOUT_TAX_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian public booking page checkout tax:
  - explain_checkout_tax: hy «ինչու tax line checkout-ում booking page-ում»; ru «почему на checkout есть строка налога на странице записи». NOT explain_consumer_checkout_tax (logged-in app).`;

const TAX_I18N: Record<string, { hy: string; ru: string }> = {
  'payment-summary-gst-booking-page': {
    hy: 'Ինչու payment summary-ն ցույց է տալիս GST booking page-ում',
    ru: 'Почему в payment summary показывается GST на странице записи',
  },
  'confirmation-tax-breakdown-booking': {
    hy: 'Բացատրել tax breakdown-ը booking confirmation step-ում նախքան վճարելը',
    ru: 'Объясни разбивку налога на шаге подтверждения записи перед оплатой',
  },
  'stacked-tax-lines-checkout-page': {
    hy: 'Ինչու GST և PST tax lines եմ տեսնում booking page-ում',
    ru: 'Почему я вижу строки GST и PST при оплате на странице записи',
  },
  'incl-badge-service-cards-page': {
    hy: 'Ինչ է incl. badge-ը service cards-ում այս էջում',
    ru: 'Что такое incl. badge на карточках услуг на этой странице',
  },
};

function buildCheckoutTaxMultilingualScenarios(): CheckoutTaxMultilingualScenario[] {
  const rows: CheckoutTaxMultilingualScenario[] = [];
  for (const entry of EXPLAIN_CHECKOUT_TAX_PROMPTS) {
    const i18n = TAX_I18N[entry.id];
    if (!i18n) continue;
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${entry.id}-${locale}`,
        enScenarioId: entry.id,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        aspect: entry.aspect,
        rescueReason: 'explain_checkout_tax',
      });
    }
  }
  return rows;
}

export const CHECKOUT_TAX_MULTILINGUAL_SCENARIOS: CheckoutTaxMultilingualScenario[] =
  buildCheckoutTaxMultilingualScenarios();

export const CHECKOUT_TAX_EN_SCENARIO_IDS: string[] =
  EXPLAIN_CHECKOUT_TAX_PROMPTS.map((row) => row.id);
