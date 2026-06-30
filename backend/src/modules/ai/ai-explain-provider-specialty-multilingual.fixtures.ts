import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ProviderSpecialtyAspect } from './ai-explain-provider-specialty.util.js';

export type ExplainProviderSpecialtyMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_provider_specialty';
  aspect?: ProviderSpecialtyAspect;
  providerName?: string;
  specialtyTopic?: string;
  rescueReason: 'provider_specialty';
};

export const EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian provider specialty (customer + public booking):
  - explain_provider_specialty: hy «Ո՞վ է լավագույնը գունավոր մազերի համար», «Պատմիր Աննայի մասին»; ru «Кто лучше всего для кудрявых волос», «Расскажи об Анне». Provider profile specialty/bio — NOT recommend_specialists.`;

export const EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_SCENARIOS: ExplainProviderSpecialtyMultilingualScenario[] =
  [
    {
      id: 'best-curly-hair-hy-customer',
      locale: 'hy',
      prompt: 'Ո՞վ է լավագույնը գունարձակ մազերի համար',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'գունարձակ մազերի',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'about-anna-hy-customer',
      locale: 'hy',
      prompt: 'Պատմիր Աննայի մասին',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Աննայի',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'specializes-balayage-hy-customer',
      locale: 'hy',
      prompt: 'Ո՞վ է մասնագիտանում balayage-ում',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'balayage',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'best-curly-hair-ru-customer',
      locale: 'ru',
      prompt: 'Кто лучше всего подходит для кудрявых волос?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'кудрявых волос',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'about-anna-ru-customer',
      locale: 'ru',
      prompt: 'Расскажи об Анне',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Анне',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'specializes-balayage-ru-customer',
      locale: 'ru',
      prompt: 'Кто специализируется на балаяже?',
      surface: 'customer',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'балаяже',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'best-curly-hair-hy-public',
      locale: 'hy',
      prompt: 'Ո՞վ է լավագույնը գունարձակ մազերի համար',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'գունարձակ մազերի',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'about-anna-hy-public',
      locale: 'hy',
      prompt: 'Պատմիր Աննայի մասին',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Աննայի',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'specializes-balayage-hy-public',
      locale: 'hy',
      prompt: 'Ո՞վ է մասնագիտանում balayage-ում',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'balayage',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'best-curly-hair-ru-public',
      locale: 'ru',
      prompt: 'Кто лучше всего подходит для кудрявых волос?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'кудрявых волос',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'about-anna-ru-public',
      locale: 'ru',
      prompt: 'Расскажи об Анне',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'named_provider',
      providerName: 'Анне',
      rescueReason: 'provider_specialty',
    },
    {
      id: 'specializes-balayage-ru-public',
      locale: 'ru',
      prompt: 'Кто специализируется на балаяже?',
      surface: 'public',
      expectedAction: 'explain_provider_specialty',
      aspect: 'specialty_match',
      specialtyTopic: 'балаяже',
      rescueReason: 'provider_specialty',
    },
  ];
