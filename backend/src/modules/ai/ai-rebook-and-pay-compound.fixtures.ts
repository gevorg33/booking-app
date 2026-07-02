import type { RebookAndPayPaymentAction } from './ai-rebook-and-pay-compound.util.js';

export type RebookAndPayCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  expectedParams?: Record<string, unknown>;
  paymentAction?: RebookAndPayPaymentAction;
  misclassifiedAction?: string;
};

export const REBOOK_AND_PAY_CLASSIFIER_RULES = `- rebook_and_pay (compound): customer multi-step one-tap rebook + checkout payment. Decomposes to rebook_last_appointment → pay_online or choose_payment_method. Use for "Rebook my last visit and pay with card", "Book the same as last time and pay online", "Repeat last appointment then choose payment method". Requires rebook-last-visit cue AND payment cue (pay online, pay with card, choose payment). NOT rebook_last_appointment alone when user also asks to pay; NOT book_with_gift_card; NOT book_nearest_slot (new booking).`;

export const REBOOK_AND_PAY_CUSTOMER_PROMPTS: readonly RebookAndPayCompoundFixture[] =
  [
    {
      id: 'rebook-pay-last-visit-card-en',
      prompt: 'Rebook my last visit and pay with card',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-same-as-last-online-en',
      prompt: 'Book the same as last time and pay online',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-repeat-last-card-en',
      prompt: 'Repeat my last visit and pay with card',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-last-appointment-online-en',
      prompt: 'Rebook my last appointment and pay online',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-same-again-stripe-en',
      prompt: 'Book same again and proceed to Stripe checkout',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-last-haircut-card-en',
      prompt: 'Rebook my last haircut and pay with card',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      expectedParams: { serviceName: 'haircut' },
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-choose-payment-en',
      prompt:
        'Rebook my last appointment and choose payment method at checkout',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'choose_payment_method'],
      paymentAction: 'choose_payment_method',
    },
    {
      id: 'rebook-pay-same-service-payment-options-en',
      prompt:
        'Book the same service as last time; what payment options at checkout',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'choose_payment_method'],
      paymentAction: 'choose_payment_method',
    },
    {
      id: 'rebook-pay-one-tap-online-en',
      prompt: 'One tap rebook my last booking and pay online',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-last-visit-then-card-en',
      prompt: 'Rebook my last visit then pay with card',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-repeat-appointment-online-en',
      prompt: 'Repeat last appointment and pay online',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
    {
      id: 'rebook-pay-what-i-had-card-en',
      prompt: 'Rebook what I had last time and pay by card',
      surface: 'customer',
      orderedActions: ['rebook_last_appointment', 'pay_online'],
      paymentAction: 'pay_online',
    },
  ];

export const REBOOK_AND_PAY_COMPOUND_PROMPTS = [
  ...REBOOK_AND_PAY_CUSTOMER_PROMPTS,
] as const;

export const REBOOK_AND_PAY_RESCUE_SCENARIOS: readonly RebookAndPayCompoundFixture[] =
  REBOOK_AND_PAY_CUSTOMER_PROMPTS.slice(0, 4).map((row) => ({
    ...row,
    misclassifiedAction: 'rebook_last_appointment',
  }));

export const REBOOK_AND_PAY_NEGATIVE_PROMPTS = [
  {
    id: 'rebook-only-no-pay',
    prompt: 'Rebook my last appointment',
  },
  {
    id: 'pay-only-no-rebook',
    prompt: 'Pay online for massage',
  },
  {
    id: 'gift-card-rebook',
    prompt: 'Rebook my last visit and pay with gift card GCM-123',
  },
] as const;
