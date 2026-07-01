import type { DiscoverBookAndPayPaymentAction } from './ai-discover-book-and-pay-compound.util.js';

export type DiscoverBookAndPaySurface = 'customer' | 'public';

export type DiscoverBookAndPayCompoundFixture = {
  id: string;
  prompt: string;
  surface: DiscoverBookAndPaySurface;
  orderedActions: readonly string[];
  expectedParams?: Record<string, unknown>;
  paymentAction?: DiscoverBookAndPayPaymentAction;
  misclassifiedAction?: string;
};

export const DISCOVER_BOOK_AND_PAY_CLASSIFIER_RULES = `- discover_book_and_pay (compound): customer/public multi-step budget or rank discovery + availability check + booking + checkout payment. Decomposes to list_services (maxPrice and/or serviceRank) → check_providers_for_service/check_availability → book_nearest_slot/book_appointment → pay_online or choose_payment_method. Use for "Book cheapest massage under $60 tomorrow and pay online", "Show affordable facials under $50, check who's free, book soonest, pay with card", "List premium haircut options, check availability Friday, book nearest, choose payment method". Requires catalog filter cue (budget maxPrice or rank like cheapest/premium), book cue, and payment cue (pay online, pay with card, choose payment). NOT customer_budget_service_discovery_compound when user omits payment; NOT book_with_gift_card; NOT pay_cash_at_visit-only; NOT dashboard budget_discover_and_book (create_booking).`;

export const DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS: readonly DiscoverBookAndPayCompoundFixture[] =
  [
    {
      id: 'discover-book-pay-cheapest-massage-60-en',
      prompt: 'Book cheapest massage under $60 tomorrow and pay online',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      expectedParams: { serviceCategory: 'massage', maxPrice: 60 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-facial-50-card-en',
      prompt:
        'Show facials under $50, check who is free tomorrow evening, book the soonest slot, and pay with card',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      expectedParams: { serviceCategory: 'facial', maxPrice: 50 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-haircut-45-online-en',
      prompt: 'Book a haircut under $45 tomorrow nearest slot and pay online',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      expectedParams: { maxPrice: 45 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-premium-facial-en',
      prompt:
        'Find premium facial options, check availability Saturday, book earliest opening, pay with card',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-color-80-en',
      prompt:
        'List color services under $80, check providers free Friday morning, book nearest, then pay online',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      expectedParams: { maxPrice: 80 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-massage-choose-payment-en',
      prompt:
        'Book affordable massage under $70 tomorrow, check who is free, reserve soonest slot, choose payment method',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'choose_payment_method',
      ],
      expectedParams: { maxPrice: 70 },
      paymentAction: 'choose_payment_method',
    },
    {
      id: 'discover-book-pay-cheapest-haircut-en',
      prompt:
        'Get the cheapest haircut under $40, check availability, book it, pay online',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      expectedParams: { maxPrice: 40 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-lashes-55-en',
      prompt:
        'Show lash options under $55, check who is free tomorrow, book nearest slot and pay with card',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      expectedParams: { maxPrice: 55 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-manicure-payment-options-en',
      prompt:
        'Book manicure under $35 tomorrow; check providers; book soonest; what payment options at checkout',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'choose_payment_method',
      ],
      expectedParams: { maxPrice: 35 },
      paymentAction: 'choose_payment_method',
    },
    {
      id: 'discover-book-pay-deluxe-massage-en',
      prompt:
        'Find deluxe massage under $120, check availability this week, book first available, proceed to Stripe checkout',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      expectedParams: { maxPrice: 120 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-spa-under-90-en',
      prompt:
        'Affordable spa treatment under $90 — check who is free Saturday, book nearest, pay online',
      surface: 'customer',
      orderedActions: [
        'list_services',
        'check_providers_for_service',
        'book_nearest_slot',
        'pay_online',
      ],
      expectedParams: { maxPrice: 90 },
      paymentAction: 'pay_online',
    },
  ];

export const DISCOVER_BOOK_AND_PAY_PUBLIC_PROMPTS: readonly DiscoverBookAndPayCompoundFixture[] =
  [
    {
      id: 'discover-book-pay-public-massage-60-en',
      prompt: 'Book cheapest massage under $60 tomorrow and pay online',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      expectedParams: { serviceCategory: 'massage', maxPrice: 60 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-facial-50-en',
      prompt:
        'Show facials under $50, check availability tomorrow evening, book soonest, pay with card',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      expectedParams: { maxPrice: 50 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-haircut-45-en',
      prompt: 'Book a haircut under $45 tomorrow nearest slot and pay online',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      expectedParams: { maxPrice: 45 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-premium-en',
      prompt:
        'List premium facial options, check who is free Saturday, book earliest, pay online',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-color-80-en',
      prompt:
        'Color under $80 Friday — check availability, book nearest opening, pay with card',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      expectedParams: { maxPrice: 80 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-choose-payment-en',
      prompt:
        'Book massage under $70 tomorrow, check availability, reserve soonest, choose payment method',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'choose_payment_method',
      ],
      expectedParams: { maxPrice: 70 },
      paymentAction: 'choose_payment_method',
    },
    {
      id: 'discover-book-pay-public-cheapest-en',
      prompt:
        'Cheapest haircut under $40 — check who is free, book it, pay online',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      expectedParams: { maxPrice: 40 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-lashes-en',
      prompt:
        'Lashes under $55 tomorrow, check availability, book nearest slot and pay online',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      expectedParams: { maxPrice: 55 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-manicure-en',
      prompt:
        'Manicure under $35; check availability; book soonest; payment options at checkout',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'choose_payment_method',
      ],
      expectedParams: { maxPrice: 35 },
      paymentAction: 'choose_payment_method',
    },
    {
      id: 'discover-book-pay-public-stripe-en',
      prompt:
        'Massage under $100 this week, check availability, book first available, proceed to secure checkout',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      expectedParams: { maxPrice: 100 },
      paymentAction: 'pay_online',
    },
    {
      id: 'discover-book-pay-public-spa-en',
      prompt:
        'Affordable spa under $90 Saturday — check availability, book nearest, pay with card',
      surface: 'public',
      orderedActions: [
        'list_services',
        'check_availability',
        'book_appointment',
        'pay_online',
      ],
      expectedParams: { maxPrice: 90 },
      paymentAction: 'pay_online',
    },
  ];

export const DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS = [
  ...DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS,
  ...DISCOVER_BOOK_AND_PAY_PUBLIC_PROMPTS,
] as const;

export const DISCOVER_BOOK_AND_PAY_RESCUE_SCENARIOS: readonly DiscoverBookAndPayCompoundFixture[] =
  DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS.filter(
    (row) => row.misclassifiedAction !== undefined,
  ).concat(
    DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS.slice(0, 4).map((row) => ({
      ...row,
      misclassifiedAction: 'book_nearest_slot',
    })),
    DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS.slice(0, 2).map((row) => ({
      ...row,
      misclassifiedAction: 'pay_online',
    })),
  );

export const DISCOVER_BOOK_AND_PAY_NEGATIVE_PROMPTS = [
  {
    id: 'budget-book-no-pay',
    prompt: 'Book a haircut under $50 tomorrow, nearest slot',
  },
  {
    id: 'pay-only-no-discover',
    prompt: 'Pay online for massage',
  },
  {
    id: 'gift-card-book',
    prompt: 'Book nearest slot for massage and pay with gift card GCM-123',
  },
] as const;
