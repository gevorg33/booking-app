import type { ListMyDocumentsPromptFixture } from './ai-list-my-documents.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ListMyDocumentsMultilingualScenario =
  ListMyDocumentsPromptFixture & {
    locale: AiEvalLocale;
  };

export const LIST_MY_DOCUMENTS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian list my documents (customer only):
  - list_my_documents: hy «Ցույց տուր իմ ուղեգիրը», «Որտեղ են իմ պատկերագրության հաշվետվությունները», «Բացիր իմ փաստաթղթերը»; ru «Покажи моё направление», «Где мои снимки», «Список моих документов». READ My Results documents — NOT list_my_test_results.`;

export const LIST_MY_DOCUMENTS_MULTILINGUAL_SCENARIOS: readonly ListMyDocumentsMultilingualScenario[] =
  [
    {
      id: 'referral-hy-customer',
      locale: 'hy',
      prompt: 'Ցույց տուր իմ ուղեգիրը',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'referral_letter',
    },
    {
      id: 'imaging-hy-customer',
      locale: 'hy',
      prompt: 'Որտեղ են իմ պատկերագրության հաշվետվությունները',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'imaging_report',
    },
    {
      id: 'documents-hy-customer',
      locale: 'hy',
      prompt: 'Բացիր իմ փաստաթղթերը',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
    },
    {
      id: 'referral-ru-customer',
      locale: 'ru',
      prompt: 'Покажи моё направление',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'referral_letter',
    },
    {
      id: 'imaging-ru-customer',
      locale: 'ru',
      prompt: 'Где мои снимки и отчёты',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'imaging_report',
    },
    {
      id: 'documents-ru-customer',
      locale: 'ru',
      prompt: 'Список моих документов в приложении',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
    },
  ];
