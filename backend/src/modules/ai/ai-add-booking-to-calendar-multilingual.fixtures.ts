export type AddBookingToCalendarMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'add_booking_to_calendar';
  rescueReason: 'add_booking_calendar';
  paramsPartial?: { format: string };
};

export const ADD_BOOKING_TO_CALENDAR_MULTILINGUAL_CLASSIFIER_RULES = `
  - add_booking_to_calendar: hy «ավելացրի՛ր օրացույցում», «ուղարկիր ICS ֆայլ»; ru «добавь в календарь», «пришли ICS файл», «добавь запись в google calendar». READ calendar links — NOT confirm_my_booking_details, NOT get_manage_link.`;

export const ADD_BOOKING_TO_CALENDAR_MULTILINGUAL_SCENARIOS: readonly AddBookingToCalendarMultilingualScenario[] =
  [
    {
      id: 'add-calendar-hy-customer',
      prompt: 'Ավելացրի՛ր իմ ամրագրումը օրացույցում',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'add_booking_to_calendar',
      rescueReason: 'add_booking_calendar',
      paramsPartial: { format: 'all' },
    },
    {
      id: 'ics-hy-public',
      prompt: 'Ուղարկիր ICS ֆայլը իմ ամրագրման համար',
      surface: 'public',
      locale: 'hy',
      expectedAction: 'add_booking_to_calendar',
      rescueReason: 'add_booking_calendar',
      paramsPartial: { format: 'ics' },
    },
    {
      id: 'add-calendar-ru-customer',
      prompt: 'Добавь мою запись в календарь',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'add_booking_to_calendar',
      rescueReason: 'add_booking_calendar',
      paramsPartial: { format: 'all' },
    },
    {
      id: 'google-calendar-ru-public',
      prompt: 'Добавь бронь в Google Calendar',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'add_booking_to_calendar',
      rescueReason: 'add_booking_calendar',
      paramsPartial: { format: 'google' },
    },
    {
      id: 'ics-ru-customer',
      prompt: 'Пришли ICS файл для моей записи',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'add_booking_to_calendar',
      rescueReason: 'add_booking_calendar',
      paramsPartial: { format: 'ics' },
    },
    {
      id: 'outlook-ru-public',
      prompt: 'Добавь запись в Outlook',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'add_booking_to_calendar',
      rescueReason: 'add_booking_calendar',
      paramsPartial: { format: 'outlook' },
    },
    {
      id: 'phone-calendar-hy-public',
      prompt: 'Պահպանի՛ր իմ ամրագրումը հեռախոսի օրացույցում',
      surface: 'public',
      locale: 'hy',
      expectedAction: 'add_booking_to_calendar',
      rescueReason: 'add_booking_calendar',
      paramsPartial: { format: 'all' },
    },
    {
      id: 'save-calendar-ru-customer',
      prompt: 'Сохрани запись в календарь телефона',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'add_booking_to_calendar',
      rescueReason: 'add_booking_calendar',
      paramsPartial: { format: 'all' },
    },
  ];
