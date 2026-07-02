import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type GetManageLinkMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'get_manage_link';
  rescueReason: 'manage_link';
};

export const GET_MANAGE_LINK_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian signed-in manage link (customer mobile):
  - get_manage_link: hy «ուղարկիր amragrumi karavarman hghumn»; ru «ссылка для управления записью», «прислать ссылку для управления». Signed-in session — NOT recover_lost_manage_link (guest resend).`;

export const GET_MANAGE_LINK_MULTILINGUAL_SCENARIOS: readonly GetManageLinkMultilingualScenario[] =
  [
    {
      id: 'manage-link-hy-customer',
      locale: 'hy',
      prompt: 'Ուղարկիր իմ ամրագրման կառավարման հղումը',
      surface: 'customer',
      expectedAction: 'get_manage_link',
      rescueReason: 'manage_link',
    },
    {
      id: 'manage-link-ru-customer',
      locale: 'ru',
      prompt: 'Прислать ссылку для управления записью',
      surface: 'customer',
      expectedAction: 'get_manage_link',
      rescueReason: 'manage_link',
    },
  ];
