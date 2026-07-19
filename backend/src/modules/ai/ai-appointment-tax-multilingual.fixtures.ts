/** ai-cmd-provider-5.17.1 — HY/RU coverage for explain_appointment_tax. */

export const EXPLAIN_APPOINTMENT_TAX_MULTILINGUAL_PROMPTS = [
  {
    id: 'explain-tax-hy',
    locale: 'hy' as const,
    prompt: 'Ինչու՞ է ԱԱՀ-ն այս վճարման մեջ',
  },
  {
    id: 'explain-tax-inclusive-hy',
    locale: 'hy' as const,
    prompt: 'ԱԱՀ-ն ներառյալ է, թե՞ առանց',
  },
  {
    id: 'explain-tax-ru',
    locale: 'ru' as const,
    prompt: 'Почему в стоимости визита есть НДС?',
  },
  {
    id: 'explain-tax-inclusive-ru',
    locale: 'ru' as const,
    prompt: 'Налог включён или без налога?',
  },
] as const;
