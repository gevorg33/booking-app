import type { ExplainAnyProviderOptionPromptFixture } from './ai-explain-any-provider-option.fixtures.js';

export const EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_CLASSIFIER_RULES = `- explain_any_provider_option HY/RU: hy «Ցանկացած մասնագետը ինչ է նշանակում», «Ով կկցվի», «ինչպես ընտրել ցանկացած մասնագետ»; ru «Что значит любой специалист», «Кто будет назначен», «как выбрать любого специалиста». READ Any stylist picker — NOT book_appointment and NOT explain_provider_specialty.`;

export type ExplainAnyProviderOptionMultilingualScenario =
  ExplainAnyProviderOptionPromptFixture & {
    locale: 'hy' | 'ru';
  };

export const EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_SCENARIOS: readonly ExplainAnyProviderOptionMultilingualScenario[] =
  [
    {
      id: 'what-means-hy-customer',
      locale: 'hy',
      prompt: 'Ցանկացած մասնագետը ինչ է նշանակում',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'what_it_means',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'assignment-hy-customer',
      locale: 'hy',
      prompt: 'Ով կկցվի, եթե ցանկացած մասնագետը թողնեմ',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'assignment',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'picker-hy-public',
      locale: 'hy',
      prompt: 'Ինչպե՞ս ընտրել ցանկացած մասնագետը գրանցման էջում',
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'picker',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'what-means-ru-customer',
      locale: 'ru',
      prompt: 'Что значит любой специалист при записи?',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'what_it_means',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'assignment-ru-customer',
      locale: 'ru',
      prompt: 'Кто будет назначен, если оставить любого специалиста?',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'assignment',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'picker-ru-public',
      locale: 'ru',
      prompt: 'Как выбрать любого специалиста на странице записи?',
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'picker',
      rescueReason: 'any_provider_option',
    },
  ];
