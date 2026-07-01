import type { ExplainProviderAvailabilityPromptFixture } from './ai-explain-provider-availability.fixtures.js';

export const EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_CLASSIFIER_RULES = `- explain_provider_availability HY/RU: hy «Արդյո՞ք Marco-ն աշխատում է շաբաթ», «Ով ունի ազատ slot վաղը»; ru «Работает ли Marco в субботу», «У кого есть окна завтра». READ provider schedule/openings — wraps check_availability, NOT find_soonest_appointment.`;

export type ExplainProviderAvailabilityMultilingualScenario =
  ExplainProviderAvailabilityPromptFixture & {
    locale: 'hy' | 'ru';
  };

export const EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS: readonly ExplainProviderAvailabilityMultilingualScenario[] =
  [
    {
      id: 'is-marco-working-hy-customer',
      locale: 'hy',
      prompt: 'Արդյո՞ք Marco-ն աշխատում է շաբաթ',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Marco',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'who-openings-hy-customer',
      locale: 'hy',
      prompt: 'Ով ունի ազատ slot վաղը',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'is-anna-working-hy-public',
      locale: 'hy',
      prompt: 'Anna-ն աշխատու՞մ է ուրբաթ',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Anna',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'is-marco-working-ru-customer',
      locale: 'ru',
      prompt: 'Работает ли Marco в субботу?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'named_schedule',
      employeeName: 'Marco',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'who-openings-ru-customer',
      locale: 'ru',
      prompt: 'У кого есть окна завтра?',
      surface: 'customer',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
    {
      id: 'who-working-ru-public',
      locale: 'ru',
      prompt: 'Кто работает в субботу?',
      surface: 'public',
      expectedAction: 'explain_provider_availability',
      aspect: 'team_openings',
      rescueReason: 'explain_provider_availability',
    },
  ];
