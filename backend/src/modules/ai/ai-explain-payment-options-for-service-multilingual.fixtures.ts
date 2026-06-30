import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainPaymentOptionsMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_payment_options_for_service';
  rescueReason: 'service_payment_options';
};

export const EXPLAIN_PAYMENT_OPTIONS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian service payment options (customer + public booking):
  - explain_payment_options_for_service: hy «Վճարե՞մ առցանց color-ի համար», «Կարո՞ղ եմ կանխիկ massage-ի համար»; ru «Плачу ли онлайн за окрашивание», «Могу ли я наличными за массаж». Per-service cash vs online from prepaymentMode + acceptCashPayments. NOT explain_why_stripe_required (why).`;

export const EXPLAIN_PAYMENT_OPTIONS_MULTILINGUAL_SCENARIOS: ExplainPaymentOptionsMultilingualScenario[] =
  [
    {
      id: 'pay-online-color-hy-customer',
      locale: 'hy',
      prompt: 'Վճարե՞մ առցանց color-ի համար',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-color-ru-customer',
      locale: 'ru',
      prompt: 'Плачу ли онлайн за окрашивание',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'cash-massage-hy-customer',
      locale: 'hy',
      prompt: 'Կարո՞ղ եմ կանխիկ massage-ի համար',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'cash-massage-ru-customer',
      locale: 'ru',
      prompt: 'Могу ли я наличными за массаж',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-this-service-hy-customer',
      locale: 'hy',
      prompt: 'Պետք է առցանց վճարեմ այս ծառայության համար',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-this-service-ru-customer',
      locale: 'ru',
      prompt: 'Нужно ли платить онлайн за эту услугу',
      surface: 'customer',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-color-hy-public',
      locale: 'hy',
      prompt: 'Վճարե՞մ առցանց color-ի համար',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-color-ru-public',
      locale: 'ru',
      prompt: 'Плачу ли онлайн за окрашивание',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'cash-massage-hy-public',
      locale: 'hy',
      prompt: 'Կարո՞ղ եմ կանխիկ massage-ի համար',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'cash-massage-ru-public',
      locale: 'ru',
      prompt: 'Могу ли я наличными за массаж',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-this-service-hy-public',
      locale: 'hy',
      prompt: 'Պետք է առցանց վճարեմ այս ծառայության համար',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
    {
      id: 'pay-online-this-service-ru-public',
      locale: 'ru',
      prompt: 'Нужно ли платить онлайн за эту услугу',
      surface: 'public',
      expectedAction: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    },
  ];
