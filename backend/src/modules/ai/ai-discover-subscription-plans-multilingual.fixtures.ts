import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export const DISCOVER_SUBSCRIPTION_PLANS_MULTILINGUAL_CLASSIFIER_RULES = `- discover_subscription_plans hy/ru: hy «ի՞նչ բաժանորդագրության պլաններ ունեք», «ցույց տուր անդամակցության պլանները»; ru «какие у вас планы подписки», «покажи планы абонемента». READ catalog browse — NOT select_subscription_plan (mutate pick).`;

export type DiscoverSubscriptionPlansMultilingualScenario = {
  id: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: 'discover_subscription_plans';
  rescueReason: string;
};

export const DISCOVER_SUBSCRIPTION_PLANS_MULTILINGUAL_SCENARIOS: readonly DiscoverSubscriptionPlansMultilingualScenario[] =
  [
    {
      id: 'discover-subscription-plans-hy-1',
      locale: 'hy',
      prompt: 'Ի՞նչ բաժանորդագրության պլաններ ունեք',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'discover-subscription-plans-hy-2',
      locale: 'hy',
      prompt: 'Ցույց տուր անդամակցության պլանները',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'discover-subscription-plans-ru-1',
      locale: 'ru',
      prompt: 'Какие у вас планы подписки?',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
    {
      id: 'discover-subscription-plans-ru-2',
      locale: 'ru',
      prompt: 'Покажи планы абонемента',
      expectedAction: 'discover_subscription_plans',
      rescueReason: 'discover_subscriptions',
    },
  ];
