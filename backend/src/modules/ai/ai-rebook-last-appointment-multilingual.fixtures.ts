import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type RebookLastAppointmentMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'rebook_last_appointment';
  rescueReason: 'rebook_last_appointment';
};

export const REBOOK_LAST_APPOINTMENT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian rebook last visit (customer mobile):
  - rebook_last_appointment: hy «վերամրագրել վերջին այցը», «նույնը ինչ անցած անգամ»; ru «повторно записаться на прошлый визит», «забронировать как в прошлый раз». One-tap repeat last completed visit — NOT book_appointment (new booking), NOT reschedule_my_booking.`;

export const REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS: readonly RebookLastAppointmentMultilingualScenario[] =
  [
    {
      id: 'rebook-last-hy-customer',
      locale: 'hy',
      prompt: 'Վերամրագրել վերջին այցը',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'same-as-last-hy-customer',
      locale: 'hy',
      prompt: 'Նույնը ինչ անցած անգամ',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'rebook-last-ru-customer',
      locale: 'ru',
      prompt: 'Повторно записаться на прошлый визит',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'same-as-last-ru-customer',
      locale: 'ru',
      prompt: 'Забронировать как в прошлый раз',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'book-same-again-ru-customer',
      locale: 'ru',
      prompt: 'Записаться снова как в прошлый раз',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
    {
      id: 'repeat-visit-hy-customer',
      locale: 'hy',
      prompt: 'Կրկնել վերջին amr-ը',
      surface: 'customer',
      expectedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
  ];
