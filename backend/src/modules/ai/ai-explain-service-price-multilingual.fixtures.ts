import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainServicePriceMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_service_price';
  rescueReason: 'service_price';
};

export const EXPLAIN_SERVICE_PRICE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian service price (customer + public booking):
  - explain_service_price: hy «Որքա՞ն է սանրվածքը», «Ինչ արժե massage-ը»; ru «Сколько стоит стрижка», «Какая цена массажа». Service card price + tax badge + deposit note. NOT list_services budget browse.`;

export const EXPLAIN_SERVICE_PRICE_MULTILINGUAL_SCENARIOS: ExplainServicePriceMultilingualScenario[] =
  [
    {
      id: 'how-much-haircut-hy-customer',
      locale: 'hy',
      prompt: 'Որքա՞ն է սանրվածքը',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-haircut-ru-customer',
      locale: 'ru',
      prompt: 'Сколько стоит стрижка',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'price-massage-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ արժե massage-ը',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'price-massage-ru-customer',
      locale: 'ru',
      prompt: 'Какая цена массажа',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'included-price-hy-customer',
      locale: 'hy',
      prompt: 'Massage-ը ներառված է $80-ում',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'included-price-ru-customer',
      locale: 'ru',
      prompt: 'Массаж входит в $80',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-haircut-hy-public',
      locale: 'hy',
      prompt: 'Որքա՞ն է սանրվածքը',
      surface: 'public',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-haircut-ru-public',
      locale: 'ru',
      prompt: 'Сколько стоит стрижка',
      surface: 'public',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'price-massage-hy-public',
      locale: 'hy',
      prompt: 'Ինչ արժե massage-ը',
      surface: 'public',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'price-massage-ru-public',
      locale: 'ru',
      prompt: 'Какая цена массажа',
      surface: 'public',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'included-price-hy-public',
      locale: 'hy',
      prompt: 'Massage-ը ներառված է $80-ում',
      surface: 'public',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
    {
      id: 'included-price-ru-public',
      locale: 'ru',
      prompt: 'Массаж входит в $80',
      surface: 'public',
      expectedAction: 'explain_service_price',
      rescueReason: 'service_price',
    },
  ];
