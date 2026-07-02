export type ExplainMultiServicePaymentReturnMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer';
  locale: 'hy' | 'ru';
  expectedAction: 'explain_multi_service_payment_return';
  rescueReason: 'explain_multi_service_payment_return';
};

export const EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_CLASSIFIER_RULES = `
  - explain_multi_service_payment_return: hy «վճարեցի բայց ամրագրումը հաստատված չէ», «վերադարձ Stripe spa day-ից»; ru «оплатил но запись не подтверждена», «вернулся из Stripe spa day». Multi-service checkout return — NOT diagnose_stripe_checkout_failure.`;

export const EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_SCENARIOS: readonly ExplainMultiServicePaymentReturnMultilingualScenario[] =
  [
    {
      id: 'hy-paid-not-confirmed-customer',
      prompt: 'Վճարեցի բայց ամրագրումը հաստատված չէ',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
    },
    {
      id: 'hy-return-stripe-spa-customer',
      prompt: 'Վերադարձ Stripe spa day-ից',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
    },
    {
      id: 'hy-finished-browser-customer',
      prompt: 'Բրաուզերում վճարումն ավարտեցի — հիմա ինչ անեմ',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
    },
    {
      id: 'ru-paid-not-confirmed-customer',
      prompt: 'Оплатил, но запись не подтверждена',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
    },
    {
      id: 'ru-return-stripe-spa-customer',
      prompt: 'Вернулся из Stripe после spa day',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
    },
    {
      id: 'ru-payment-through-not-booked-customer',
      prompt: 'Оплата прошла, но записи не созданы',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'explain_multi_service_payment_return',
      rescueReason: 'explain_multi_service_payment_return',
    },
  ] as const;
