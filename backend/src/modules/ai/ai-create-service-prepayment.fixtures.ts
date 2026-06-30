export type CreateServicePrepaymentFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: 'create_service';
  paramsPartial?: {
    prepaymentMode?: 'none' | 'full' | 'deposit';
    depositPercent?: number | null;
    depositAmount?: number;
    serviceName?: string;
    price?: number;
    durationMinutes?: number;
  };
  misclassifiedAction?: string;
};

export const CREATE_SERVICE_PREPAYMENT_PROMPTS: CreateServicePrepaymentFixture[] =
  [
    {
      id: 'add-massage-50-deposit-en',
      prompt: 'Add massage 60 minutes $80 with 50% online prepayment',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'deposit',
        depositPercent: 50,
        serviceName: 'massage',
        price: 80,
        durationMinutes: 60,
      },
      misclassifiedAction: 'configure_service_online_payment',
    },
    {
      id: 'create-facemassage-full-en',
      prompt: 'Create service Facemassage 60min $50 with full prepayment',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'full',
        serviceName: 'Facemassage',
        price: 50,
        durationMinutes: 60,
      },
    },
    {
      id: 'add-deep-tissue-30-deposit-en',
      prompt:
        'Add a new service called Deep Tissue 90 minutes $120 with 30% online deposit prepayment',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'deposit',
        depositPercent: 30,
        serviceName: 'Deep Tissue',
        price: 120,
        durationMinutes: 90,
      },
      misclassifiedAction: 'configure_service_deposit_policy',
    },
    {
      id: 'add-haircut-no-prepayment-en',
      prompt: 'Add haircut 30 min $35, no online prepayment',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'none',
        serviceName: 'haircut',
        price: 35,
        durationMinutes: 30,
      },
    },
    {
      id: 'register-balayage-full-en',
      prompt: 'Register offering Balayage 120min $200 with 100% prepayment',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'full',
        serviceName: 'Balayage',
        price: 200,
        durationMinutes: 120,
      },
    },
    {
      id: 'add-teeth-whitening-fixed-deposit-en',
      prompt:
        'Add service Teeth Whitening 45m $150 with $40 deposit prepayment online',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'deposit',
        depositAmount: 40,
        serviceName: 'Teeth Whitening',
        price: 150,
        durationMinutes: 45,
      },
    },
    {
      id: 'add-swedish-half-deposit-en',
      prompt:
        'Create new service Swedish massage 60 minutes $75 with half prepayment online',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'deposit',
        depositPercent: 50,
        serviceName: 'Swedish massage',
        price: 75,
        durationMinutes: 60,
      },
    },
    {
      id: 'add-color-25-deposit-en',
      prompt: 'Add color treatment 90min $180 with 25% online prepayment',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'deposit',
        depositPercent: 25,
        price: 180,
        durationMinutes: 90,
      },
      misclassifiedAction: 'configure_service_online_payment',
    },
    {
      id: 'add-mens-cut-cash-only-en',
      prompt:
        "Add men's cut 30 minutes $28 — cash only, no online payment on public booking",
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'none',
        price: 28,
        durationMinutes: 30,
      },
    },
    {
      id: 'introduce-gel-manicure-deposit-en',
      prompt:
        'Introduce service Gel Manicure 45 min $45 with deposit prepayment online',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'deposit',
        serviceName: 'Gel Manicure',
        price: 45,
        durationMinutes: 45,
      },
    },
    {
      id: 'add-brow-lamination-20-deposit-en',
      prompt: 'Add service Brow Lamination 30m $55 with 20% prepayment online',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'deposit',
        depositPercent: 20,
        serviceName: 'Brow Lamination',
        price: 55,
        durationMinutes: 30,
      },
    },
    {
      id: 'add-facial-online-payment-en',
      prompt:
        'Add service Hydrating Facial 75 minutes $95 requiring online payment on public booking',
      surface: 'dashboard',
      expectedAction: 'create_service',
      paramsPartial: {
        prepaymentMode: 'full',
        serviceName: 'Hydrating Facial',
        price: 95,
        durationMinutes: 75,
      },
      misclassifiedAction: 'explain_service_online_payment_setup',
    },
  ];

export const CREATE_SERVICE_PREPAYMENT_RESCUE_SCENARIOS =
  CREATE_SERVICE_PREPAYMENT_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<CreateServicePrepaymentFixture & { misclassifiedAction: string }>;
