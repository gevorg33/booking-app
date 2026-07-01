import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { SignInAfterBookingAspect } from './ai-sign-in-after-booking.fixtures.js';

export type SignInAfterBookingMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'sign_in_after_booking';
  rescueReason: 'post_booking_sign_in';
  aspect?: SignInAfterBookingAspect;
};

export const SIGN_IN_AFTER_BOOKING_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian post-booking sign-in explain (customer mobile):
  - sign_in_after_booking: hy «պահպանել այս ամրագրումը հաշվում», «մուտք Google-ով ամրագրումից հետո»; ru «сохранить запись в аккаунте», «войти через Google после записи». PostBookingSignInPrompt — NOT explain_guest_checkout_fields checkout fields.`;

export const SIGN_IN_AFTER_BOOKING_MULTILINGUAL_SCENARIOS: readonly SignInAfterBookingMultilingualScenario[] =
  [
    {
      id: 'save-account-hy-customer',
      locale: 'hy',
      prompt: 'Պահպանել այս ամրագրումը իմ հաշվում',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'save_to_account',
    },
    {
      id: 'google-after-hy-customer',
      locale: 'hy',
      prompt: 'Մուտք Google-ով ամրագրումից հետո',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'provider_sign_in',
    },
    {
      id: 'maybe-later-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ է լինում, եթե սեղմեմ Ավելի ուշ',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'skip_dismiss',
    },
    {
      id: 'save-account-ru-customer',
      locale: 'ru',
      prompt: 'Сохранить эту запись в моём аккаунте',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'save_to_account',
    },
    {
      id: 'google-after-ru-customer',
      locale: 'ru',
      prompt: 'Войти через Google после записи',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'provider_sign_in',
    },
    {
      id: 'merge-rules-ru-customer',
      locale: 'ru',
      prompt: 'Объединится ли гостевая запись после входа?',
      surface: 'customer',
      expectedAction: 'sign_in_after_booking',
      rescueReason: 'post_booking_sign_in',
      aspect: 'merge_rules',
    },
  ];
