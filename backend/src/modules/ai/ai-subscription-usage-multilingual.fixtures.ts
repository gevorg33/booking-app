import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type SubscriptionUsageMultilingualScenario = {
  id: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  surface: 'customer';
  expectedAction: 'subscription_usage';
  rescueReason: 'subscription_usage';
};

export const SUBSCRIPTION_USAGE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian subscription usage (customer mobile):
  - subscription_usage: hy «Իմ բաժանորդագրության օգտագործումը», «Ցույց տալ իմ պլանի օգտագործումը»; ru «Использование моей подписки», «Показать использование моего плана». READ raw usage ledger — NOT explain_my_subscription (explain-toned summary), NOT my_subscriptions (list only).`;

export const SUBSCRIPTION_USAGE_MULTILINGUAL_SCENARIOS: readonly SubscriptionUsageMultilingualScenario[] =
  [
    {
      id: 'subscription-usage-hy-1',
      locale: 'hy',
      prompt: 'Իմ բաժանորդագրության օգտագործումը',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'subscription-usage-hy-2',
      locale: 'hy',
      prompt: 'Ցույց տալ իմ պլանի օգտագործումը',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'subscription-usage-hy-3',
      locale: 'hy',
      prompt: 'Իմ membership-ի օգտագործման պատմություն',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'subscription-usage-ru-1',
      locale: 'ru',
      prompt: 'Использование моей подписки',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'subscription-usage-ru-2',
      locale: 'ru',
      prompt: 'Показать использование моего плана',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
    {
      id: 'subscription-usage-ru-3',
      locale: 'ru',
      prompt: 'История использования моей подписки',
      surface: 'customer',
      expectedAction: 'subscription_usage',
      rescueReason: 'subscription_usage',
    },
  ];
