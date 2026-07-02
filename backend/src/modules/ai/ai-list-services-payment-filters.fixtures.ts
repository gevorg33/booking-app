export type ListServicesPaymentFilterFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard' | 'public' | 'customer';
  expectedAction: 'list_services';
  paramsPartial?: {
    prepaymentMode?: 'none' | 'full' | 'deposit';
    onlinePaymentEnabled?: boolean;
    serviceCategory?: string;
  };
  misclassifiedAction?: string;
};

export const LIST_SERVICES_PAYMENT_FILTER_PROMPTS: ListServicesPaymentFilterFixture[] =
  [
    {
      id: 'list-require-online-payment-en',
      prompt: 'List services that require online payment',
      surface: 'dashboard',
      expectedAction: 'list_services',
      paramsPartial: { onlinePaymentEnabled: true },
      misclassifiedAction: 'audit_services_missing_online_payment',
    },
    {
      id: 'list-accept-online-prepayment-en',
      prompt: 'Show services that accept online prepayment on public booking',
      surface: 'dashboard',
      expectedAction: 'list_services',
      paramsPartial: { onlinePaymentEnabled: true },
      misclassifiedAction: 'explain_service_online_payment_setup',
    },
    {
      id: 'list-full-prepayment-services-en',
      prompt: 'List services with full prepayment',
      surface: 'dashboard',
      expectedAction: 'list_services',
      paramsPartial: { prepaymentMode: 'full' },
    },
    {
      id: 'list-deposit-prepayment-en',
      prompt: 'Show services with deposit prepayment on public booking',
      surface: 'dashboard',
      expectedAction: 'list_services',
      paramsPartial: { prepaymentMode: 'deposit' },
    },
    {
      id: 'list-online-payment-catalog-en',
      prompt: 'List our service catalog — services with online payment enabled',
      surface: 'dashboard',
      expectedAction: 'list_services',
      paramsPartial: { onlinePaymentEnabled: true },
    },
    {
      id: 'list-require-prepayment-dashboard-en',
      prompt: 'List services requiring online prepayment',
      surface: 'dashboard',
      expectedAction: 'list_services',
      paramsPartial: { onlinePaymentEnabled: true },
      misclassifiedAction: 'configure_service_online_payment',
    },
    {
      id: 'list-massage-online-payment-en',
      prompt: 'List massage services that require online prepayment',
      surface: 'dashboard',
      expectedAction: 'list_services',
      paramsPartial: {
        onlinePaymentEnabled: true,
        serviceCategory: 'massage',
      },
    },
    {
      id: 'list-services-pay-online-en',
      prompt: 'Show services customers can pay for online',
      surface: 'dashboard',
      expectedAction: 'list_services',
      paramsPartial: { onlinePaymentEnabled: true },
    },
    {
      id: 'list-deposit-services-public-en',
      prompt: 'What services require a deposit prepayment online?',
      surface: 'public',
      expectedAction: 'list_services',
      paramsPartial: { prepaymentMode: 'deposit' },
    },
  ];

export const LIST_SERVICES_PAYMENT_FILTER_RESCUE_SCENARIOS =
  LIST_SERVICES_PAYMENT_FILTER_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<
    ListServicesPaymentFilterFixture & { misclassifiedAction: string }
  >;

export const LIST_SERVICES_PAYMENT_FILTER_EN_SCENARIO_IDS =
  LIST_SERVICES_PAYMENT_FILTER_PROMPTS.map((row) => row.id);
