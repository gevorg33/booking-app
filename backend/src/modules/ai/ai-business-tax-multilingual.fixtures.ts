import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type BusinessTaxEvalAction =
  | 'configure_business_tax'
  | 'set_service_tax_rate'
  | 'explain_business_tax';

export interface BusinessTaxEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: BusinessTaxEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Armenian/Russian dashboard tax configuration phrasing (ai-cmd-tax-4). */
export const BUSINESS_TAX_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian business tax (dashboard):
  - configure_business_tax: hy «միացնել 20% VAT», «փոխել հարկով ներառված գնագործակերպ», «սահմանել GST տոկոսը 5%», «անջատել VAT-ը»; ru «включить 20% НДС», «переключить на цены с налогом», «установить GST 5%», «отключить НДС». Salon-wide business.settings.tax — NOT set_service_tax_rate (per-service) and NOT explain_business_tax (read-only).
  - set_service_tax_rate: hy «դարձնել մասաժ ծառայությունները հարկից ազատ», «կիրառել 10% հարկ միայն բժշկական խորհրդատվության համար»; ru «сделать массажные услуги без налога», «применить 10% налог только к медицинским консультациям». Per-service metadata.taxRatePercent override — confirm before mutate.
  - explain_business_tax: hy «որն է մեր ընթացիկ VAT տոկոսը», «բացատրիր սալոնի հարկի կարգավորումները»; ru «какой у нас текущий процент НДС», «объясни налоговые настройки салона». READ current tax name/rate/model — NOT explain_checkout_tax (booking page visitor).`;

export const MULTILINGUAL_BUSINESS_TAX_EVAL_SCENARIOS: BusinessTaxEvalScenario[] =
  [
    {
      id: 'hy-enable-20-vat',
      locale: 'hy',
      prompt: 'Միացնել 20% VAT',
      expectedAction: 'configure_business_tax',
      rescueReason: 'configure_business_tax',
      paramsPartial: { enabled: true, rate: 20, name: 'VAT' },
      needsMultilingual: true,
    },
    {
      id: 'hy-switch-tax-inclusive',
      locale: 'hy',
      prompt: 'Փոխել հարկով ներառված գնագործակերպ',
      expectedAction: 'configure_business_tax',
      rescueReason: 'configure_business_tax',
      paramsPartial: { model: 'inclusive' },
      needsMultilingual: true,
    },
    {
      id: 'hy-set-gst-5',
      locale: 'hy',
      prompt: 'Սահմանել GST տոկոսը 5%',
      expectedAction: 'configure_business_tax',
      rescueReason: 'configure_business_tax',
      paramsPartial: { enabled: true, rate: 5, name: 'GST' },
      needsMultilingual: true,
    },
    {
      id: 'ru-enable-20-vat',
      locale: 'ru',
      prompt: 'Включить 20% НДС',
      expectedAction: 'configure_business_tax',
      rescueReason: 'configure_business_tax',
      paramsPartial: { enabled: true, rate: 20, name: 'VAT' },
      needsMultilingual: true,
    },
    {
      id: 'ru-switch-tax-inclusive',
      locale: 'ru',
      prompt: 'Переключить на цены с налогом',
      expectedAction: 'configure_business_tax',
      rescueReason: 'configure_business_tax',
      paramsPartial: { model: 'inclusive' },
      needsMultilingual: true,
    },
    {
      id: 'ru-set-gst-5',
      locale: 'ru',
      prompt: 'Установить GST 5%',
      expectedAction: 'configure_business_tax',
      rescueReason: 'configure_business_tax',
      paramsPartial: { enabled: true, rate: 5, name: 'GST' },
      needsMultilingual: true,
    },
    {
      id: 'hy-massage-tax-exempt',
      locale: 'hy',
      prompt: 'Դարձնել մասաժ ծառայությունները հարկից ազատ',
      expectedAction: 'set_service_tax_rate',
      rescueReason: 'set_service_tax_rate',
      paramsPartial: { serviceQuery: 'մասաժ', taxRatePercent: 0 },
      needsMultilingual: true,
    },
    {
      id: 'hy-medical-10-only',
      locale: 'hy',
      prompt: 'Կիրառել 10% հարկ միայն բժշկական խորհրդատվության համար',
      expectedAction: 'set_service_tax_rate',
      rescueReason: 'set_service_tax_rate',
      paramsPartial: {
        serviceQuery: 'բժշկական խորհրդատվության',
        taxRatePercent: 10,
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-massage-tax-exempt',
      locale: 'ru',
      prompt: 'Сделать массажные услуги без налога',
      expectedAction: 'set_service_tax_rate',
      rescueReason: 'set_service_tax_rate',
      paramsPartial: { serviceQuery: 'массажные', taxRatePercent: 0 },
      needsMultilingual: true,
    },
    {
      id: 'ru-medical-10-only',
      locale: 'ru',
      prompt: 'Применить 10% налог только к медицинским консультациям',
      expectedAction: 'set_service_tax_rate',
      rescueReason: 'set_service_tax_rate',
      paramsPartial: {
        serviceQuery: 'медицинским консультациям',
        taxRatePercent: 10,
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-vat-rate',
      locale: 'hy',
      prompt: 'Որն է մեր ընթացիկ VAT տոկոսը',
      expectedAction: 'explain_business_tax',
      rescueReason: 'explain_business_tax',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-salon-tax',
      locale: 'hy',
      prompt: 'Բացատրիր սալոնի հարկի կարգավորումները',
      expectedAction: 'explain_business_tax',
      rescueReason: 'explain_business_tax',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-vat-rate',
      locale: 'ru',
      prompt: 'Какой у нас текущий процент НДС',
      expectedAction: 'explain_business_tax',
      rescueReason: 'explain_business_tax',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-salon-tax',
      locale: 'ru',
      prompt: 'Объясни налоговые настройки салона',
      expectedAction: 'explain_business_tax',
      rescueReason: 'explain_business_tax',
      needsMultilingual: true,
    },
  ];
