import {
  decomposeCustomerBookingCompoundPrompt,
  extractServiceNamesFromPrompt,
  isBookMultiServicePrompt,
  isCheckMultiServiceAvailabilityPrompt,
  isCustomerBookingCompoundPrompt,
  rescueSelfServiceBookingIntent,
  type SelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';

export const PUBLIC_MULTI_SERVICE_BOOKING_INTENTS = [
  'book_multi_service',
  'check_multi_service_availability',
  'add_services_to_cart',
  'preview_multi_service_cart',
] as const;

export type PublicMultiServiceBookingIntent =
  (typeof PUBLIC_MULTI_SERVICE_BOOKING_INTENTS)[number];

export const CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES = `- book_multi_service: MUTATE — book multiple catalog services in one visit (multi-service / same-day block). Triggers: book|reserve|schedule + two or more service names (massage and facial), multi-service, multiple treatments, spa day with named treatments (not a fixed package SKU). Sets cartServiceIds and navigates to multi-service checkout. Requires serviceNames (≥2) or cartServiceIds from session. NOT book_package (bundled package SKU), NOT book_appointment (single service), NOT create_multi_service_booking (staff dashboard).
- check_multi_service_availability: READ — find open multi-service time blocks for services in cart or named in the prompt (same afternoon, together, find a time). Uses suggestMultiServiceBlock or day slots. Requires serviceNames or cartServiceIds. NOT check_availability (single service), NOT check_multi_service_block_availability (staff block tool), NOT check_package_availability (package lines).
- add_services_to_cart: MUTATE — add named services to the multi-service cart before checking availability or booking. Triggers: add X and Y to cart, put massage and facial in cart. NOT remove_service_from_cart, NOT list_services.
- preview_multi_service_cart: READ — preview the total price and duration for services in the cart or named in the prompt, without checking a specific time slot. Triggers: what would this cost, how long would massage and facial take together, preview my cart, total for these services. Requires serviceNames or cartServiceIds. NOT show_cart_total_duration (duration only, no price), NOT check_multi_service_availability (time slots), NOT get_multi_service_quote (checkout pricing with promo/loyalty).`;

export type MultiServiceCustomerPublicPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction:
    | 'book_multi_service'
    | 'check_multi_service_availability'
    | 'add_services_to_cart'
    | 'preview_multi_service_cart';
  serviceNames?: string[];
  rescueReason?: string;
};

export const BOOK_MULTI_SERVICE_PROMPTS: readonly MultiServiceCustomerPublicPromptFixture[] =
  [
    {
      id: 'book-massage-facial-together-customer',
      prompt: 'Book massage and facial together',
      surface: 'customer',
      expectedAction: 'book_multi_service',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-haircut-color-same-visit-customer',
      prompt: 'Schedule haircut and color on the same visit',
      surface: 'customer',
      expectedAction: 'book_multi_service',
      serviceNames: ['haircut', 'color'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-spa-day-treatments-customer',
      prompt: 'Book a spa day with massage and facial',
      surface: 'customer',
      expectedAction: 'book_multi_service',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-multiple-treatments-customer',
      prompt: 'I want multiple treatments — manicure and pedicure',
      surface: 'customer',
      expectedAction: 'book_multi_service',
      serviceNames: ['manicure', 'pedicure'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-multi-service-explicit-customer',
      prompt: 'Book multi-service massage and facial',
      surface: 'customer',
      expectedAction: 'book_multi_service',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-swedish-deep-tissue-customer',
      prompt: 'Reserve Swedish massage and deep tissue together',
      surface: 'customer',
      expectedAction: 'book_multi_service',
      serviceNames: ['Swedish massage', 'deep tissue'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-blowdry-manicure-customer',
      prompt: 'Book blowdry and manicure for me',
      surface: 'customer',
      expectedAction: 'book_multi_service',
      serviceNames: ['blowdry', 'manicure'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-facial-peel-customer',
      prompt: 'Can I book facial and peel together?',
      surface: 'customer',
      expectedAction: 'book_multi_service',
      serviceNames: ['facial', 'peel'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-massage-facial-together-public',
      prompt: 'Book massage and facial together',
      surface: 'public',
      expectedAction: 'book_multi_service',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-spa-day-treatments-public',
      prompt: 'Book a spa day with massage and facial',
      surface: 'public',
      expectedAction: 'book_multi_service',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-haircut-beard-public',
      prompt: 'Schedule haircut and beard trim together',
      surface: 'public',
      expectedAction: 'book_multi_service',
      serviceNames: ['haircut', 'beard trim'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-multi-treatments-public',
      prompt: 'Book multiple services — massage and facial',
      surface: 'public',
      expectedAction: 'book_multi_service',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-color-blowdry-public',
      prompt: 'Reserve color and blowdry on one visit',
      surface: 'public',
      expectedAction: 'book_multi_service',
      serviceNames: ['color', 'blowdry'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-manicure-pedicure-public',
      prompt: 'Book manicure and pedicure together',
      surface: 'public',
      expectedAction: 'book_multi_service',
      serviceNames: ['manicure', 'pedicure'],
      rescueReason: 'book_multi',
    },
    {
      id: 'book-multi-service-label-public',
      prompt: 'Start a multi-service booking for massage and facial',
      surface: 'public',
      expectedAction: 'book_multi_service',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'book_multi',
    },
  ];

export const CHECK_MULTI_SERVICE_AVAILABILITY_PROMPTS: readonly MultiServiceCustomerPublicPromptFixture[] =
  [
    {
      id: 'check-multi-service-availability-customer',
      prompt: 'Check multi-service availability',
      surface: 'customer',
      expectedAction: 'check_multi_service_availability',
      rescueReason: 'multi_availability',
    },
    {
      id: 'massage-facial-same-afternoon-customer',
      prompt: 'When can I get massage and facial together this afternoon?',
      surface: 'customer',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'multi_service_availability_discovery',
    },
    {
      id: 'who-free-massage-facial-customer',
      prompt: 'Who is free for massage and facial tomorrow?',
      surface: 'customer',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'multi_service_availability_discovery',
    },
    {
      id: 'availability-manicure-pedicure-customer',
      prompt: 'When can I get manicure and pedicure together?',
      surface: 'customer',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['manicure', 'pedicure'],
      rescueReason: 'multi_service_availability_discovery',
    },
    {
      id: 'check-cart-availability-customer',
      prompt: 'Check availability for services in my cart',
      surface: 'customer',
      expectedAction: 'check_multi_service_availability',
      rescueReason: 'multi_availability',
    },
    {
      id: 'open-slots-haircut-color-customer',
      prompt: 'What times are open for haircut and color?',
      surface: 'customer',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['haircut', 'color'],
      rescueReason: 'multi_service_availability_discovery',
    },
    {
      id: 'need-massage-facial-tomorrow-customer',
      prompt: 'I need massage and facial tomorrow evening',
      surface: 'customer',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'multi_service_availability_discovery',
    },
    {
      id: 'check-multi-service-availability-public',
      prompt: 'Check multi-service availability',
      surface: 'public',
      expectedAction: 'check_multi_service_availability',
      rescueReason: 'multi_availability',
    },
    {
      id: 'massage-facial-same-afternoon-public',
      prompt: 'When can I get massage and facial together this afternoon?',
      surface: 'public',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'multi_service_availability_discovery',
    },
    {
      id: 'who-free-massage-facial-public',
      prompt: 'Who is free for massage and facial this week?',
      surface: 'public',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'multi_service_availability_discovery',
    },
    {
      id: 'when-manicure-pedicure-public',
      prompt: 'When can I book manicure and pedicure together?',
      surface: 'public',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['manicure', 'pedicure'],
      rescueReason: 'multi_service_availability_discovery',
    },
    {
      id: 'check-cart-availability-public',
      prompt: 'Check availability for my cart services',
      surface: 'public',
      expectedAction: 'check_multi_service_availability',
      rescueReason: 'multi_availability',
    },
    {
      id: 'open-blocks-color-blowdry-public',
      prompt: 'Show open multi-service blocks for color and blowdry',
      surface: 'public',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['color', 'blowdry'],
      rescueReason: 'multi_availability',
    },
    {
      id: 'find-time-spa-treatments-public',
      prompt: 'Find a time for massage and facial on the same day',
      surface: 'public',
      expectedAction: 'check_multi_service_availability',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'multi_service_availability_discovery',
    },
  ];

export const ADD_MULTI_SERVICE_CART_PROMPTS: readonly MultiServiceCustomerPublicPromptFixture[] =
  [
    {
      id: 'add-massage-facial-cart-customer',
      prompt: 'Add massage and facial to my cart',
      surface: 'customer',
      expectedAction: 'add_services_to_cart',
      serviceNames: ['massage', 'facial'],
      rescueReason: 'add_cart',
    },
    {
      id: 'add-haircut-color-cart-public',
      prompt: 'Add haircut and color to cart',
      surface: 'public',
      expectedAction: 'add_services_to_cart',
      serviceNames: ['haircut', 'color'],
      rescueReason: 'add_cart',
    },
  ];

export const MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS: readonly MultiServiceCustomerPublicPromptFixture[] =
  [
    ...BOOK_MULTI_SERVICE_PROMPTS,
    ...CHECK_MULTI_SERVICE_AVAILABILITY_PROMPTS,
    ...ADD_MULTI_SERVICE_CART_PROMPTS,
  ];

export type MultiServiceCompoundPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  orderedActions: SelfServiceBookingIntent[];
};

export const MULTI_SERVICE_COMPOUND_PROMPTS: readonly MultiServiceCompoundPromptFixture[] =
  [
    {
      id: 'add-then-check-customer',
      prompt:
        'Add massage and facial to cart and check multi-service availability',
      surface: 'customer',
      orderedActions: [
        'add_services_to_cart',
        'check_multi_service_availability',
      ],
    },
    {
      id: 'check-then-book-public',
      prompt:
        'Check availability for massage and facial and book multi-service together',
      surface: 'public',
      orderedActions: [
        'check_multi_service_availability',
        'book_multi_service',
      ],
    },
  ];

export function extractMultiServiceNamesFromPrompt(prompt: string): string[] {
  return extractServiceNamesFromPrompt(prompt);
}

export function enrichMultiServiceBookingParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const existing = Array.isArray(next.serviceNames)
    ? (next.serviceNames as string[])
    : [];
  if (!existing.length) {
    const names = extractMultiServiceNamesFromPrompt(prompt);
    if (names.length) next.serviceNames = names;
  }
  return next;
}

export function isPublicMultiServiceCompoundPrompt(prompt: string): boolean {
  if (!isCustomerBookingCompoundPrompt(prompt)) return false;
  const steps = decomposeCustomerBookingCompoundPrompt(prompt);
  if (steps.length < 2) return false;
  return steps.every((step) =>
    (PUBLIC_MULTI_SERVICE_BOOKING_INTENTS as readonly string[]).includes(
      step.action,
    ),
  );
}

export function decomposePublicMultiServiceCompoundPrompt(
  prompt: string,
): ReturnType<typeof decomposeCustomerBookingCompoundPrompt> {
  return decomposeCustomerBookingCompoundPrompt(prompt);
}

const MULTI_SERVICE_RESCUE_ACTIONS = new Set<string>([
  'book_multi_service',
  'check_multi_service_availability',
  'add_services_to_cart',
]);

export function rescueMultiServiceCustomerPublicIntent(
  prompt: string,
  action: string,
): {
  action: PublicMultiServiceBookingIntent;
  rescueReason: string;
} | null {
  const rescued = rescueSelfServiceBookingIntent(prompt, action);
  if (!rescued || !MULTI_SERVICE_RESCUE_ACTIONS.has(rescued.action)) {
    return null;
  }
  return {
    action: rescued.action as PublicMultiServiceBookingIntent,
    rescueReason: rescued.rescueReason,
  };
}

export function detectMultiServiceCustomerPublicAction(
  prompt: string,
): MultiServiceCustomerPublicPromptFixture['expectedAction'] | null {
  return (
    rescueMultiServiceCustomerPublicIntent(prompt, 'unknown')?.action ?? null
  );
}
