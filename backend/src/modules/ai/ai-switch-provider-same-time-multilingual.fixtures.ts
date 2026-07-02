import type { SwitchProviderSameTimePromptFixture } from './ai-switch-provider-same-time.fixtures.js';

export const SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_CLASSIFIER_RULES = `- switch_provider_same_time HY/RU: hy «Պահել 15:00-ը բայց այլ ստայլիստ», «Նույն ժամին այլ մասնագիր», «Փոխել ստայլիստը բայց պահել ժամը»; ru «Оставить 15:00 но другой мастер», «То же время другой стилист», «Сменить мастера но оставить время». MUTATE same-slot provider switch — NOT pick_provider_for_service and NOT reschedule_my_booking.`;

export const SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS: readonly (SwitchProviderSameTimePromptFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'keep-time-different-stylist-hy-customer',
    prompt: 'Պահել 15:00-ը բայց այլ ստայլիստ',
    surface: 'customer',
    locale: 'hy',
    expectedAction: 'switch_provider_same_time',
    mode: 'keep_time_any_provider',
    timeSlot: '15:00',
    rescueReason: 'switch_provider_same_time',
  },
  {
    id: 'same-time-other-provider-hy-public',
    prompt: 'Նույն ժամին այլ մասնագիր',
    surface: 'public',
    locale: 'hy',
    expectedAction: 'switch_provider_same_time',
    mode: 'keep_time_any_provider',
    rescueReason: 'switch_provider_same_time',
  },
  {
    id: 'switch-stylist-keep-time-hy-customer',
    prompt: 'Փոխել ստայլիստը բայց պահել ժամը',
    surface: 'customer',
    locale: 'hy',
    expectedAction: 'switch_provider_same_time',
    mode: 'keep_time_any_provider',
    rescueReason: 'switch_provider_same_time',
  },
  {
    id: 'keep-time-different-stylist-ru-public',
    prompt: 'Оставить 15:00 но другой мастер',
    surface: 'public',
    locale: 'ru',
    expectedAction: 'switch_provider_same_time',
    mode: 'keep_time_any_provider',
    timeSlot: '15:00',
    rescueReason: 'switch_provider_same_time',
  },
  {
    id: 'same-time-other-stylist-ru-customer',
    prompt: 'То же время другой стилист',
    surface: 'customer',
    locale: 'ru',
    expectedAction: 'switch_provider_same_time',
    mode: 'keep_time_any_provider',
    rescueReason: 'switch_provider_same_time',
  },
  {
    id: 'switch-to-anna-keep-time-ru-public',
    prompt: 'Сменить на Анну но оставить 15:00',
    surface: 'public',
    locale: 'ru',
    expectedAction: 'switch_provider_same_time',
    mode: 'keep_time_named_provider',
    providerName: 'Anna',
    timeSlot: '15:00',
    rescueReason: 'switch_provider_same_time',
  },
];
