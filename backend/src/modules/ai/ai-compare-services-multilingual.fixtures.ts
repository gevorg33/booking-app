import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type CompareServicesMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'compare_services';
  serviceNames: readonly [string, string];
  rescueReason: 'service_compare';
};

export const COMPARE_SERVICES_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian service comparison (customer + public booking):
  - compare_services: hy «Համեմատիր haircut-ը և blowdry-ը», «Որն է ավելի էժան manicure-ը թե pedicure-ը»; ru «Сравни стрижку и укладку по цене», «Что дешевле — маникюр или педикюр». Set serviceNames (2+). NOT explain_service_price.`;

export const COMPARE_SERVICES_MULTILINGUAL_SCENARIOS: CompareServicesMultilingualScenario[] =
  [
    {
      id: 'compare-haircut-blowdry-hy-customer',
      locale: 'hy',
      prompt: 'Համեմատիր haircut-ը և blowdry-ը գնով և տևողությամբ',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['haircut', 'blowdry'],
      rescueReason: 'service_compare',
    },
    {
      id: 'compare-haircut-blowdry-ru-customer',
      locale: 'ru',
      prompt: 'Сравни стрижку и укладку по цене и длительности',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['стрижку', 'укладку'],
      rescueReason: 'service_compare',
    },
    {
      id: 'cheaper-manicure-pedicure-hy-customer',
      locale: 'hy',
      prompt: 'Որն է ավելի էժան manicure-ը թե pedicure-ը',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['manicure', 'pedicure'],
      rescueReason: 'service_compare',
    },
    {
      id: 'cheaper-manicure-pedicure-ru-customer',
      locale: 'ru',
      prompt: 'Что дешевле — маникюр или педикюр?',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['маникюр', 'педикюр'],
      rescueReason: 'service_compare',
    },
    {
      id: 'massage-facial-hy-customer',
      locale: 'hy',
      prompt: 'Massage vs facial տևողություն',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'service_compare',
    },
    {
      id: 'massage-facial-ru-customer',
      locale: 'ru',
      prompt: 'Сравни massage и facial по цене',
      surface: 'customer',
      expectedAction: 'compare_services',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'service_compare',
    },
    {
      id: 'compare-haircut-blowdry-hy-public',
      locale: 'hy',
      prompt: 'Համեմատիր haircut-ը և blowdry-ը գնով և տևողությամբ',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['haircut', 'blowdry'],
      rescueReason: 'service_compare',
    },
    {
      id: 'compare-haircut-blowdry-ru-public',
      locale: 'ru',
      prompt: 'Сравни стрижку и укладку по цене и длительности',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['стрижку', 'укладку'],
      rescueReason: 'service_compare',
    },
    {
      id: 'cheaper-manicure-pedicure-hy-public',
      locale: 'hy',
      prompt: 'Որն է ավելի էժան manicure-ը թե pedicure-ը',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['manicure', 'pedicure'],
      rescueReason: 'service_compare',
    },
    {
      id: 'cheaper-manicure-pedicure-ru-public',
      locale: 'ru',
      prompt: 'Что дешевле — маникюр или педикюр?',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['маникюр', 'педикюр'],
      rescueReason: 'service_compare',
    },
    {
      id: 'massage-facial-hy-public',
      locale: 'hy',
      prompt: 'Massage vs facial տևողություն',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'service_compare',
    },
    {
      id: 'massage-facial-ru-public',
      locale: 'ru',
      prompt: 'Сравни massage и facial по цене',
      surface: 'public',
      expectedAction: 'compare_services',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'service_compare',
    },
  ];
