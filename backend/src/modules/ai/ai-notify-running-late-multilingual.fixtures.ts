import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type NotifyRunningLateMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'notify_running_late';
  rescueReason: 'notify_running_late';
  minutesLate?: number;
};

export const NOTIFY_RUNNING_LATE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian customer running late (customer mobile):
  - notify_running_late: hy «ուշ եմ 15 րոպե», «տեղեկացրեք սalon-ին որ ուշացող եմ»; ru «я опаздываю на 15 минут», «сообщите салону что опаздываю». Customer self late alert — NOT mark_running_late (provider).`;

export const NOTIFY_RUNNING_LATE_MULTILINGUAL_SCENARIOS: readonly NotifyRunningLateMultilingualScenario[] =
  [
    {
      id: 'minutes-late-hy-customer',
      locale: 'hy',
      prompt: 'Ուշ եմ 15 րոպե',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 15,
    },
    {
      id: 'notify-salon-hy-customer',
      locale: 'hy',
      prompt: 'Տեղեկացրեք salon-ին որ ուշացող եմ',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
    },
    {
      id: 'minutes-late-ru-customer',
      locale: 'ru',
      prompt: 'Я опаздываю на 15 минут',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 15,
    },
    {
      id: 'notify-salon-ru-customer',
      locale: 'ru',
      prompt: 'Сообщите салону, что я опаздываю на запись',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
    },
    {
      id: 'running-late-my-appointment-hy-customer',
      locale: 'hy',
      prompt: 'Ուշացել եմ իմ appointment-ի համար',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
    },
    {
      id: 'running-late-my-appointment-ru-customer',
      locale: 'ru',
      prompt: 'Опаздываю на мою запись',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
    },
    {
      id: 'ten-min-late-hy-customer',
      locale: 'hy',
      prompt: '10 րոպե ուշ կգամ booking-ի',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 10,
    },
    {
      id: 'ten-min-late-ru-customer',
      locale: 'ru',
      prompt: 'Буду на 10 минут позже на мою запись',
      surface: 'customer',
      expectedAction: 'notify_running_late',
      rescueReason: 'notify_running_late',
      minutesLate: 10,
    },
  ];
