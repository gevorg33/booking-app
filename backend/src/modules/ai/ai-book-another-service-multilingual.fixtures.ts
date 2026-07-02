import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type BookAnotherServiceMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'book_another_service';
  rescueReason: 'book_another_service';
  sameDay?: boolean;
};

export const BOOK_ANOTHER_SERVICE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian book another service after success (customer + public):
  - book_another_service: hy «Ամրագրիր ևս մեկ ծառայություն», «Այլ ծառայություն այսօր»; ru «Запиши ещё одну услугу», «Другая услуга сегодня». Fresh booking flow with freshBook=1 — NOT explain_consumer_checkout_success.`;

export const BOOK_ANOTHER_SERVICE_MULTILINGUAL_SCENARIOS: readonly BookAnotherServiceMultilingualScenario[] =
  [
    {
      id: 'book-another-hy-customer',
      locale: 'hy',
      prompt: 'Ամրագրիր ևս մեկ ծառայություն',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'book-another-same-day-hy-public',
      locale: 'hy',
      prompt: 'Այլ ծառայություն այսօր ամրագրել',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'book-another-ru-customer',
      locale: 'ru',
      prompt: 'Запиши ещё одну услугу',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'book-another-same-day-ru-public',
      locale: 'ru',
      prompt: 'Другая услуга сегодня — хочу записаться',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'book-another-hy-public',
      locale: 'hy',
      prompt: 'Սկսիր նոր ամրագրում այլ ծառայության համար',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
    },
    {
      id: 'book-another-ru-customer-same-day',
      locale: 'ru',
      prompt: 'Записаться на другую услугу в тот же день',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'book-another-hy-customer-today',
      locale: 'hy',
      prompt: 'Այսօր ևս մեկ այց ամրագրել',
      surface: 'customer',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
    {
      id: 'book-another-ru-public-today',
      locale: 'ru',
      prompt: 'Хочу ещё одну запись сегодня',
      surface: 'public',
      expectedAction: 'book_another_service',
      rescueReason: 'book_another_service',
      sameDay: true,
    },
  ];
