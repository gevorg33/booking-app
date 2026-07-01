export type ConfirmMyBookingDetailsMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'confirm_my_booking_details';
  rescueReason: 'confirm_booking_details';
  paramsPartial?: { aspect: string };
};

export const CONFIRM_MY_BOOKING_DETAILS_MULTILINGUAL_CLASSIFIER_RULES = `
  - confirm_my_booking_details: hy «ինչ ժամի է իմ ամրագրում», «ամփոփիր իմ ամրագրում», «ովի հետ է ամրագրում»; ru «когда моя запись», «подтверди детали брони», «какая у меня услуга». READ booking summary — NOT list_my_appointments.`;

export const CONFIRM_MY_BOOKING_DETAILS_MULTILINGUAL_SCENARIOS: readonly ConfirmMyBookingDetailsMultilingualScenario[] =
  [
    {
      id: 'what-time-hy-customer',
      prompt: 'Ինչ ժամի է իմ ամրագրումը?',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'confirm_my_booking_details',
      rescueReason: 'confirm_booking_details',
      paramsPartial: { aspect: 'time' },
    },
    {
      id: 'summarize-hy-customer',
      prompt: 'Ամփոփիր իմ ամրագրումը',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'confirm_my_booking_details',
      rescueReason: 'confirm_booking_details',
      paramsPartial: { aspect: 'all' },
    },
    {
      id: 'provider-hy-public',
      prompt: 'Ովի հետ է ամրագրումս?',
      surface: 'public',
      locale: 'hy',
      expectedAction: 'confirm_my_booking_details',
      rescueReason: 'confirm_booking_details',
      paramsPartial: { aspect: 'provider' },
    },
    {
      id: 'what-time-ru-customer',
      prompt: 'Когда моя запись?',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'confirm_my_booking_details',
      rescueReason: 'confirm_booking_details',
      paramsPartial: { aspect: 'time' },
    },
    {
      id: 'summarize-ru-public',
      prompt: 'Подтверди детали моей брони',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'confirm_my_booking_details',
      rescueReason: 'confirm_booking_details',
      paramsPartial: { aspect: 'all' },
    },
    {
      id: 'service-ru-customer',
      prompt: 'Какая услуга у меня забронирована?',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'confirm_my_booking_details',
      rescueReason: 'confirm_booking_details',
      paramsPartial: { aspect: 'service' },
    },
    {
      id: 'status-ru-public',
      prompt: 'Моя запись подтверждена?',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'confirm_my_booking_details',
      rescueReason: 'confirm_booking_details',
      paramsPartial: { aspect: 'status' },
    },
    {
      id: 'just-booked-hy-public',
      prompt: 'Ի՞նչ ամրագրում եմ արել հենց հիմա',
      surface: 'public',
      locale: 'hy',
      expectedAction: 'confirm_my_booking_details',
      rescueReason: 'confirm_booking_details',
      paramsPartial: { aspect: 'all' },
    },
  ];
