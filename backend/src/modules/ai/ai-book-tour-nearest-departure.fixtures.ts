import type { CommandSurface } from './ai-command-registry.types.js';

export const BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS = [
  'explain_tour_booking',
  'explain_tour_day_slots',
  'book_nearest_slot',
] as const;

export const BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS = [
  'explain_tour_booking',
  'explain_tour_day_slots',
  'book_appointment',
] as const;

export type BookTourNearestDepartureCustomerStepAction =
  (typeof BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS)[number];

export type BookTourNearestDeparturePublicStepAction =
  (typeof BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS)[number];

export type BookTourNearestDeparturePromptFixture = {
  id: string;
  prompt: string;
  surface: Extract<CommandSurface, 'customer' | 'public'>;
  orderedActions:
    | typeof BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS
    | typeof BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS;
  serviceName?: string;
  paxCount?: number;
  rescueReason: 'book_tour_nearest_departure_compound';
};

export const BOOK_TOUR_NEAREST_DEPARTURE_CLASSIFIER_RULES = `- book_tour_nearest_departure (compound): customer/public multi-step tour booking with earliest/nearest departure — decomposes to explain_tour_booking (catalog) → explain_tour_day_slots (pax + remaining spots) → book_nearest_slot|book_appointment with bookingFirstAvailable=true and paxCount when stated. Triggers: book|reserve|schedule + tour|trek|excursion + earliest|nearest|soonest|first available|ASAP + optional N people|guests|pax. Example: "Book the wine tour earliest date for 2 people", "Reserve mountain trek soonest departure for 4 guests". NOT explain_tour_booking alone (read catalog metadata), NOT explain_tour_day_slots alone (read slot display), NOT diagnose_tour_capacity (checkout rejection), NOT book_package_with_nearest_slot (packages), NOT book_nearest_slot without tour topic (generic service).`;

export const CUSTOMER_BOOK_TOUR_NEAREST_DEPARTURE_CLASSIFIER_RULES =
  BOOK_TOUR_NEAREST_DEPARTURE_CLASSIFIER_RULES;

export const PUBLIC_BOOK_TOUR_NEAREST_DEPARTURE_CLASSIFIER_RULES =
  BOOK_TOUR_NEAREST_DEPARTURE_CLASSIFIER_RULES;

export const BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS: readonly BookTourNearestDeparturePromptFixture[] =
  [
    {
      id: 'wine-tour-earliest-2p-customer',
      prompt: 'Book the wine tour earliest date for 2 people',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'wine tour',
      paxCount: 2,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'mountain-trek-soonest-customer',
      prompt: 'Reserve the mountain trek for the soonest departure',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'mountain trek',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'city-tour-nearest-4p-customer',
      prompt: 'Book City Tour nearest available departure for 4 guests',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'City Tour',
      paxCount: 4,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'sunset-hike-first-available-customer',
      prompt: 'Schedule Sunset Hike tour first available date for me',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'Sunset Hike',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'wine-country-asap-3p-customer',
      prompt: 'Book Wine Country tour ASAP for 3 people',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'Wine Country',
      paxCount: 3,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'quoted-tour-nearest-customer',
      prompt: 'Book the "Mountain Trek" tour nearest departure for 2 pax',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'Mountain Trek',
      paxCount: 2,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'garni-temple-earliest-customer',
      prompt: 'Get the Garni Temple tour earliest opening for 5 guests',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'Garni Temple',
      paxCount: 5,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'trek-next-available-customer',
      prompt: 'Book 3-Day Mountain Trek next available departure',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: '3-Day Mountain Trek',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'excursion-soonest-customer',
      prompt: 'Reserve the city excursion soonest slot for 2 travelers',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'city excursion',
      paxCount: 2,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'hike-earliest-customer',
      prompt: 'Book Sunset Hike earliest date soonest departure',
      surface: 'customer',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'Sunset Hike',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'wine-tour-earliest-2p-public',
      prompt: 'Book the wine tour earliest date for 2 people',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'wine tour',
      paxCount: 2,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'mountain-trek-soonest-public',
      prompt: 'Reserve mountain trek soonest departure for 4 people',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'mountain trek',
      paxCount: 4,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'city-tour-nearest-public',
      prompt: 'Book City Tour nearest available departure',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'City Tour',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'wine-country-asap-public',
      prompt: 'Book Wine Country tour ASAP for 3 guests',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'Wine Country',
      paxCount: 3,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'trek-first-available-public',
      prompt: 'Schedule 3-Day Mountain Trek first available date',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: '3-Day Mountain Trek',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'sunset-hike-nearest-public',
      prompt: 'Get Sunset Hike tour nearest departure for 2 pax',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'Sunset Hike',
      paxCount: 2,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'garni-earliest-public',
      prompt: 'Book Garni Temple tour earliest opening',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'Garni Temple',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'excursion-soonest-public',
      prompt: 'Reserve city excursion soonest departure',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'city excursion',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'hike-next-available-public',
      prompt: 'Book Sunset Hike next available tour date for 6 people',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'Sunset Hike',
      paxCount: 6,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'trek-asap-public',
      prompt: 'Book mountain trek ASAP for my group',
      surface: 'public',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'mountain trek',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
  ];

export const BOOK_TOUR_NEAREST_DEPARTURE_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-book-nearest-slot',
    prompt: 'Book the wine tour earliest date for 2 people',
    surface: 'customer' as const,
    misclassifiedAction: 'book_nearest_slot',
  },
  {
    id: 'misclassified-explain-tour-booking',
    prompt: 'Reserve mountain trek soonest departure for 4 people',
    surface: 'customer' as const,
    misclassifiedAction: 'explain_tour_booking',
  },
  {
    id: 'misclassified-explain-day-slots',
    prompt: 'Book City Tour nearest available departure for 4 guests',
    surface: 'customer' as const,
    misclassifiedAction: 'explain_tour_day_slots',
  },
  {
    id: 'misclassified-public-book',
    prompt: 'Book the wine tour earliest date for 2 people',
    surface: 'public' as const,
    misclassifiedAction: 'book_appointment',
  },
] as const;
