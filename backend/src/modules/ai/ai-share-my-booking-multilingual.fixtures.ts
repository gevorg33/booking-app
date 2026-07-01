import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ShareMyBookingMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'share_my_booking';
  rescueReason: 'share_my_booking';
};

export const SHARE_MY_BOOKING_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian share my booking (customer mobile):
  - share_my_booking: hy «Կիսվել իմ ամրագրմամբ», «Ուղարկել ամրագրումը ընկերոջը»; ru «Поделиться моей записью», «Отправить запись партнёру». NOT get_manage_link, NOT share_salon_link.`;

export const SHARE_MY_BOOKING_MULTILINGUAL_SCENARIOS: readonly ShareMyBookingMultilingualScenario[] =
  [
    {
      id: 'share-booking-hy-customer',
      locale: 'hy',
      prompt: 'Կիսվել իմ ամրագրմամբ',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-booking-ru-customer',
      locale: 'ru',
      prompt: 'Поделиться моей записью',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-appointment-partner-hy-customer',
      locale: 'hy',
      prompt: 'Ուղարկել ամրագրումը ընկերոջը',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-appointment-partner-ru-customer',
      locale: 'ru',
      prompt: 'Отправить запись партнёру',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-visit-hy-customer',
      locale: 'hy',
      prompt: 'Կիսվել իմ այցի մասին',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-visit-ru-customer',
      locale: 'ru',
      prompt: 'Поделиться деталями моего визита',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-booking-family-hy-customer',
      locale: 'hy',
      prompt: 'Ուղարկել ամրագրումը ընտանիքին',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
    {
      id: 'share-booking-family-ru-customer',
      locale: 'ru',
      prompt: 'Отправить бронь семье',
      surface: 'customer',
      expectedAction: 'share_my_booking',
      rescueReason: 'share_my_booking',
    },
  ];
