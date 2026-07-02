import type { ConfigureServicesPaymentMatrixStepAction } from './ai-configure-services-payment-matrix-compound.util.js';

export type ConfigureServicesPaymentMatrixCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: readonly ConfigureServicesPaymentMatrixStepAction[];
  categorySteps?: Array<{
    categoryName: string;
    prepaymentMode: 'none' | 'full' | 'deposit';
    depositPercent?: number;
  }>;
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS: ConfigureServicesPaymentMatrixCompoundFixture[] =
  [
    {
      id: 'matrix-massage-hair-cash-en',
      prompt:
        'Configure services payment matrix — full prepayment for massage services and 50% deposit for hair services; enable cash at venue',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'massage', prepaymentMode: 'full' },
        { categoryName: 'hair', prepaymentMode: 'deposit', depositPercent: 50 },
      ],
      expectedParams: { acceptCashPayments: true },
      misclassifiedAction: 'configure_service_online_payment',
    },
    {
      id: 'matrix-price-massage-hair-cash-en',
      prompt:
        'Raise massage prices 10% — services payment matrix: require full prepayment for massage services; accept 50% deposit for hair services; turn on cash payments',
      orderedActions: [
        'update_service_prices',
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'massage', prepaymentMode: 'full' },
        { categoryName: 'hair', prepaymentMode: 'deposit', depositPercent: 50 },
      ],
      expectedParams: { percentChange: 10, acceptCashPayments: true },
      misclassifiedAction: 'update_service_prices',
    },
    {
      id: 'matrix-three-categories-en',
      prompt:
        'Category payment matrix end-to-end: massage: full prepayment; hair: 50% deposit; facial: full prepayment; enable cash at checkout',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'massage', prepaymentMode: 'full' },
        { categoryName: 'hair', prepaymentMode: 'deposit', depositPercent: 50 },
        { categoryName: 'facial', prepaymentMode: 'full' },
      ],
    },
    {
      id: 'matrix-spa-nails-cash-en',
      prompt:
        'Per-category online payment setup — accept full prepayment on spa services and half deposit on nails services; enable cash pay-at-venue',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'spa', prepaymentMode: 'full' },
        {
          categoryName: 'nails',
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
    },
    {
      id: 'matrix-colon-semicolon-en',
      prompt:
        'Services payment matrix — waxing: full; color: 50% deposit; enable cash at venue',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'waxing', prepaymentMode: 'full' },
        {
          categoryName: 'color',
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
    },
    {
      id: 'matrix-facial-barber-cash-en',
      prompt:
        'Configure category prepayment matrix: for facial services with full prepayment and for barber services with 50% prepayment; accept cash at venue',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'facial', prepaymentMode: 'full' },
        {
          categoryName: 'barber',
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
      misclassifiedAction: 'configure_cash_payments',
    },
    {
      id: 'matrix-price-facial-spa-en',
      prompt:
        'Increase facial prices 5% then payment matrix — full prepayment for facial services; 50% deposit for spa services; enable cash',
      orderedActions: [
        'update_service_prices',
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'facial', prepaymentMode: 'full' },
        { categoryName: 'spa', prepaymentMode: 'deposit', depositPercent: 50 },
      ],
      expectedParams: { percentChange: 5 },
    },
    {
      id: 'matrix-massage-skincare-cash-en',
      prompt:
        'Payment matrix for services — require full prepayment for massage services and require 50% deposit for skincare services; turn on cash payments',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'massage', prepaymentMode: 'full' },
        {
          categoryName: 'skincare',
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
    },
    {
      id: 'matrix-dental-medical-en',
      prompt:
        'Configure services payment matrix: dental: full prepayment; medical: 50% deposit; enable cash at venue',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'dental', prepaymentMode: 'full' },
        {
          categoryName: 'medical',
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
    },
    {
      id: 'matrix-beauty-wellness-en',
      prompt:
        'Category payment matrix end-to-end — accept online payment on public booking for beauty services with full prepayment; for wellness services with half deposit; enable cash',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'beauty', prepaymentMode: 'full' },
        {
          categoryName: 'wellness',
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
    },
    {
      id: 'matrix-raise-hair-massage-en',
      prompt:
        'Raise hair prices 8% — per-category payment: full prepayment for hair services; 50% deposit for massage services; accept cash at venue',
      orderedActions: [
        'update_service_prices',
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ] as const,
      categorySteps: [
        { categoryName: 'hair', prepaymentMode: 'full' },
        {
          categoryName: 'massage',
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
      expectedParams: { percentChange: 8 },
    },
  ];

export const CONFIGURE_SERVICES_PAYMENT_MATRIX_EN_SCENARIO_IDS =
  CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS.map((row) => row.id);

export const CONFIGURE_SERVICES_PAYMENT_MATRIX_RESCUE_SCENARIOS =
  CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<
    ConfigureServicesPaymentMatrixCompoundFixture & {
      misclassifiedAction: string;
    }
  >;
