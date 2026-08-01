import type { CommandSurface } from './ai-command-registry.types.js';

/** pipe-1.13.1 / acc-3.14 — paraphrase corpus for first-available booking meaning. */
export const BOOKING_FIRST_AVAILABLE_SEMANTIC_PIPE_MARKER = 'pipe-1.13.1';

export type BookingFirstAvailableSemanticScenario = {
  id: string;
  prompt: string;
  surface?: CommandSurface;
  mustDetect: boolean;
  expectedAllProviders?: boolean;
};

export const BOOKING_FIRST_AVAILABLE_POSITIVE_PROMPTS: BookingFirstAvailableSemanticScenario[] =
  [
    {
      id: 'en-soonest-slot',
      prompt: 'book the soonest slot for massage',
      mustDetect: true,
    },
    {
      id: 'en-next-available',
      prompt: 'schedule the next available appointment',
      mustDetect: true,
    },
    {
      id: 'en-reserve-nearest',
      prompt: 'reserve the nearest slot',
      mustDetect: true,
    },
    {
      id: 'en-earliest-slot',
      prompt: 'get the earliest slot',
      mustDetect: true,
    },
    {
      id: 'en-grab-opening',
      prompt: 'grab the nearest opening',
      mustDetect: true,
    },
    {
      id: 'en-first-available-explicit',
      prompt: 'Book first available permanent lashes tomorrow evening',
      mustDetect: true,
    },
    {
      id: 'en-nearest-available-slot',
      prompt: 'Book the nearest available slot for massage tomorrow',
      mustDetect: true,
    },
    {
      id: 'en-asap-booking',
      prompt: 'who has availability tomorrow evening for massage and book ASAP',
      mustDetect: true,
    },
    {
      id: 'en-check-book-compound',
      prompt:
        "who's free tomorrow evening for permanent lashes, book the nearest slot",
      mustDetect: true,
    },
    {
      id: 'en-reschedule-nearest-free',
      prompt:
        'Move Jujos appointment on June 10 2027 from 16-17 to june 11 2027 nearest free time',
      mustDetect: true,
    },
    {
      id: 'hy-nearest-slot',
      prompt: 'Վաղը մասաժըի համար ամենամոտ ազատ ժամը գրանցիր',
      mustDetect: true,
    },
    {
      id: 'ru-nearest-slot',
      prompt: 'Запиши на ближайшее свободное время на массаж завтра',
      mustDetect: true,
    },
    {
      id: 'ru-or-book',
      prompt: 'Стрижка завтра вечером или в субботу — забронируй',
      mustDetect: true,
    },
    {
      id: 'en-create-booking-first-available-any-provider',
      prompt:
        'Create a booking for the first available massage slot on Monday for any provider',
      mustDetect: true,
      expectedAllProviders: true,
    },
    {
      id: 'public-asap',
      prompt: 'Need an appointment ASAP on any available slot',
      surface: 'public',
      mustDetect: true,
    },
  ];

export const BOOKING_FIRST_AVAILABLE_NEGATIVE_PROMPTS: BookingFirstAvailableSemanticScenario[] =
  [
    {
      id: 'en-fixed-time-booking',
      prompt: 'Book Gevorg for massage tomorrow at 9:00',
      mustDetect: false,
    },
    {
      id: 'en-check-only',
      prompt: 'who is free tomorrow evening for massage',
      mustDetect: false,
    },
    {
      id: 'ru-fixed-time-booking',
      prompt: 'Запиши массаж на Геворга завтра в 10:00',
      mustDetect: false,
    },
  ];

export const BOOKING_FIRST_AVAILABLE_SEMANTIC_SCENARIOS: BookingFirstAvailableSemanticScenario[] =
  [
    ...BOOKING_FIRST_AVAILABLE_POSITIVE_PROMPTS,
    ...BOOKING_FIRST_AVAILABLE_NEGATIVE_PROMPTS,
  ];
