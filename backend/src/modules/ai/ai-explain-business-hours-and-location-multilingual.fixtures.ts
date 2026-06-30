import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { BusinessHoursLocationAspect } from './ai-explain-business-hours-and-location.util.js';

export type ExplainBusinessHoursAndLocationMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_business_hours_and_location';
  aspect?: BusinessHoursLocationAspect;
  weekday?: string;
  rescueReason: 'business_hours_location';
};

export const EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian hours and location (customer + public booking):
  - explain_business_hours_and_location: hy «Երբ եք բաց շաբաթ օրը», «Որտեղ եք գտնվում»; ru «Когда вы открыты в субботу», «Где вы находитесь». Hours, address, map link, parking copy. NOT business_info.`;

export const EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_SCENARIOS: ExplainBusinessHoursAndLocationMultilingualScenario[] =
  [
    {
      id: 'open-saturday-hy-customer',
      locale: 'hy',
      prompt: 'Երբ եք բաց շաբաթ օրը',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      weekday: 'saturday',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'where-located-ru-customer',
      locale: 'ru',
      prompt: 'Где вы находитесь?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'opening-hours-hy-customer',
      locale: 'hy',
      prompt: 'Որքան են ձեր աշխատանքային ժամերը',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'parking-ru-customer',
      locale: 'ru',
      prompt: 'Есть ли парковка?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'parking',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'address-hy-customer',
      locale: 'hy',
      prompt: 'Որտեղ է հասցեն',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'close-time-ru-customer',
      locale: 'ru',
      prompt: 'Во сколько вы закрываетесь?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'open-saturday-hy-public',
      locale: 'hy',
      prompt: 'Երբ եք բաց շաբաթ օրը',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      weekday: 'saturday',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'where-located-ru-public',
      locale: 'ru',
      prompt: 'Где вы находитесь?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'opening-hours-hy-public',
      locale: 'hy',
      prompt: 'Որքան են ձեր աշխատանքային ժամերը',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'parking-ru-public',
      locale: 'ru',
      prompt: 'Есть ли парковка?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'parking',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'address-hy-public',
      locale: 'hy',
      prompt: 'Որտեղ է հասցեն',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'close-time-ru-public',
      locale: 'ru',
      prompt: 'Во сколько вы закрываетесь?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      rescueReason: 'business_hours_location',
    },
  ];
