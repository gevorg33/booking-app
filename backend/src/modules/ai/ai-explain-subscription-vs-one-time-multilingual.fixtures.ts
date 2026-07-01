import type { ExplainSubscriptionVsOneTimeFocus } from './ai-explain-subscription-vs-one-time.fixtures.js';

export type ExplainSubscriptionVsOneTimeMultilingualScenario = {
  id: string;
  prompt: string;
  locale: 'hy' | 'ru';
  surface: 'customer' | 'public';
  expectedAction: 'explain_subscription_vs_one_time';
  rescueReason: 'subscription_vs_one_time';
  serviceName?: string;
  focus?: ExplainSubscriptionVsOneTimeFocus;
};

export const EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_CLASSIFIER_RULES = `- explain_subscription_vs_one_time HY/RU: hy «Բաժանորդագրվել և խնայել թե մեկ այց», «Որ պլանն է ներառում մասաժը»; ru «Абонемент или разовый визит», «Какой план включает массаж». READ checkout subscription vs one-time — NOT explain_my_subscription and NOT use_subscription_credit.`;

export const EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS: readonly ExplainSubscriptionVsOneTimeMultilingualScenario[] =
  [
    {
      id: 'hy-subscribe-save-vs-one-visit',
      prompt: 'Բաժանորդագրվել և խնայել թե մեկ այց',
      locale: 'hy',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'hy-which-plan-massage',
      prompt: 'Որ պլանն է ներառում մասաժը',
      locale: 'hy',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      serviceName: 'massage',
      focus: 'whichPlan',
    },
    {
      id: 'hy-use-subscription-or-pay',
      prompt: 'Օգտագործե՞լ իմ բաժանորդագրությունը թե մեկանգամյա վճարել',
      locale: 'hy',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'useExisting',
    },
    {
      id: 'ru-subscription-or-one-time',
      prompt: 'Абонемент или разовый визит?',
      locale: 'ru',
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'compare',
    },
    {
      id: 'ru-which-plan-massage',
      prompt: 'Какой план включает массаж?',
      locale: 'ru',
      surface: 'public',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      serviceName: 'massage',
      focus: 'whichPlan',
    },
    {
      id: 'ru-subscribe-save-checkout',
      prompt: 'Объясни абонемент со скидкой на оформлении',
      locale: 'ru',
      surface: 'customer',
      expectedAction: 'explain_subscription_vs_one_time',
      rescueReason: 'subscription_vs_one_time',
      focus: 'options',
    },
  ];
