import type { BookTourNearestDeparturePromptFixture } from './ai-book-tour-nearest-departure.fixtures.js';
import {
  BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
  BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
} from './ai-book-tour-nearest-departure.fixtures.js';

export const BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_CLASSIFIER_RULES = `- book_tour_nearest_departure HY/RU: ամրագրել|պատվիր + տուր|էքսկուրս + ամենամոտ|ամենաառաջին|скорее|ближайш|раньше + N հոգի|человек. Compound catalog → pax → nearest departure slot.`;

export type BookTourNearestDepartureMultilingualScenario =
  BookTourNearestDeparturePromptFixture & {
    locale: 'hy' | 'ru';
  };

export const BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_SCENARIOS: readonly BookTourNearestDepartureMultilingualScenario[] =
  [
    {
      id: 'hy-wine-tour-earliest',
      prompt: 'Ամրագրիր Wine Country տուրը ամենաառաջին ամսաթվով 2 հոգու համար',
      surface: 'customer',
      locale: 'hy',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'Wine Country',
      paxCount: 2,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'hy-mountain-trek-soonest',
      prompt: 'Պատվիրիր mountain trek-ը ամենամոտ մեկնումը',
      surface: 'customer',
      locale: 'hy',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'mountain trek',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'hy-city-tour-nearest-public',
      prompt: 'Ամրագրիր City Tour տուրը ամենամոտ մեկնումով 4 հյուրի համար',
      surface: 'public',
      locale: 'hy',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'City Tour',
      paxCount: 4,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'ru-wine-tour-earliest',
      prompt: 'Забронируй Wine Country тур на ближайшую дату для 2 человек',
      surface: 'customer',
      locale: 'ru',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'Wine Country',
      paxCount: 2,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'ru-mountain-trek-soonest',
      prompt: 'Забронируй mountain trek на самый ранний выезд для 4 гостей',
      surface: 'customer',
      locale: 'ru',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_CUSTOMER_STEP_ACTIONS,
      serviceName: 'mountain trek',
      paxCount: 4,
      rescueReason: 'book_tour_nearest_departure_compound',
    },
    {
      id: 'ru-city-tour-nearest-public',
      prompt: 'Забронируй City Tour тур на ближайший выезд',
      surface: 'public',
      locale: 'ru',
      orderedActions: BOOK_TOUR_NEAREST_DEPARTURE_PUBLIC_STEP_ACTIONS,
      serviceName: 'City Tour',
      rescueReason: 'book_tour_nearest_departure_compound',
    },
  ];
