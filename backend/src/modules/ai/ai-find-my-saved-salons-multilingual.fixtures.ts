import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { FindMySavedSalonsAspect } from './ai-find-my-saved-salons.fixtures.js';

export type FindMySavedSalonsMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'find_my_saved_salons';
  rescueReason: 'find_my_saved_salons';
  aspect?: FindMySavedSalonsAspect;
};

export const FIND_MY_SAVED_SALONS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian saved salons (customer mobile):
  - find_my_saved_salons: hy «ցույց տալ պահված salon-ները», «այցելած salon-ներ»; ru «показать сохранённые салоны», «недавние салоны». NOT switch_salon_tenant.`;

export const FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS: readonly FindMySavedSalonsMultilingualScenario[] =
  [
    {
      id: 'saved-salons-hy-customer',
      locale: 'hy',
      prompt: 'Ցույց տալ պահված salon-ները',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'visited-salons-hy-customer',
      locale: 'hy',
      prompt: 'Ցույց տա այցելած salon-ները',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'saved-salons-ru-customer',
      locale: 'ru',
      prompt: 'Показать мои сохранённые салоны',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'recent-salons-ru-customer',
      locale: 'ru',
      prompt: 'Недавние салоны, где я был',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'where-saved-ru-customer',
      locale: 'ru',
      prompt: 'Где найти сохранённые салоны?',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'where',
    },
    {
      id: 'switch-help-hy-customer',
      locale: 'hy',
      prompt: 'Որտեղ են պահված salon-ները',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'where',
    },
  ];
