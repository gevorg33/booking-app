import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type CancelAllUpcomingBookingsMultilingualScenario = {
  id: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  surface: 'customer';
  expectedAction: 'cancel_all_upcoming_bookings';
  rescueReason: 'cancel_all_upcoming_bookings';
};

export const CANCEL_ALL_UPCOMING_BOOKINGS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian cancel all upcoming bookings (customer mobile):
  - cancel_all_upcoming_bookings: hy «Չեղարկել բոլոր իմ ամրագրումները», «Չեղարկել բոլոր իմ այցերը»; ru «Отменить все мои записи», «Отменить все мои бронирования». MUTATE bulk-cancel with confirm — NOT single-booking cancel.`;

export const CANCEL_ALL_UPCOMING_BOOKINGS_MULTILINGUAL_SCENARIOS: readonly CancelAllUpcomingBookingsMultilingualScenario[] =
  [
    {
      id: 'cancel-all-upcoming-hy-1',
      locale: 'hy',
      prompt: 'Չեղարկել բոլոր իմ ամրագրումները',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-all-upcoming-hy-2',
      locale: 'hy',
      prompt: 'Չեղարկել բոլոր իմ հանդիպումները',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-all-upcoming-hy-3',
      locale: 'hy',
      prompt: 'Չեղարկել ամեն ամրագրում, որ ունեմ',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-all-upcoming-ru-1',
      locale: 'ru',
      prompt: 'Отменить все мои записи',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-all-upcoming-ru-2',
      locale: 'ru',
      prompt: 'Отменить все мои бронирования',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
    {
      id: 'cancel-all-upcoming-ru-3',
      locale: 'ru',
      prompt: 'Отменить каждую мою запись',
      surface: 'customer',
      expectedAction: 'cancel_all_upcoming_bookings',
      rescueReason: 'cancel_all_upcoming_bookings',
    },
  ];
