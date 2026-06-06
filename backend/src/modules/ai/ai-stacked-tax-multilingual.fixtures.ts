import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type StackedTaxEvalAction =
  | 'configure_stacked_tax_rules'
  | 'explain_stacked_tax';

export interface StackedTaxEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: StackedTaxEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Armenian/Russian stacked tax phrasing (ai-cmd-tax-8). */
export const STACKED_TAX_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian stacked tax (dashboard):
  - configure_stacked_tax_rules: hy «ավելացնել 5% GST և 8% PST», «կուտակել ֆեդերալ և նահանգային հարկ», «հեռացնել նահանգային հարկի կանոնը»; ru «добавить 5% GST и 8% PST», «настроить федеральный и региональный налог», «удалить правило регионального налога». Parallel business.settings.tax.rules — NOT configure_business_tax (single rate) and NOT explain_stacked_tax (read-only).
  - explain_stacked_tax: hy «ինչ է մեր համակցված GST+PST տոկոսը», «բացատրիր կուտակված հարկի կանոնները»; ru «какой комбинированный процент GST плюс PST», «объясни stacked tax правила», «покажи федеральный и провинциальный налог». READ each rule + combined rate — NOT explain_stripe_tax_charge (Stripe booking charge) and NOT explain_checkout_tax (booking page visitor).`;

export const MULTILINGUAL_STACKED_TAX_EVAL_SCENARIOS: StackedTaxEvalScenario[] =
  [
    {
      id: 'en-gst-plus-pst',
      locale: 'en',
      prompt: 'Add GST plus PST at 5% and 8%',
      expectedAction: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
      paramsPartial: { operation: 'add' },
    },
    {
      id: 'en-federal-provincial',
      locale: 'en',
      prompt: 'Stack federal and provincial tax at 2% and 5%',
      expectedAction: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
      paramsPartial: { operation: 'add' },
    },
    {
      id: 'en-combined-gst-pst-rate',
      locale: 'en',
      prompt: 'What is our combined GST plus PST rate?',
      expectedAction: 'explain_stacked_tax',
      rescueReason: 'explain_stacked_tax',
    },
    {
      id: 'en-federal-provincial-breakdown',
      locale: 'en',
      prompt: 'Explain federal and provincial tax breakdown on a sample price',
      expectedAction: 'explain_stacked_tax',
      rescueReason: 'explain_stacked_tax',
    },
    {
      id: 'hy-add-gst-pst',
      locale: 'hy',
      prompt: 'Ավելացնել 5% GST և 8% PST',
      expectedAction: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
      paramsPartial: { operation: 'add' },
      needsMultilingual: true,
    },
    {
      id: 'hy-remove-provincial-rule',
      locale: 'hy',
      prompt: 'Հեռացնել նահանգային հարկի կանոնը',
      expectedAction: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
      paramsPartial: { operation: 'remove' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-stacked',
      locale: 'hy',
      prompt: 'Բացատրիր կուտակված հարկի կանոնները',
      expectedAction: 'explain_stacked_tax',
      rescueReason: 'explain_stacked_tax',
      needsMultilingual: true,
    },
    {
      id: 'hy-combined-gst-pst',
      locale: 'hy',
      prompt: 'Ինչ է մեր համակցված GST+PST տոկոսը',
      expectedAction: 'explain_stacked_tax',
      rescueReason: 'explain_stacked_tax',
      needsMultilingual: true,
    },
    {
      id: 'ru-add-gst-pst',
      locale: 'ru',
      prompt: 'Добавить 5% GST и 8% PST',
      expectedAction: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
      paramsPartial: { operation: 'add' },
      needsMultilingual: true,
    },
    {
      id: 'ru-federal-regional',
      locale: 'ru',
      prompt: 'Настроить федеральный и региональный налог 2% и 5%',
      expectedAction: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
      paramsPartial: { operation: 'add' },
      needsMultilingual: true,
    },
    {
      id: 'ru-remove-regional-rule',
      locale: 'ru',
      prompt: 'Удалить правило регионального налога',
      expectedAction: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
      paramsPartial: { operation: 'remove' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-gst-plus-pst',
      locale: 'ru',
      prompt: 'Какой комбинированный процент GST плюс PST',
      expectedAction: 'explain_stacked_tax',
      rescueReason: 'explain_stacked_tax',
      needsMultilingual: true,
    },
    {
      id: 'ru-federal-provincial-breakdown',
      locale: 'ru',
      prompt: 'Покажи федеральный и провинциальный налог на примере',
      expectedAction: 'explain_stacked_tax',
      rescueReason: 'explain_stacked_tax',
      needsMultilingual: true,
    },
  ];
