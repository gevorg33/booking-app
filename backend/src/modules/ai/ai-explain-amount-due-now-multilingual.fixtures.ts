import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainAmountDueNowMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_amount_due_now';
  rescueReason: 'amount_due_now';
};

export const EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian amount-due-now checkout math (customer + public booking):
  - explain_amount_due_now: hy «Որքա՞ն եմ վճարում այսօր», «50%-անկախավճարը $40 է՞»; ru «Сколько я плачу сегодня», «Депозит 50% — это $40?». prepaymentDue — NOT list_services maxPrice.`;

export const EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_SCENARIOS: ExplainAmountDueNowMultilingualScenario[] =
  [
    {
      id: 'how-much-pay-today-hy-customer',
      locale: 'hy',
      prompt: 'Որքան եմ վճարում այսօր',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'is-deposit-forty-hy-customer',
      locale: 'hy',
      prompt: '50%-անկախավճարը $40 է՞',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'how-much-pay-today-ru-customer',
      locale: 'ru',
      prompt: 'Сколько я плачу сегодня?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'is-deposit-forty-ru-customer',
      locale: 'ru',
      prompt: 'Депозит 50% — это $40?',
      surface: 'customer',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'how-much-pay-today-hy-public',
      locale: 'hy',
      prompt: 'Որքան եմ վճարում այսօր',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'is-deposit-forty-hy-public',
      locale: 'hy',
      prompt: '50%-անկախավճարը $40 է՞',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'how-much-pay-today-ru-public',
      locale: 'ru',
      prompt: 'Сколько я плачу сегодня?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
    {
      id: 'is-deposit-forty-ru-public',
      locale: 'ru',
      prompt: 'Депозит 50% — это $40?',
      surface: 'public',
      expectedAction: 'explain_amount_due_now',
      rescueReason: 'amount_due_now',
    },
  ];
