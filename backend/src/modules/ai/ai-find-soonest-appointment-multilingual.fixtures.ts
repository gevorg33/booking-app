import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type FindSoonestAppointmentMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'find_soonest_appointment';
  rescueReason: 'soonest_appointment';
};

export const FIND_SOONEST_APPOINTMENT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian soonest appointment (customer + public booking):
  - find_soonest_appointment: hy «Ով է ամենաառաջին ազատ trim-ի համար», «Ամենամոտ slot massage-ի համար»; ru «Кто свободен раньше всех для стрижки», «Ближайший слот на массаж». READ soonest opening with bookingFirstAvailable=true. NOT book_nearest_slot|book_appointment.`;

export const FIND_SOONEST_APPOINTMENT_MULTILINGUAL_SCENARIOS: FindSoonestAppointmentMultilingualScenario[] =
  [
    {
      id: 'who-free-soonest-trim-hy-customer',
      locale: 'hy',
      prompt: 'Ով է ամենաառաջին ազատ trim-ի համար',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'nearest-slot-massage-ru-customer',
      locale: 'ru',
      prompt: 'Ближайший слот на массаж',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'who-free-soonest-hy-customer',
      locale: 'hy',
      prompt: 'Ով է ամենամոտ ազատ haircut-ի համար',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'earliest-appointment-ru-customer',
      locale: 'ru',
      prompt: 'Когда ближайшая запись на facial',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'who-free-soonest-trim-hy-public',
      locale: 'hy',
      prompt: 'Ով է ամենաառաջին ազատ trim-ի համար',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'nearest-slot-massage-ru-public',
      locale: 'ru',
      prompt: 'Ближайший слот на массаж',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'who-free-soonest-hy-public',
      locale: 'hy',
      prompt: 'Ով է ամենամոտ ազատ haircut-ի համար',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'earliest-appointment-ru-public',
      locale: 'ru',
      prompt: 'Когда ближайшая запись на facial',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'first-available-color-hy-customer',
      locale: 'hy',
      prompt: 'Ամենաառաջին slot color-ի համար',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'soonest-waxing-ru-customer',
      locale: 'ru',
      prompt: 'Скорейший слот на waxing',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'first-available-color-hy-public',
      locale: 'hy',
      prompt: 'Ամենաառաջին slot color-ի համար',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'soonest-waxing-ru-public',
      locale: 'ru',
      prompt: 'Скорейший слот на waxing',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
  ];
