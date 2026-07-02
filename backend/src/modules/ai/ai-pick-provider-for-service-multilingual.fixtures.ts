import type { PickProviderForServicePromptFixture } from './ai-pick-provider-for-service.fixtures.js';

export const PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_CLASSIFIER_RULES = `- pick_provider_for_service HY/RU: hy «Գրանցվել Աննայի հետ գույնի համար», «Ցանկանում եմ նույն ստայլիստը», «Ընտրել Մարիային հարսակի համար»; ru «Записаться к Анне на окрашивание», «Хочу того же мастера», «Выбрать Марию для мелирования». MUTATE provider pick — NOT rebook_last_appointment and NOT explain_provider_specialty.`;

export type PickProviderForServiceMultilingualScenario =
  PickProviderForServicePromptFixture & {
    locale: 'hy' | 'ru';
  };

export const PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_SCENARIOS: readonly PickProviderForServiceMultilingualScenario[] =
  [
    {
      id: 'book-anna-color-hy-customer',
      locale: 'hy',
      prompt: 'Գրանցվել Anna-ի հետ գույնի համար',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Anna',
      serviceName: 'color',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'same-stylist-hy-customer',
      locale: 'hy',
      prompt: 'Ցանկանում եմ նույն ստայլիստը',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'same_as_last',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'pick-maria-hy-public',
      locale: 'hy',
      prompt: 'Ընտրել Maria-ին highlights-ի համար',
      surface: 'public',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Maria',
      serviceName: 'highlights',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'book-anna-color-ru-customer',
      locale: 'ru',
      prompt: 'Записаться к Anna на color',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Anna',
      serviceName: 'color',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'same-master-ru-customer',
      locale: 'ru',
      prompt: 'Хочу того же мастера что и в прошлый раз',
      surface: 'customer',
      expectedAction: 'pick_provider_for_service',
      mode: 'same_as_last',
      rescueReason: 'pick_provider_for_service',
    },
    {
      id: 'pick-maria-ru-public',
      locale: 'ru',
      prompt: 'Выбрать Maria для highlights',
      surface: 'public',
      expectedAction: 'pick_provider_for_service',
      mode: 'named_provider',
      providerName: 'Maria',
      serviceName: 'highlights',
      rescueReason: 'pick_provider_for_service',
    },
  ];
