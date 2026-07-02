import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { GetDirectionsToSalonAspect } from './ai-get-directions-to-salon.fixtures.js';

export type GetDirectionsToSalonMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'get_directions_to_salon';
  aspect: GetDirectionsToSalonAspect;
  rescueReason: 'salon_directions';
};

export const GET_DIRECTIONS_TO_SALON_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian salon directions (customer + public booking):
  - get_directions_to_salon: hy «Ուղղություն դեպի սրահ», «Որտեղ կայանեմ»; ru «Как добраться до салона», «Где припарковаться». Directions URL, map link, address, parking copy. NOT explain_business_hours_and_location.`;

export const GET_DIRECTIONS_TO_SALON_MULTILINGUAL_SCENARIOS: GetDirectionsToSalonMultilingualScenario[] =
  [
    {
      id: 'directions-hy-customer',
      locale: 'hy',
      prompt: 'Ուղղություն դեպի սրահ',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'parking-hy-customer',
      locale: 'hy',
      prompt: 'Որտեղ կայանեմ մոտակայքում',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
    {
      id: 'directions-ru-customer',
      locale: 'ru',
      prompt: 'Как добраться до салона?',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'parking-ru-customer',
      locale: 'ru',
      prompt: 'Где припарковаться рядом?',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
    {
      id: 'directions-hy-public',
      locale: 'hy',
      prompt: 'Ուղղություն դեպի սրահ',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'parking-hy-public',
      locale: 'hy',
      prompt: 'Որտեղ կայանեմ',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
    {
      id: 'directions-ru-public',
      locale: 'ru',
      prompt: 'Как добраться до салона?',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'parking-ru-public',
      locale: 'ru',
      prompt: 'Где парковаться для визита?',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
  ];
