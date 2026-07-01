import type { ExplainProfessionalProfilePromptFixture } from './ai-explain-professional-profile.fixtures.js';

export const EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_CLASSIFIER_RULES = `- explain_professional_profile HY/RU: hy «Ցույց տուր Աննայի ծառայությունները», «Բացիր Մարիայի պրոֆիլը», «Ինչ է մասնագիտանում այս ստայլիստը», «Դիտել մասնագետներին»; ru «Покажи услуги Анны», «Открой профиль Марии», «В чем специализация этого стилиста», «Посмотреть специалистов». READ profile navigation — NOT explain_provider_specialty topic matching.`;

export const EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS: readonly (ExplainProfessionalProfilePromptFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'show-anna-services-hy-customer',
    prompt: 'Ցույց տուր Աննայի ծառայությունները',
    surface: 'customer',
    locale: 'hy',
    expectedAction: 'explain_professional_profile',
    aspect: 'named_provider_profile',
    providerName: 'Anna',
    rescueReason: 'professional_profile',
  },
  {
    id: 'open-maria-profile-hy-public',
    prompt: 'Բացիր Մարիայի պրոֆիլը',
    surface: 'public',
    locale: 'hy',
    expectedAction: 'explain_professional_profile',
    aspect: 'named_provider_profile',
    providerName: 'Maria',
    rescueReason: 'professional_profile',
  },
  {
    id: 'this-stylist-specialize-hy-customer',
    prompt: 'Ինչ է մասնագիտանում այս ստայլիստը',
    surface: 'customer',
    locale: 'hy',
    expectedAction: 'explain_professional_profile',
    aspect: 'current_provider_profile',
    rescueReason: 'professional_profile',
  },
  {
    id: 'show-anna-services-ru-public',
    prompt: 'Покажи услуги Анны',
    surface: 'public',
    locale: 'ru',
    expectedAction: 'explain_professional_profile',
    aspect: 'named_provider_profile',
    providerName: 'Anna',
    rescueReason: 'professional_profile',
  },
  {
    id: 'open-maria-profile-ru-customer',
    prompt: 'Открой профиль Марии',
    surface: 'customer',
    locale: 'ru',
    expectedAction: 'explain_professional_profile',
    aspect: 'named_provider_profile',
    providerName: 'Maria',
    rescueReason: 'professional_profile',
  },
  {
    id: 'browse-professionals-ru-public',
    prompt: 'Посмотреть специалистов',
    surface: 'public',
    locale: 'ru',
    expectedAction: 'explain_professional_profile',
    aspect: 'browse_professionals',
    rescueReason: 'professional_profile',
  },
];
