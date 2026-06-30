import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type FilterServicesNoPrepaymentMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'filter_services_no_prepayment';
  serviceCategory?: string;
  rescueReason: 'no_prepayment_services';
};

export const FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian no-prepayment service browse (customer + public booking):
  - filter_services_no_prepayment: hy «Ինչ կարող եմ ամրագրել առանց օնլայն վճարման», «Ցույց տուր ծառայություններ առանց նախավճարի»; ru «Что можно забронировать без оплаты онлайн», «Покажи услуги без предоплаты». prepaymentMode=none — NOT list_services.`;

export const FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_SCENARIOS: FilterServicesNoPrepaymentMultilingualScenario[] =
  [
    {
      id: 'without-paying-online-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ կարող եմ ամրագրել առանց օնլայն վճարման',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'show-no-prepayment-hy-customer',
      locale: 'hy',
      prompt: 'Ցույց տուր ծառայություններ առանց նախավճարի',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'without-paying-online-ru-customer',
      locale: 'ru',
      prompt: 'Что можно забронировать без оплаты онлайн?',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'show-no-prepayment-ru-customer',
      locale: 'ru',
      prompt: 'Покажи услуги без предоплаты',
      surface: 'customer',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'without-paying-online-hy-public',
      locale: 'hy',
      prompt: 'Ինչ կարող եմ ամրագրել առանց օնլայն վճարման',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'show-no-prepayment-hy-public',
      locale: 'hy',
      prompt: 'Ցույց տուր ծառայություններ առանց նախավճարի',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'without-paying-online-ru-public',
      locale: 'ru',
      prompt: 'Что можно забронировать без оплаты онлайн?',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
    {
      id: 'show-no-prepayment-ru-public',
      locale: 'ru',
      prompt: 'Покажи услуги без предоплаты',
      surface: 'public',
      expectedAction: 'filter_services_no_prepayment',
      rescueReason: 'no_prepayment_services',
    },
  ];
