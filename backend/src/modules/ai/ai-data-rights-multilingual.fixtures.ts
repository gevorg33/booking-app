import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export const DATA_RIGHTS_MULTILINGUAL_CLASSIFIER_RULES = `- explain_data_rights hy/ru: hy «ինչպե՞ս կարող եմ արտահանել իմ տվյալները», «ինչ իրավունքներ ունեմ իմ տվյալների նկատմամբ»; ru «как я могу экспортировать свои данные», «какие у меня права на мои данные». READ GDPR explainer — NOT privacy_export/privacy_delete (self-service mutate).`;

export type DataRightsMultilingualScenario = {
  id: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: 'explain_data_rights';
  rescueReason: string;
};

export const DATA_RIGHTS_MULTILINGUAL_SCENARIOS: readonly DataRightsMultilingualScenario[] =
  [
    {
      id: 'explain-data-rights-hy-1',
      locale: 'hy',
      prompt: 'Ինչպե՞ս կարող եմ արտահանել իմ տվյալները',
      expectedAction: 'explain_data_rights',
      rescueReason: 'explain_data_rights',
    },
    {
      id: 'explain-data-rights-hy-2',
      locale: 'hy',
      prompt: 'Ինչ իրավունքներ ունեմ իմ տվյալների նկատմամբ',
      expectedAction: 'explain_data_rights',
      rescueReason: 'explain_data_rights',
    },
    {
      id: 'explain-data-rights-ru-1',
      locale: 'ru',
      prompt: 'Как я могу экспортировать свои данные?',
      expectedAction: 'explain_data_rights',
      rescueReason: 'explain_data_rights',
    },
    {
      id: 'explain-data-rights-ru-2',
      locale: 'ru',
      prompt: 'Какие у меня права на мои данные?',
      expectedAction: 'explain_data_rights',
      rescueReason: 'explain_data_rights',
    },
  ];
