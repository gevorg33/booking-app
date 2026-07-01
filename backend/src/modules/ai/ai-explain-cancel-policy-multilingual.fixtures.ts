import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainCancelPolicyMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_cancel_policy';
  rescueReason: 'cancel_policy';
};

export const EXPLAIN_CANCEL_POLICY_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian cancel policy (customer mobile):
  - explain_cancel_policy: hy «բացատրել չեղարկման կանոնները»; ru «объясни политику отмены», «правила переноса записи». READ notice/reschedule rules — NOT explain_deposit_forfeiture (deposit refund/forfeit), NOT cancel_my_booking.`;

export const EXPLAIN_CANCEL_POLICY_MULTILINGUAL_SCENARIOS: readonly ExplainCancelPolicyMultilingualScenario[] =
  [
    {
      id: 'explain-policy-hy-customer',
      locale: 'hy',
      prompt: 'Բացատրել չեղարկման կանոնները',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'explain-policy-ru-customer',
      locale: 'ru',
      prompt: 'Объясни политику отмены',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'notice-window-hy-customer',
      locale: 'hy',
      prompt: 'Քանի ժամ նախապես պետք է չեղարկեմ',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
    {
      id: 'notice-window-ru-customer',
      locale: 'ru',
      prompt: 'За сколько часов нужно отменить запись?',
      surface: 'customer',
      expectedAction: 'explain_cancel_policy',
      rescueReason: 'cancel_policy',
    },
  ];
