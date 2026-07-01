import type { CashAndOnlinePaymentCompoundStepAction } from './ai-cash-online-payment-compound.util.js';

export type CashAndOnlinePaymentCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: CashAndOnlinePaymentCompoundStepAction[];
  paramChecks?: Array<{
    stepIndex: number;
    key: string;
    value: unknown;
  }>;
  compoundRecipeId:
    | 'cash_and_online_payment'
    | 'decline_online_payment_category';
  misclassifiedAction?: string;
};

export const CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS: CashAndOnlinePaymentCompoundFixture[] =
  [
    {
      id: 'enable-cash-decline-all-services-en',
      prompt: 'Enable cash and decline online payment for all services',
      orderedActions: [
        'configure_cash_payments',
        'configure_service_online_payment',
      ],
      paramChecks: [
        { stepIndex: 0, key: 'acceptCashPayments', value: true },
        { stepIndex: 1, key: 'allServices', value: true },
        { stepIndex: 1, key: 'prepaymentMode', value: 'none' },
      ],
      compoundRecipeId: 'cash_and_online_payment',
      misclassifiedAction: 'configure_cash_payments',
    },
    {
      id: 'turn-on-cash-decline-all-online-en',
      prompt:
        'Turn on cash payments at checkout and decline online payment on public booking for all services',
      orderedActions: [
        'configure_cash_payments',
        'configure_service_online_payment',
      ],
      paramChecks: [
        { stepIndex: 0, key: 'acceptCashPayments', value: true },
        { stepIndex: 1, key: 'allServices', value: true },
        { stepIndex: 1, key: 'prepaymentMode', value: 'none' },
      ],
      compoundRecipeId: 'cash_and_online_payment',
      misclassifiedAction: 'configure_service_online_payment',
    },
    {
      id: 'accept-cash-disable-online-all-en',
      prompt:
        'Accept cash at venue and disable online prepayment for every service',
      orderedActions: [
        'configure_cash_payments',
        'configure_service_online_payment',
      ],
      paramChecks: [
        { stepIndex: 0, key: 'acceptCashPayments', value: true },
        { stepIndex: 1, key: 'allServices', value: true },
        { stepIndex: 1, key: 'prepaymentMode', value: 'none' },
      ],
      compoundRecipeId: 'cash_and_online_payment',
    },
    {
      id: 'enable-cash-decline-dental-accept-massage-en',
      prompt:
        'Enable cash and decline online payment for dental services but accept 50% prepayment for massage services',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ],
      paramChecks: [
        { stepIndex: 0, key: 'categoryName', value: 'dental' },
        { stepIndex: 0, key: 'prepaymentMode', value: 'none' },
        { stepIndex: 1, key: 'categoryName', value: 'massage' },
        { stepIndex: 1, key: 'prepaymentMode', value: 'deposit' },
        { stepIndex: 1, key: 'depositPercent', value: 50 },
        { stepIndex: 2, key: 'acceptCashPayments', value: true },
      ],
      compoundRecipeId: 'decline_online_payment_category',
      misclassifiedAction: 'configure_cash_payments',
    },
    {
      id: 'cash-decline-hair-enable-facial-en',
      prompt:
        'Enable cash pay-at-venue; decline online payment for hair category and enable full prepayment for facial services',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ],
      paramChecks: [
        { stepIndex: 0, key: 'categoryName', value: 'hair' },
        { stepIndex: 0, key: 'prepaymentMode', value: 'none' },
        { stepIndex: 1, key: 'categoryName', value: 'facial' },
        { stepIndex: 1, key: 'prepaymentMode', value: 'full' },
        { stepIndex: 2, key: 'acceptCashPayments', value: true },
      ],
      compoundRecipeId: 'decline_online_payment_category',
      misclassifiedAction: 'configure_cash_payments',
    },
    {
      id: 'enable-cash-decline-massage-category-en',
      prompt:
        'Enable cash payments and turn off online payment for massage services',
      orderedActions: [
        'configure_cash_payments',
        'configure_service_online_payment',
      ],
      paramChecks: [
        { stepIndex: 0, key: 'acceptCashPayments', value: true },
        { stepIndex: 1, key: 'categoryName', value: 'massage' },
        { stepIndex: 1, key: 'prepaymentMode', value: 'none' },
      ],
      compoundRecipeId: 'cash_and_online_payment',
    },
    {
      id: 'allow-cash-reject-online-all-en',
      prompt:
        'Allow cash at checkout; reject online payment on public booking for all services',
      orderedActions: [
        'configure_cash_payments',
        'configure_service_online_payment',
      ],
      paramChecks: [
        { stepIndex: 0, key: 'acceptCashPayments', value: true },
        { stepIndex: 1, key: 'allServices', value: true },
        { stepIndex: 1, key: 'prepaymentMode', value: 'none' },
      ],
      compoundRecipeId: 'cash_and_online_payment',
    },
    {
      id: 'cash-decline-waxing-accept-spa-en',
      prompt:
        'Enable cash at venue and decline online payment for waxing services but accept full prepayment for spa services',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ],
      paramChecks: [
        { stepIndex: 0, key: 'categoryName', value: 'waxing' },
        { stepIndex: 0, key: 'prepaymentMode', value: 'none' },
        { stepIndex: 1, key: 'categoryName', value: 'spa' },
        { stepIndex: 1, key: 'prepaymentMode', value: 'full' },
        { stepIndex: 2, key: 'acceptCashPayments', value: true },
      ],
      compoundRecipeId: 'decline_online_payment_category',
    },
    {
      id: 'enable-cash-decline-all-public-booking-en',
      prompt:
        'Enable cash payments and decline online payment on public booking for all services',
      orderedActions: [
        'configure_cash_payments',
        'configure_service_online_payment',
      ],
      compoundRecipeId: 'cash_and_online_payment',
      misclassifiedAction: 'configure_cash_payments',
    },
    {
      id: 'cash-decline-skincare-enable-beauty-en',
      prompt:
        'Turn on cash payments; decline online payment for skincare services while enabling full prepayment for beauty services',
      orderedActions: [
        'configure_service_online_payment',
        'configure_service_online_payment',
        'configure_cash_payments',
      ],
      compoundRecipeId: 'decline_online_payment_category',
      misclassifiedAction: 'configure_service_online_payment',
    },
  ];

export const CASH_AND_ONLINE_PAYMENT_COMPOUND_SCENARIOS =
  CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS.filter(
    (row) => row.orderedActions.length >= 2,
  );

export const CASH_AND_ONLINE_PAYMENT_RESCUE_SCENARIOS =
  CASH_AND_ONLINE_PAYMENT_COMPOUND_SCENARIOS.filter(
    (row) => row.misclassifiedAction,
  );
