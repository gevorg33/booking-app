import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainDepositForfeitureMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_deposit_forfeiture';
  rescueReason: 'deposit_forfeiture';
};

export const EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian deposit forfeiture (customer + public booking):
  - explain_deposit_forfeiture: hy «կորցնո՞ւմ եմ անկախավճարը», «50%-ը վերադարձվո՞ւմ է»; ru «потеряю ли депозит», «вернут ли депозит». READ deposit/prepayment forfeiture — NOT explain_cancel_policy (general policy), NOT cancel_my_booking.`;

export const EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_SCENARIOS: readonly ExplainDepositForfeitureMultilingualScenario[] =
  [
    {
      id: 'cancel-free-hy-customer',
      locale: 'hy',
      prompt: 'Կարո՞ղ եմ անվճար չեղարկել',
      surface: 'customer',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'cancel-free-hy-public',
      locale: 'hy',
      prompt: 'Կարո՞ղ եմ անվճար չեղարկել',
      surface: 'public',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'cancel-free-ru-customer',
      locale: 'ru',
      prompt: 'Можно ли отменить бесплатно?',
      surface: 'customer',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'cancel-free-ru-public',
      locale: 'ru',
      prompt: 'Можно ли отменить бесплатно?',
      surface: 'public',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'lose-deposit-hy-customer',
      locale: 'hy',
      prompt: 'Կորցնո՞ւմ եմ անկախավճարը եթե չեղարկեմ',
      surface: 'customer',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'lose-deposit-hy-public',
      locale: 'hy',
      prompt: 'Կորցնո՞ւմ եմ անկախավճարը եթե չեղարկեմ',
      surface: 'public',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'lose-deposit-ru-customer',
      locale: 'ru',
      prompt: 'Потеряю ли я депозит если отменю?',
      surface: 'customer',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'lose-deposit-ru-public',
      locale: 'ru',
      prompt: 'Потеряю ли я депозит если отменю?',
      surface: 'public',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'refund-deposit-hy-customer',
      locale: 'hy',
      prompt: '50%-ը վերադարձվո՞ւմ է չեղարկելիս',
      surface: 'customer',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'refund-deposit-hy-public',
      locale: 'hy',
      prompt: '50%-ը վերադարձվո՞ւմ է չեղարկելիս',
      surface: 'public',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'refund-deposit-ru-customer',
      locale: 'ru',
      prompt: 'Вернут ли депозит если отменю запись?',
      surface: 'customer',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
    {
      id: 'refund-deposit-ru-public',
      locale: 'ru',
      prompt: 'Вернут ли депозит если отменю запись?',
      surface: 'public',
      expectedAction: 'explain_deposit_forfeiture',
      rescueReason: 'deposit_forfeiture',
    },
  ];
