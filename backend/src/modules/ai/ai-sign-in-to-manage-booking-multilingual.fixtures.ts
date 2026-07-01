import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { SignInToManageBookingAspect } from './ai-sign-in-to-manage-booking.fixtures.js';

export type SignInToManageBookingMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'sign_in_to_manage_booking';
  rescueReason: 'sign_in_to_manage_booking';
  aspect?: SignInToManageBookingAspect;
};

export const SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian manage-page sign-in hints (customer app + public manage page):
  - sign_in_to_manage_booking: hy «մուտք գործել ամրագրումը փոխելու համար», «կառավարման հղումը ասում է մուտք»; ru «войти чтобы изменить запись», «ссылка управления просит войти». ManageBookingPage hint — NOT get_manage_link (resend URL).`;

export const SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS: SignInToManageBookingMultilingualScenario[] =
  [
    {
      id: 'sign-in-change-hy-customer',
      locale: 'hy',
      prompt: 'Մուտք գործել ամրագրումը փոխելու համար',
      surface: 'customer',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'manage-link-sign-in-hy-public',
      locale: 'hy',
      prompt: 'Կառավարման հղումը ասում է մուտք գործել',
      surface: 'public',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'sign-in-change-ru-customer',
      locale: 'ru',
      prompt: 'Войти чтобы изменить запись',
      surface: 'customer',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'manage-link-sign-in-ru-public',
      locale: 'ru',
      prompt: 'Ссылка управления просит войти в аккаунт',
      surface: 'public',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'manage_hint',
    },
    {
      id: 'invalid-link-ru-public',
      locale: 'ru',
      prompt: 'Ссылка для управления недействительна — войти в аккаунт?',
      surface: 'public',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'invalid_link',
    },
    {
      id: 'how-sign-in-hy-customer',
      locale: 'hy',
      prompt: 'Ինչպես մուտք գործել ամրագրումը կառավարելու համար',
      surface: 'customer',
      expectedAction: 'sign_in_to_manage_booking',
      rescueReason: 'sign_in_to_manage_booking',
      aspect: 'how_to',
    },
  ];
