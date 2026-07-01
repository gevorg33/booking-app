import type { ManageBookingPageAspect } from './ai-explain-manage-booking-page.fixtures.js';

export type ExplainManageBookingPageMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'explain_manage_booking_page';
  rescueReason: 'manage_booking_page';
  aspect?: ManageBookingPageAspect;
};

export const EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_CLASSIFIER_RULES = `- explain_manage_booking_page HY/RU: hy «Ինչ կարող եմ անել կառավարման էջում», «Անվավեր կառավարման հղում»; ru «Что можно сделать на странице управления», «Недействительная ссылка управления». READ ManageBookingPage UX — NOT sign_in_to_manage_booking.`;

export const EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS: readonly ExplainManageBookingPageMultilingualScenario[] =
  [
    {
      id: 'what-can-do-manage-hy-customer',
      prompt: 'Ինչ կարող եմ անել կառավարման էջում',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_manage_booking_page',
      rescueReason: 'manage_booking_page',
      aspect: 'capabilities',
    },
    {
      id: 'invalid-link-hy-public',
      prompt: 'Անվավեր կառավարման հղում',
      surface: 'public',
      locale: 'hy',
      expectedAction: 'explain_manage_booking_page',
      rescueReason: 'manage_booking_page',
      aspect: 'invalid_link',
    },
    {
      id: 'explain-manage-hy-customer',
      prompt: 'Բացատրիր ամրագրումը կառավարելու էջը',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_manage_booking_page',
      rescueReason: 'manage_booking_page',
      aspect: 'all',
    },
    {
      id: 'what-can-do-manage-ru-public',
      prompt: 'Что можно сделать на странице управления записью',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_manage_booking_page',
      rescueReason: 'manage_booking_page',
      aspect: 'capabilities',
    },
    {
      id: 'invalid-link-ru-customer',
      prompt: 'Недействительная ссылка управления',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'explain_manage_booking_page',
      rescueReason: 'manage_booking_page',
      aspect: 'invalid_link',
    },
    {
      id: 'guest-manage-ru-public',
      prompt: 'Как работает страница управления для гостя',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_manage_booking_page',
      rescueReason: 'manage_booking_page',
      aspect: 'guest_token',
    },
  ];
