import {
  TOUR_GROUP_CHECKOUT_CUSTOMER_STEP_ACTIONS,
  TOUR_GROUP_CHECKOUT_PUBLIC_STEP_ACTIONS,
  type TourGroupCheckoutCompoundFixture,
} from './ai-tour-group-checkout-compound.fixtures.js';

export const TOUR_GROUP_CHECKOUT_MULTILINGUAL_CLASSIFIER_RULES = `- tour_group_checkout HY/RU: ամրագրել|պատվիր + տուր|էքսկուրս + N հոգի|человек + ամսաթիվ + եթե բավական տեղ|если хватит мест. Compound group pax → capacity check → book.`;

export const TOUR_GROUP_CHECKOUT_MULTILINGUAL_SCENARIOS: readonly (TourGroupCheckoutCompoundFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'hy-wine-tour-6-seats',
    prompt:
      'Գինու տուր 6 հոգու համար հաջորդ շաբաթ — ամրագրել եթե բավական տեղ կա',
    surface: 'customer',
    locale: 'hy',
    orderedActions: TOUR_GROUP_CHECKOUT_CUSTOMER_STEP_ACTIONS,
    serviceName: 'Գինու տուր',
    paxCount: 6,
  },
  {
    id: 'hy-city-tour-capacity-public',
    prompt: 'Քաղաքային տուր 8 հոգու համար — ամրագրել միայն եթե տեղեր կան',
    surface: 'public',
    locale: 'hy',
    orderedActions: TOUR_GROUP_CHECKOUT_PUBLIC_STEP_ACTIONS,
    serviceName: 'Քաղաքային տուր',
    paxCount: 8,
  },
  {
    id: 'ru-wine-tour-6-seats',
    prompt:
      'Винный тур на 6 человек в следующую субботу — забронировать если хватит мест',
    surface: 'customer',
    locale: 'ru',
    orderedActions: TOUR_GROUP_CHECKOUT_CUSTOMER_STEP_ACTIONS,
    serviceName: 'Винный тур',
    paxCount: 6,
  },
  {
    id: 'ru-mountain-trek-capacity-public',
    prompt: 'Горный трек на 4 человека — записаться только если есть места',
    surface: 'public',
    locale: 'ru',
    orderedActions: TOUR_GROUP_CHECKOUT_PUBLIC_STEP_ACTIONS,
    paxCount: 4,
  },
];
