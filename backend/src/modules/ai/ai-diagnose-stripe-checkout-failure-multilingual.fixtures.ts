import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type DiagnoseStripeCheckoutFailureMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'diagnose_stripe_checkout_failure';
  rescueReason: 'diagnose_stripe_checkout_failure';
};

export const DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian checkout payment failure (customer + public booking):
  - diagnose_stripe_checkout_failure: hy «վճարումը ձախողվեց», «քարտը մերժվեց checkout-ում»; ru «оплата не прошла», «карта отклонена на checkout», «платёж не прошёл — что делать». Consumer next steps — NOT resume_pending_payment, NOT explain_why_stripe_required.`;

export const DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_SCENARIOS: DiagnoseStripeCheckoutFailureMultilingualScenario[] =
  [
    {
      id: 'payment-failed-hy-customer',
      locale: 'hy',
      prompt: 'Վճարումը ձախողվեց — ի՞նչ անեմ հիմա',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
    },
    {
      id: 'card-declined-hy-customer',
      locale: 'hy',
      prompt: 'Քart-ը մերժվեց checkout-ում',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
    },
    {
      id: 'payment-failed-hy-public',
      locale: 'hy',
      prompt: 'Առցանց վճարումը չի ավարտվել',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
    },
    {
      id: 'payment-failed-ru-customer',
      locale: 'ru',
      prompt: 'Оплата не прошла — что делать?',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
    },
    {
      id: 'card-declined-ru-public',
      locale: 'ru',
      prompt: 'Карта отклонена на checkout',
      surface: 'public',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
    },
    {
      id: 'stripe-failed-ru-customer',
      locale: 'ru',
      prompt: 'Платёж через Stripe не прошёл',
      surface: 'customer',
      expectedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
    },
  ];
