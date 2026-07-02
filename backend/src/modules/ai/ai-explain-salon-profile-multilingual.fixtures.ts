import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { SalonProfileAspect } from './ai-explain-salon-profile.fixtures.js';

export type ExplainSalonProfileMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_salon_profile';
  aspect?: SalonProfileAspect;
  rescueReason: 'salon_profile';
};

export const EXPLAIN_SALON_PROFILE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian salon profile (customer + public booking):
  - explain_salon_profile: hy «պատմիր այս սրահի մասին», «ցույց տուր սրահի էջը»; ru «расскажи об этом салоне», «покажи профиль салона». READ SalonProfilePage navigation — NOT business_info, NOT explain_business_hours_and_location.`;

export const EXPLAIN_SALON_PROFILE_MULTILINGUAL_SCENARIOS: readonly ExplainSalonProfileMultilingualScenario[] =
  [
    {
      id: 'salon-profile-hy-customer',
      locale: 'hy',
      prompt: 'Պատմիր այս սրահի մասին',
      surface: 'customer',
      expectedAction: 'explain_salon_profile',
      aspect: 'overview',
      rescueReason: 'salon_profile',
    },
    {
      id: 'salon-profile-hy-public',
      locale: 'hy',
      prompt: 'Պատմիր այս սրահի մասին',
      surface: 'public',
      expectedAction: 'explain_salon_profile',
      aspect: 'overview',
      rescueReason: 'salon_profile',
    },
    {
      id: 'salon-profile-ru-customer',
      locale: 'ru',
      prompt: 'Расскажи об этом салоне',
      surface: 'customer',
      expectedAction: 'explain_salon_profile',
      aspect: 'overview',
      rescueReason: 'salon_profile',
    },
    {
      id: 'salon-profile-ru-public',
      locale: 'ru',
      prompt: 'Расскажи об этом салоне',
      surface: 'public',
      expectedAction: 'explain_salon_profile',
      aspect: 'overview',
      rescueReason: 'salon_profile',
    },
    {
      id: 'show-profile-hy-customer',
      locale: 'hy',
      prompt: 'Ցույց տուր սրահի էջը',
      surface: 'customer',
      expectedAction: 'explain_salon_profile',
      aspect: 'all',
      rescueReason: 'salon_profile',
    },
    {
      id: 'show-profile-ru-public',
      locale: 'ru',
      prompt: 'Покажи профиль салона',
      surface: 'public',
      expectedAction: 'explain_salon_profile',
      aspect: 'all',
      rescueReason: 'salon_profile',
    },
  ];
