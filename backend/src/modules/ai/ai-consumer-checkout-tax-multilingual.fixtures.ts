import { EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS } from './ai-consumer-checkout-tax.fixtures.js';
import type { ConsumerCheckoutTaxAspect } from './ai-consumer-checkout-tax.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ConsumerCheckoutTaxMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: AiEvalLocale;
  prompt: string;
  aspect: ConsumerCheckoutTaxAspect;
  rescueReason: 'explain_consumer_checkout_tax';
};

export const CONSUMER_CHECKOUT_TAX_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian consumer checkout tax (logged-in app):
  - explain_consumer_checkout_tax: hy «ինչու tax line checkout-ում consumer app-ում»; ru «почему на checkout есть строка налога в consumer app». NOT explain_checkout_tax (public web).`;

const TAX_I18N: Record<string, { hy: string; ru: string }> = {
  'tax-line-consumer-checkout': {
    hy: 'Ինչու tax line կա checkout-ում consumer app-ում',
    ru: 'Почему на checkout в consumer app есть строка налога',
  },
  'incl-vat-salon-app-services': {
    hy: 'Ինչ է նշանակում incl. VAT-ը services-ում salon app-ում',
    ru: 'Что означает incl. VAT у услуг в salon app',
  },
  'confirmation-tax-breakdown-app': {
    hy: 'Բացատրել tax breakdown-ը booking confirmation screen-ում app-ում',
    ru: 'Объясни разбивку налога на экране подтверждения записи в app',
  },
  'payment-summary-gst-app': {
    hy: 'Ինչու payment summary-ն ցույց է տալիս GST consumer app-ում',
    ru: 'Почему в payment summary показывается GST в consumer app',
  },
  'incl-badge-service-list': {
    hy: 'Ինչ է incl. badge-ը service list-ում consumer app-ում',
    ru: 'Что такое incl. badge в service list в consumer app',
  },
  'stacked-tax-lines-checkout-app': {
    hy: 'Ինչու GST և PST tax lines եմ տեսնում salon app-ում',
    ru: 'Почему я вижу строки GST и PST при оплате в salon app',
  },
};

function buildConsumerCheckoutTaxMultilingualScenarios(): ConsumerCheckoutTaxMultilingualScenario[] {
  const rows: ConsumerCheckoutTaxMultilingualScenario[] = [];
  for (const entry of EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS) {
    const i18n = TAX_I18N[entry.id];
    if (!i18n) {
      throw new Error(`Missing HY/RU prompts for ${entry.id}`);
    }
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${entry.id}-${locale}`,
        enScenarioId: entry.id,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        aspect: entry.aspect,
        rescueReason: 'explain_consumer_checkout_tax',
      });
    }
  }
  return rows;
}

export const CONSUMER_CHECKOUT_TAX_MULTILINGUAL_SCENARIOS: ConsumerCheckoutTaxMultilingualScenario[] =
  buildConsumerCheckoutTaxMultilingualScenarios();

export const CONSUMER_CHECKOUT_TAX_EN_SCENARIO_IDS: string[] =
  EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS.map((row) => row.id);
