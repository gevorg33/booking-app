import type { DeclineOnlinePaymentCategoryStepAction } from './ai-decline-online-payment-category-compound.util.js';

export type DeclineOnlinePaymentCategoryCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: DeclineOnlinePaymentCategoryStepAction[];
  categorySteps: Array<{
    categoryName: string;
    prepaymentMode: 'none' | 'full' | 'deposit';
    depositPercent?: number;
  }>;
  misclassifiedAction?: string;
};

export const DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS = [
  {
    id: 'decline-dental-accept-massage-en',
    prompt:
      'Decline online payment on public booking for dental services but accept 50% prepayment for massage services',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'dental', prepaymentMode: 'none' },
      {
        categoryName: 'massage',
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    ],
    misclassifiedAction: 'configure_service_online_payment',
  },
  {
    id: 'disable-hair-enable-facial-en',
    prompt:
      'Turn off online payment for hair category and enable full prepayment for facial services',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'hair', prepaymentMode: 'none' },
      { categoryName: 'facial', prepaymentMode: 'full' },
    ],
    misclassifiedAction: 'configure_service_online_payment',
  },
  {
    id: 'decline-waxing-require-massage-en',
    prompt:
      'Decline online payment for waxing services; require online payment on public booking for massage services with 50% deposit',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'waxing', prepaymentMode: 'none' },
      {
        categoryName: 'massage',
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    ],
    misclassifiedAction: 'configure_cash_payments',
  },
  {
    id: 'decline-barber-accept-color-en',
    prompt:
      'Disable online payment on public booking for barber services but accept full prepayment for color services',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'barber', prepaymentMode: 'none' },
      { categoryName: 'color', prepaymentMode: 'full' },
    ],
  },
  {
    id: 'decline-skincare-enable-spa-en',
    prompt:
      'Decline online payment for skincare services and enable half deposit on spa services',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'skincare', prepaymentMode: 'none' },
      { categoryName: 'spa', prepaymentMode: 'deposit', depositPercent: 50 },
    ],
  },
  {
    id: 'decline-nails-accept-beauty-en',
    prompt:
      'Stop online payment for nails services but require full prepayment for beauty services on public booking',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'nails', prepaymentMode: 'none' },
      { categoryName: 'beauty', prepaymentMode: 'full' },
    ],
  },
  {
    id: 'decline-medical-enable-dental-en',
    prompt:
      'Decline online payment on public booking for medical services; accept online payment for dental services with full prepayment',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'medical', prepaymentMode: 'none' },
      { categoryName: 'dental', prepaymentMode: 'full' },
    ],
  },
  {
    id: 'decline-facial-enable-massage-en',
    prompt:
      'Turn off online payment for facial category, and accept 50% prepayment for massage services',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'facial', prepaymentMode: 'none' },
      {
        categoryName: 'massage',
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    ],
  },
  {
    id: 'decline-hair-accept-skincare-en',
    prompt:
      'Decline online payment for hair services while enabling full prepayment for skincare services',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'hair', prepaymentMode: 'none' },
      { categoryName: 'skincare', prepaymentMode: 'full' },
    ],
  },
  {
    id: 'decline-color-enable-waxing-en',
    prompt:
      'Disable online payment on public booking for color services but accept 50% deposit for waxing services',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'color', prepaymentMode: 'none' },
      { categoryName: 'waxing', prepaymentMode: 'deposit', depositPercent: 50 },
    ],
  },
  {
    id: 'decline-wellness-enable-beauty-en',
    prompt:
      'Decline online payment for wellness services and then enable full prepayment for beauty services',
    orderedActions: [
      'configure_service_online_payment',
      'configure_service_online_payment',
    ] as const,
    categorySteps: [
      { categoryName: 'wellness', prepaymentMode: 'none' },
      { categoryName: 'beauty', prepaymentMode: 'full' },
    ],
  },
] as const satisfies readonly DeclineOnlinePaymentCategoryCompoundFixture[];

export const DECLINE_ONLINE_PAYMENT_CATEGORY_EN_SCENARIO_IDS =
  DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS.map((row) => row.id);

export const DECLINE_ONLINE_PAYMENT_CATEGORY_RESCUE_SCENARIOS =
  DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<
    DeclineOnlinePaymentCategoryCompoundFixture & {
      misclassifiedAction: string;
    }
  >;
