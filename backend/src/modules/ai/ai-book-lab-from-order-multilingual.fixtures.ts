import type { BookLabFromOrderFixture } from './ai-book-lab-from-order.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type BookLabFromOrderMultilingualScenario = BookLabFromOrderFixture & {
  locale: AiEvalLocale;
};

export const BOOK_LAB_FROM_ORDER_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian book lab from order (customer only):
  - book_lab_from_order: hy «Ամրագրիր հավաքումը իմ լաբ պատվերի համար», «Գրանցիր արյան վերցումը Լաբ ամրագրելու ներդիրից»; ru «Забронируй забор для моего лабораторного заказа», «Запишись на забор из вкладки Лаборатория к записи». MUTATE LabToBookPage — NOT list_my_lab_booking_requests.`;

export const BOOK_LAB_FROM_ORDER_MULTILINGUAL_SCENARIOS: readonly BookLabFromOrderMultilingualScenario[] =
  [
    {
      id: 'book-order-hy-customer',
      locale: 'hy',
      prompt: 'Ամրագրիր հավաքումը իմ լաբ պատվերի համար',
      surface: 'customer',
      expectedAction: 'book_lab_from_order',
      rescueReason: 'book_lab_from_order',
    },
    {
      id: 'lab-tab-hy-customer',
      locale: 'hy',
      prompt: 'Գրանցիր արյան վերցումը Լաբ ամրագրելու ներդիրից',
      surface: 'customer',
      expectedAction: 'book_lab_from_order',
      rescueReason: 'book_lab_from_order',
    },
    {
      id: 'book-order-ru-customer',
      locale: 'ru',
      prompt: 'Забронируй забор для моего лабораторного заказа',
      surface: 'customer',
      expectedAction: 'book_lab_from_order',
      rescueReason: 'book_lab_from_order',
    },
    {
      id: 'lab-tab-ru-customer',
      locale: 'ru',
      prompt: 'Запишись на забор из вкладки Лаборатория к записи',
      surface: 'customer',
      expectedAction: 'book_lab_from_order',
      rescueReason: 'book_lab_from_order',
    },
    {
      id: 'cbc-order-ru-customer',
      locale: 'ru',
      prompt: 'Забронируй забор по заказу CBC',
      surface: 'customer',
      expectedAction: 'book_lab_from_order',
      rescueReason: 'book_lab_from_order',
      testName: 'CBC',
    },
    {
      id: 'pending-order-hy-customer',
      locale: 'hy',
      prompt: 'Ամրագրիր սպասող լաբ պատվերի հավաքումը',
      surface: 'customer',
      expectedAction: 'book_lab_from_order',
      rescueReason: 'book_lab_from_order',
    },
  ];
