export type UpdateServicePricesOnlinePaymentFilterFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: 'update_service_prices';
  paramsPartial?: {
    percentChange?: number;
    onlyWithOnlinePayment?: boolean;
    categoryName?: string;
    serviceCategory?: string;
  };
  misclassifiedAction?: string;
};

export const UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS: UpdateServicePricesOnlinePaymentFilterFixture[] =
  [
    {
      id: 'raise-10-online-payment-only-en',
      prompt: 'Raise prices 10% for services with online payment only',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: 10, onlyWithOnlinePayment: true },
      misclassifiedAction: 'configure_service_online_payment',
    },
    {
      id: 'increase-5-online-prepayment-only-en',
      prompt:
        'Increase all service prices by 5% — only for services with online prepayment',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: 5, onlyWithOnlinePayment: true },
      misclassifiedAction: 'list_services',
    },
    {
      id: 'lower-8-online-payment-scope-en',
      prompt:
        'Lower prices 8% on services that require online payment on public booking',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: -8, onlyWithOnlinePayment: true },
    },
    {
      id: 'adjust-massage-12-online-only-en',
      prompt:
        'Adjust massage service prices up 12% for services with online payment only',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: {
        percentChange: 12,
        onlyWithOnlinePayment: true,
        categoryName: 'massage',
      },
    },
    {
      id: 'raise-catalog-15-online-enabled-en',
      prompt:
        'Raise catalog prices 15% only for services that have online payment enabled',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: 15, onlyWithOnlinePayment: true },
      misclassifiedAction: 'configure_service_online_payment',
    },
    {
      id: 'decrease-3-accept-online-prepayment-en',
      prompt:
        'Decrease prices 3% for services that accept online prepayment only',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: -3, onlyWithOnlinePayment: true },
    },
    {
      id: 'change-prices-7-with-online-payment-en',
      prompt: 'Change prices by 7% with online payment only',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: 7, onlyWithOnlinePayment: true },
    },
    {
      id: 'raise-hair-10-online-payment-only-en',
      prompt:
        'Raise all hair service prices 10% — services with online payment only',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: {
        percentChange: 10,
        onlyWithOnlinePayment: true,
        categoryName: 'hair',
      },
    },
    {
      id: 'increase-20-online-payment-services-en',
      prompt:
        'Increase prices 20% for services with online payment; skip cash-only offerings',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: 20, onlyWithOnlinePayment: true },
    },
    {
      id: 'reduce-6-online-prepayment-public-en',
      prompt:
        'Reduce service prices 6% for offerings with online prepayment on public booking only',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: -6, onlyWithOnlinePayment: true },
    },
    {
      id: 'raise-10-all-prices-no-filter-en',
      prompt: 'Raise all service prices 10%',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: 10 },
    },
    {
      id: 'raise-10-explicit-param-en',
      prompt: 'Raise prices 10% for online-payment services',
      surface: 'dashboard',
      expectedAction: 'update_service_prices',
      paramsPartial: { percentChange: 10, onlyWithOnlinePayment: true },
    },
  ];

export const UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_RESCUE_SCENARIOS =
  UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS.filter(
    (row) =>
      row.misclassifiedAction && row.paramsPartial?.onlyWithOnlinePayment,
  );
