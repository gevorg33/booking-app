export type CreateServicesPrepaymentFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: 'create_services';
  services: Array<{
    serviceName: string;
    durationMinutes: number;
    price: number;
    prepaymentMode?: 'none' | 'full' | 'deposit';
    depositPercent?: number | null;
    depositAmount?: number;
  }>;
  paramsPartial?: {
    prepaymentMode?: 'none' | 'full' | 'deposit';
    depositPercent?: number | null;
  };
  misclassifiedAction?: string;
};

export const CREATE_SERVICES_PREPAYMENT_PROMPTS: CreateServicesPrepaymentFixture[] =
  [
    {
      id: 'bulk-all-50-deposit-en',
      prompt:
        'Add services: facemassage 60min $50, haircut 30min $25, manicure 45min $40 — all with 50% online prepayment',
      surface: 'dashboard',
      expectedAction: 'create_services',
      paramsPartial: { prepaymentMode: 'deposit', depositPercent: 50 },
      services: [
        {
          serviceName: 'facemassage',
          durationMinutes: 60,
          price: 50,
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
        {
          serviceName: 'haircut',
          durationMinutes: 30,
          price: 25,
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
        {
          serviceName: 'manicure',
          durationMinutes: 45,
          price: 40,
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
      misclassifiedAction: 'configure_service_online_payment',
    },
    {
      id: 'bulk-per-row-mixed-en',
      prompt:
        'Add services: massage 60min $80 full prepayment, facial 45min $60 no online prepayment, gel manicure 30min $35 with 20% prepayment online',
      surface: 'dashboard',
      expectedAction: 'create_services',
      services: [
        {
          serviceName: 'massage',
          durationMinutes: 60,
          price: 80,
          prepaymentMode: 'full',
        },
        {
          serviceName: 'facial',
          durationMinutes: 45,
          price: 60,
          prepaymentMode: 'none',
        },
        {
          serviceName: 'gel manicure',
          durationMinutes: 30,
          price: 35,
          prepaymentMode: 'deposit',
          depositPercent: 20,
        },
      ],
    },
    {
      id: 'bulk-prefix-full-en',
      prompt:
        'Add these services with full prepayment: brow lamination 30min $55, lash lift 45min $70',
      surface: 'dashboard',
      expectedAction: 'create_services',
      paramsPartial: { prepaymentMode: 'full' },
      services: [
        {
          serviceName: 'brow lamination',
          durationMinutes: 30,
          price: 55,
          prepaymentMode: 'full',
        },
        {
          serviceName: 'lash lift',
          durationMinutes: 45,
          price: 70,
          prepaymentMode: 'full',
        },
      ],
    },
    {
      id: 'bulk-menu-deposit-en',
      prompt:
        'Create services: Swedish massage 60min $75, deep tissue 90min $120, hot stone 75min $95 — all with 30% online deposit prepayment',
      surface: 'dashboard',
      expectedAction: 'create_services',
      paramsPartial: { prepaymentMode: 'deposit', depositPercent: 30 },
      services: [
        {
          serviceName: 'Swedish massage',
          durationMinutes: 60,
          price: 75,
          prepaymentMode: 'deposit',
          depositPercent: 30,
        },
        {
          serviceName: 'deep tissue',
          durationMinutes: 90,
          price: 120,
          prepaymentMode: 'deposit',
          depositPercent: 30,
        },
        {
          serviceName: 'hot stone',
          durationMinutes: 75,
          price: 95,
          prepaymentMode: 'deposit',
          depositPercent: 30,
        },
      ],
      misclassifiedAction: 'configure_service_deposit_policy',
    },
    {
      id: 'bulk-cash-only-row-en',
      prompt:
        'Add services: premium facial 60min $90 full prepayment, walk-in trim 20min $20 cash only no online payment',
      surface: 'dashboard',
      expectedAction: 'create_services',
      services: [
        {
          serviceName: 'premium facial',
          durationMinutes: 60,
          price: 90,
          prepaymentMode: 'full',
        },
        {
          serviceName: 'walk-in trim',
          durationMinutes: 20,
          price: 20,
          prepaymentMode: 'none',
        },
      ],
    },
    {
      id: 'bulk-two-half-deposit-en',
      prompt:
        'Add services: haircut 30min $35, beard trim 20min $20 — all with half prepayment online',
      surface: 'dashboard',
      expectedAction: 'create_services',
      paramsPartial: { prepaymentMode: 'deposit', depositPercent: 50 },
      services: [
        {
          serviceName: 'haircut',
          durationMinutes: 30,
          price: 35,
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
        {
          serviceName: 'beard trim',
          durationMinutes: 20,
          price: 20,
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
    },
    {
      id: 'bulk-three-standard-en',
      prompt:
        'Register services: classic facial 50min $65 with deposit prepayment online, classic manicure 40min $40 with deposit prepayment online, classic pedicure 50min $50 with deposit prepayment online',
      surface: 'dashboard',
      expectedAction: 'create_services',
      services: [
        {
          serviceName: 'classic facial',
          durationMinutes: 50,
          price: 65,
          prepaymentMode: 'deposit',
        },
        {
          serviceName: 'classic manicure',
          durationMinutes: 40,
          price: 40,
          prepaymentMode: 'deposit',
        },
        {
          serviceName: 'classic pedicure',
          durationMinutes: 50,
          price: 50,
          prepaymentMode: 'deposit',
        },
      ],
    },
    {
      id: 'bulk-color-highlight-en',
      prompt:
        'Add services: root touch-up 90min $110 with 25% online prepayment, full highlights 150min $220 with 25% online prepayment',
      surface: 'dashboard',
      expectedAction: 'create_services',
      services: [
        {
          serviceName: 'root touch-up',
          durationMinutes: 90,
          price: 110,
          prepaymentMode: 'deposit',
          depositPercent: 25,
        },
        {
          serviceName: 'full highlights',
          durationMinutes: 150,
          price: 220,
          prepaymentMode: 'deposit',
          depositPercent: 25,
        },
      ],
    },
    {
      id: 'bulk-spa-package-lines-en',
      prompt:
        'Add services: express massage 30min $45, deluxe massage 90min $130, couples massage 60min $160 — all requiring online payment on public booking',
      surface: 'dashboard',
      expectedAction: 'create_services',
      services: [
        {
          serviceName: 'express massage',
          durationMinutes: 30,
          price: 45,
          prepaymentMode: 'full',
        },
        {
          serviceName: 'deluxe massage',
          durationMinutes: 90,
          price: 130,
          prepaymentMode: 'full',
        },
        {
          serviceName: 'couples massage',
          durationMinutes: 60,
          price: 160,
          prepaymentMode: 'full',
        },
      ],
      misclassifiedAction: 'explain_service_online_payment_setup',
    },
    {
      id: 'bulk-no-prepayment-global-en',
      prompt:
        'Add these services with no online prepayment: kids haircut 20min $18, senior haircut 25min $22',
      surface: 'dashboard',
      expectedAction: 'create_services',
      paramsPartial: { prepaymentMode: 'none' },
      services: [
        {
          serviceName: 'kids haircut',
          durationMinutes: 20,
          price: 18,
          prepaymentMode: 'none',
        },
        {
          serviceName: 'senior haircut',
          durationMinutes: 25,
          price: 22,
          prepaymentMode: 'none',
        },
      ],
    },
    {
      id: 'bulk-four-menu-en',
      prompt:
        'Add services: blowout 45min $55, updo 60min $80, makeup 75min $95, lashes 90min $120 — all with 50% online prepayment',
      surface: 'dashboard',
      expectedAction: 'create_services',
      paramsPartial: { prepaymentMode: 'deposit', depositPercent: 50 },
      services: [
        {
          serviceName: 'blowout',
          durationMinutes: 45,
          price: 55,
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
        {
          serviceName: 'updo',
          durationMinutes: 60,
          price: 80,
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
        {
          serviceName: 'makeup',
          durationMinutes: 75,
          price: 95,
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
        {
          serviceName: 'lashes',
          durationMinutes: 90,
          price: 120,
          prepaymentMode: 'deposit',
          depositPercent: 50,
        },
      ],
    },
    {
      id: 'bulk-fixed-deposit-row-en',
      prompt:
        'Add services: bridal makeup 120min $250 with $75 deposit prepayment online, trial makeup 90min $150 with $50 deposit prepayment online',
      surface: 'dashboard',
      expectedAction: 'create_services',
      services: [
        {
          serviceName: 'bridal makeup',
          durationMinutes: 120,
          price: 250,
          prepaymentMode: 'deposit',
          depositAmount: 75,
        },
        {
          serviceName: 'trial makeup',
          durationMinutes: 90,
          price: 150,
          prepaymentMode: 'deposit',
          depositAmount: 50,
        },
      ],
    },
  ];

export const CREATE_SERVICES_PREPAYMENT_RESCUE_SCENARIOS =
  CREATE_SERVICES_PREPAYMENT_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<CreateServicesPrepaymentFixture & { misclassifiedAction: string }>;
