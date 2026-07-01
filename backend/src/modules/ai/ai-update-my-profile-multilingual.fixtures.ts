import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { UpdateMyProfileField } from './ai-update-my-profile.fixtures.js';

export type UpdateMyProfileMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'update_my_profile';
  rescueReason: 'update_my_profile';
  field?: UpdateMyProfileField;
};

export const UPDATE_MY_PROFILE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian update my profile (customer mobile):
  - update_my_profile: hy «Փոխել իմ հեռախոսահամարը», «Թարմացնել իմ անունը», «Խմբագրել իմ email-ը»; ru «Изменить мой номер телефона», «Обновить мое имя», «Изменить мой email». MUTATE profile edit handoff — NOT my_profile (read-only), NOT guide_user_flow (how do I update).`;

export const UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS: readonly UpdateMyProfileMultilingualScenario[] =
  [
    {
      id: 'change-phone-hy-customer',
      locale: 'hy',
      prompt: 'Փոխել իմ հեռախոսահամարը',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'phone',
    },
    {
      id: 'update-name-hy-customer',
      locale: 'hy',
      prompt: 'Թարմացնել իմ անունը',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'name',
    },
    {
      id: 'edit-email-hy-customer',
      locale: 'hy',
      prompt: 'Խմբագրել իմ email-ը',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'email',
    },
    {
      id: 'change-phone-ru-customer',
      locale: 'ru',
      prompt: 'Изменить мой номер телефона',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'phone',
    },
    {
      id: 'update-name-ru-customer',
      locale: 'ru',
      prompt: 'Обновить мое имя',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'name',
    },
    {
      id: 'edit-email-ru-customer',
      locale: 'ru',
      prompt: 'Изменить мой email',
      surface: 'customer',
      expectedAction: 'update_my_profile',
      rescueReason: 'update_my_profile',
      field: 'email',
    },
  ];
