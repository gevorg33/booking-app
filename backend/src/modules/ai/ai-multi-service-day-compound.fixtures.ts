export type MultiServiceDayCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  orderedActions: readonly string[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const MULTI_SERVICE_DAY_CLASSIFIER_RULES = `- multi_service_day (compound): customer multi-step same-day multi-service planning — add services to cart, check block availability, then book. Decomposes to add_services_to_cart → check_multi_service_availability → book_multi_service with shared serviceNames. Use for "Massage and facial same afternoon — find a time", "Haircut and color same day find a slot and book", "Manicure and pedicure tomorrow afternoon — check and book together". Requires two or more service names AND same-day/time planning cue (same afternoon/day, find a time, check and book). NOT provider_same_day_multi (named stylist + multi-service block); NOT book_multi_service alone; NOT add_services_to_cart alone; NOT check_multi_service_availability alone; NOT book_package (package SKU).`;

export const MULTI_SERVICE_DAY_CUSTOMER_PROMPTS: readonly MultiServiceDayCompoundFixture[] =
  [
    {
      id: 'multi-day-massage-facial-afternoon-en',
      prompt: 'Massage and facial same afternoon — find a time',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['massage', 'facial'],
        timeOfDay: 'afternoon',
      },
    },
    {
      id: 'multi-day-haircut-color-same-day-en',
      prompt: 'Haircut and color same day — find a time and book',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: { serviceNames: ['haircut', 'color'] },
    },
    {
      id: 'multi-day-manicure-pedicure-tomorrow-en',
      prompt:
        'Manicure and pedicure same afternoon tomorrow — check and book together',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['manicure', 'pedicure'],
        timeOfDay: 'afternoon',
      },
    },
    {
      id: 'multi-day-massage-facial-find-slot-en',
      prompt: 'Massage and facial on the same visit — find an open slot',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: { serviceNames: ['massage', 'facial'] },
    },
    {
      id: 'multi-day-color-blowdry-afternoon-en',
      prompt: 'Color and blowdry same afternoon, find a time for both',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['color', 'blowdry'],
        timeOfDay: 'afternoon',
      },
    },
    {
      id: 'multi-day-facial-peel-same-day-en',
      prompt: 'Facial and peel same day — who is free and book it',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: { serviceNames: ['facial', 'peel'] },
    },
    {
      id: 'multi-day-massage-facial-tomorrow-en',
      prompt: 'I need massage and facial tomorrow — find a time and book',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: { serviceNames: ['massage', 'facial'] },
    },
    {
      id: 'multi-day-haircut-beard-same-afternoon-en',
      prompt: 'Haircut and beard trim same afternoon — find a slot',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['haircut', 'beard trim'],
        timeOfDay: 'afternoon',
      },
    },
    {
      id: 'multi-day-swedish-deep-tissue-en',
      prompt:
        'Swedish massage and deep tissue same day — check availability and book',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['Swedish massage', 'deep tissue'],
      },
    },
    {
      id: 'multi-day-massage-facial-evening-en',
      prompt: 'Massage and facial same evening — find a time',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['massage', 'facial'],
        timeOfDay: 'evening',
      },
    },
    {
      id: 'multi-day-manicure-pedicure-find-time-en',
      prompt: 'Manicure and pedicure same day — find a time and book',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: { serviceNames: ['manicure', 'pedicure'] },
    },
    {
      id: 'multi-day-massage-facial-plan-en',
      prompt:
        'Massage and facial same afternoon — find a time and book, not a package SKU',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
        'book_multi_service',
      ],
      expectedParams: {
        serviceNames: ['massage', 'facial'],
        timeOfDay: 'afternoon',
      },
    },
  ];

export const MULTI_SERVICE_DAY_COMPOUND_PROMPTS = [
  ...MULTI_SERVICE_DAY_CUSTOMER_PROMPTS,
] as const;

export const MULTI_SERVICE_DAY_RESCUE_SCENARIOS: readonly MultiServiceDayCompoundFixture[] =
  MULTI_SERVICE_DAY_CUSTOMER_PROMPTS.slice(0, 4).map((row) => ({
    ...row,
    misclassifiedAction: 'check_multi_service_availability',
  }));

export const MULTI_SERVICE_DAY_NEGATIVE_PROMPTS = [
  {
    id: 'book-only-together',
    prompt: 'Book massage and facial together',
  },
  {
    id: 'add-cart-only',
    prompt: 'Add massage and facial to my cart',
  },
  {
    id: 'check-only',
    prompt: 'Check multi-service availability',
  },
  {
    id: 'add-then-check-two-step',
    prompt:
      'Add massage and facial to cart and check multi-service availability',
  },
  {
    id: 'book-package',
    prompt: 'Book spa day package for me',
  },
] as const;
