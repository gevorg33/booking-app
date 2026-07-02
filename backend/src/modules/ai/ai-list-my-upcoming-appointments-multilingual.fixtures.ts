import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ListMyUpcomingAppointmentsScope } from './ai-list-my-upcoming-appointments.fixtures.js';

export type ListMyUpcomingAppointmentsMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'list_my_upcoming_appointments';
  scope: ListMyUpcomingAppointmentsScope;
  rescueReason: 'list_upcoming_appointments';
};

export const LIST_MY_UPCOMING_APPOINTMENTS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian upcoming appointment list (customer mobile):
  - list_my_upcoming_appointments: hy «ինչ է իմ հաջորդ ամրագրումը», «ամրագրումներ այս շաբաթ»; ru «когда моя следующая запись», «записи на этой неделе». READ filtered upcoming list — NOT confirm_my_booking_details, NOT list_my_appointments.`;

export const LIST_MY_UPCOMING_APPOINTMENTS_MULTILINGUAL_SCENARIOS: readonly ListMyUpcomingAppointmentsMultilingualScenario[] =
  [
    {
      id: 'next-appointment-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ է իմ հաջորդ ամրագրումը',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'next',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'this-week-hy-customer',
      locale: 'hy',
      prompt: 'Ամրագրումներ այս շաբաթ',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'this_week',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'upcoming-hy-customer',
      locale: 'hy',
      prompt: 'Ցույց տուր իմ առաջիկա այցերը',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'all_upcoming',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'next-appointment-ru-customer',
      locale: 'ru',
      prompt: 'Когда моя следующая запись?',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'next',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'this-week-ru-customer',
      locale: 'ru',
      prompt: 'Записи на этой неделе',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'this_week',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'upcoming-ru-customer',
      locale: 'ru',
      prompt: 'Покажи мои предстоящие визиты',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'all_upcoming',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'coming-up-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ upcoming այցեր ունեմ',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'all_upcoming',
      rescueReason: 'list_upcoming_appointments',
    },
    {
      id: 'next-visit-ru-customer',
      locale: 'ru',
      prompt: 'Какой у меня следующий визит',
      surface: 'customer',
      expectedAction: 'list_my_upcoming_appointments',
      scope: 'next',
      rescueReason: 'list_upcoming_appointments',
    },
  ];
