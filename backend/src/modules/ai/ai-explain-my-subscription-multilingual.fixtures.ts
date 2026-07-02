import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainMySubscriptionMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_my_subscription';
  rescueReason: 'explain_my_subscription';
  focus?: 'visits' | 'renewal' | 'overview' | 'status';
};

export const EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain my subscription (customer mobile):
  - explain_my_subscription: hy «Քանի այց է մնացել իմ պլանում», «Բացատրել իմ membership-ը»; ru «Сколько визитов осталось на моём плане», «Объяснить мою подписку». READ visits/expiry/plan summary — NOT my_subscriptions (list only).`;

export const EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_SCENARIOS: readonly ExplainMySubscriptionMultilingualScenario[] =
  [
    {
      id: 'visits-left-hy-customer',
      locale: 'hy',
      prompt: 'Քանի այց է մնացել իմ պլանում',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'visits',
    },
    {
      id: 'explain-membership-hy-customer',
      locale: 'hy',
      prompt: 'Բացատրել իմ membership-ը',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'overview',
    },
    {
      id: 'visits-left-ru-customer',
      locale: 'ru',
      prompt: 'Сколько визитов осталось на моём плане',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'visits',
    },
    {
      id: 'explain-subscription-ru-customer',
      locale: 'ru',
      prompt: 'Объяснить мою подписку',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'overview',
    },
    {
      id: 'when-expires-hy-customer',
      locale: 'hy',
      prompt: 'Ե՞րբ է ավարտվում իմ subscription plan-ը',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'renewal',
    },
    {
      id: 'whats-on-ru-customer',
      locale: 'ru',
      prompt: 'Что включено в мою membership',
      surface: 'customer',
      expectedAction: 'explain_my_subscription',
      rescueReason: 'explain_my_subscription',
      focus: 'overview',
    },
  ];
