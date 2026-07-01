import type { PromptNormalizationMethod } from './ai-prompt-normalization.service.js';

export type PromptNormalizePassthroughScenario = {
  id: string;
  prompt: string;
  businessId: string;
  expectedMethod: PromptNormalizationMethod;
  expectedNormalized: string;
  expectClassifierContext: boolean;
  language: 'en' | 'hy' | 'ru' | 'translit';
};

export type PromptNormalizeEmptyScenario = {
  id: string;
  prompt: string;
  businessId: string;
};

export type PromptNormalizeCacheScenario = {
  id: string;
  prompt: string;
  businessId: string;
  language: 'hy' | 'ru';
};

/** HY/RU text passes through unchanged; classifier gets multilingual context (pipe-1.1.2). */
export const PROMPT_NORMALIZE_PASSTHROUGH_SCENARIOS: PromptNormalizePassthroughScenario[] =
  [
    {
      id: 'en-passthrough-list',
      prompt: 'Show appointments today',
      businessId: 'biz-norm-en',
      expectedMethod: 'passthrough',
      expectedNormalized: 'Show appointments today',
      expectClassifierContext: false,
      language: 'en',
    },
    {
      id: 'hy-passthrough-list',
      prompt: 'Ցույց տուր բոլոր ամրագրումները այսօր',
      businessId: 'biz-norm-hy',
      expectedMethod: 'multilingual',
      expectedNormalized: 'Ցույց տուր բոլոր ամրագրումները այսօր',
      expectClassifierContext: true,
      language: 'hy',
    },
    {
      id: 'hy-passthrough-conditional-book',
      prompt:
        'Ամրագրիր facemassage Գևորգի հետ վաղը 09:00, եթե զբաղված է՝ Մարիայի հետ 09:00, եթե ոչ՝ ցանկացած ազատ մասնագետ',
      businessId: 'biz-norm-hy',
      expectedMethod: 'multilingual',
      expectedNormalized:
        'Ամրագրիր facemassage Գևորգի հետ վաղը 09:00, եթե զբաղված է՝ Մարիայի հետ 09:00, եթե ոչ՝ ցանկացած ազատ մասնագետ',
      expectClassifierContext: true,
      language: 'hy',
    },
    {
      id: 'ru-passthrough-fallback-chain',
      prompt:
        'Запиши массаж на Геворга завтра в 10:00, если занят — на Марию в 10:00, иначе любой свободный мастер',
      businessId: 'biz-norm-ru',
      expectedMethod: 'multilingual',
      expectedNormalized:
        'Запиши массаж на Геворга завтра в 10:00, если занят — на Марию в 10:00, иначе любой свободный мастер',
      expectClassifierContext: true,
      language: 'ru',
    },
    {
      id: 'ru-passthrough-list',
      prompt: 'Покажи все записи на завтра',
      businessId: 'biz-norm-ru',
      expectedMethod: 'multilingual',
      expectedNormalized: 'Покажи все записи на завтра',
      expectClassifierContext: true,
      language: 'ru',
    },
    {
      id: 'translit-passthrough-compound',
      prompt:
        'pokazhi vse zapisi Gevorg na vagh@ i otmeni vse mezhdu 16:30-17:30',
      businessId: 'biz-norm-translit',
      expectedMethod: 'multilingual',
      expectedNormalized:
        'pokazhi vse zapisi Gevorg na vagh@ i otmeni vse mezhdu 16:30-17:30',
      expectClassifierContext: true,
      language: 'translit',
    },
  ];

export const PROMPT_NORMALIZE_EMPTY_SCENARIOS: PromptNormalizeEmptyScenario[] =
  [
    { id: 'empty-string', prompt: '', businessId: 'biz-norm-empty' },
    { id: 'empty-whitespace', prompt: '   ', businessId: 'biz-norm-empty' },
    { id: 'empty-newlines', prompt: '\n\t  \n', businessId: 'biz-norm-empty' },
  ];

export const PROMPT_NORMALIZE_CACHE_SCENARIOS: PromptNormalizeCacheScenario[] =
  [
    {
      id: 'hy-cache-hit',
      prompt: 'Ցույց տուր Գևորգի ամրագրումները վաղը',
      businessId: 'biz-norm-cache-hy',
      language: 'hy',
    },
    {
      id: 'ru-cache-hit',
      prompt: 'Запиши на массаж завтра в 10:00',
      businessId: 'biz-norm-cache-ru',
      language: 'ru',
    },
  ];
