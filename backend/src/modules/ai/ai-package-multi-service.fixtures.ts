/** Classifier rules for dashboard staff package & multi-service flows (ai-cmd-h3.3). */
export const DASHBOARD_PACKAGE_MULTI_CLASSIFIER_RULES = `- create_package_booking: staff-assisted package visit booking for a named customer. Requires packageName, customerName, date, timeSlot (or packageLines after per-line availability). Triggers: "book spa day package for James Friday 2pm", "book the Deluxe package for customer Maria". NOT create_package (catalog CRUD) or book_package (customer self-service).
- create_multi_service_booking: staff-assisted same-visit or sequential multi-service booking. Requires serviceNames (≥2), customerName, employeeName, date, timeSlot. Triggers: "book haircut and beard trim for Maria Tuesday 10am with Anna". NOT book_multi_service (customer).
- check_package_line_availability: READ — per-line open slots for each service in a package on a date. Use before create_package_booking when user asks "check package line availability", "which package lines are free", or compound check-then-book. Set packageName, date.
- check_multi_service_block_availability: READ — block/slot availability for multiple services in one visit. Use before create_multi_service_booking. Set serviceNames (or inherit cart), date.
- earliest_slot_all_services: READ — earliest slot that fits all cart/package services. Use when user asks "earliest time for all services" / "soonest block for haircut and beard trim".
- Staff cart: "add haircut and beard trim to cart" accumulates serviceNames in session — not add_services_to_cart (customer). Follow-up "check block availability" / "book for Maria" inherits serviceNames.
- Package/multi checkout compound (one message): check_package_line_availability or check_multi_service_block_availability THEN create_package_booking or create_multi_service_booking — inherit packageName/serviceNames, date, customerName, employeeName across steps. Multi-step execution is automatic.
- Example compound: "Check package line availability for Spa Day tomorrow and book for James at 2pm" → check_package_line_availability then create_package_booking, packageName=Spa Day, customerName=James, timeSlot=14:00.
- Example compound: "Add haircut and beard trim to cart, check block availability Tuesday, book for Maria at 10am with Anna" → check_multi_service_block_availability then create_multi_service_booking.
- Example follow-up: after check_package_line_availability, "book for James at 2pm" → create_package_booking, inherit packageName and date from session.
- Example follow-up: after check_multi_service_block_availability, "book for Maria at 10am" → create_multi_service_booking, inherit serviceNames and date from session.`;

export type PackageCheckoutPromptFixture = {
  id: string;
  prompt: string;
  packageName: string;
  customerName?: string;
  employeeName?: string;
  date?: string;
  timeSlot?: string;
  orderedActions: [string, string];
};

export type MultiServiceCheckoutPromptFixture = {
  id: string;
  prompt: string;
  serviceNames: string[];
  customerName?: string;
  employeeName?: string;
  date?: string;
  timeSlot?: string;
  orderedActions: [string, string];
};

/** Natural-language variants for package check-then-book checkout compounds (ai-cmd-h4.1). */
export const PACKAGE_CHECKOUT_PROMPTS: PackageCheckoutPromptFixture[] = [
  {
    id: 'spa-day-check-book',
    prompt:
      'Check package line availability for Spa Day tomorrow and book for James at 2pm',
    packageName: 'Spa Day',
    customerName: 'James',
    date: 'tomorrow',
    timeSlot: '14:00',
    orderedActions: [
      'check_package_line_availability',
      'create_package_booking',
    ],
  },
  {
    id: 'spa-day-friday-book',
    prompt:
      'Check package line availability for Spa Day Friday and book for Maria at 10am with Anna',
    packageName: 'Spa Day',
    customerName: 'Maria Lopez',
    employeeName: 'Anna Kim',
    date: 'Friday',
    timeSlot: '10:00',
    orderedActions: [
      'check_package_line_availability',
      'create_package_booking',
    ],
  },
  {
    id: 'package-lines-free-book',
    prompt:
      'Check package line availability for Spa Day Tuesday; book for James at 3pm',
    packageName: 'Spa Day',
    customerName: 'James',
    date: 'Tuesday',
    timeSlot: '15:00',
    orderedActions: [
      'check_package_line_availability',
      'create_package_booking',
    ],
  },
];

export const SIMILAR_PACKAGE_CHECKOUT_PROMPTS: PackageCheckoutPromptFixture[] =
  [
    {
      id: 'check-lines-comma-book',
      prompt:
        'Check package line availability for Spa Day tomorrow, book for James at 2pm',
      packageName: 'Spa Day',
      customerName: 'James',
      orderedActions: [
        'check_package_line_availability',
        'create_package_booking',
      ],
    },
    {
      id: 'package-availability-and-book',
      prompt:
        'Show package line availability for Spa Day tomorrow and book for Maria at 11am',
      packageName: 'Spa Day',
      customerName: 'Maria Lopez',
      timeSlot: '11:00',
      orderedActions: [
        'check_package_line_availability',
        'create_package_booking',
      ],
    },
    {
      id: 'find-package-slots-then-book',
      prompt:
        'Find package visit times for Spa Day Friday and book for James at 4pm',
      packageName: 'Spa Day',
      customerName: 'James',
      timeSlot: '16:00',
      orderedActions: [
        'check_package_line_availability',
        'create_package_booking',
      ],
    },
  ];

/** Natural-language variants for multi-service cart + check + book compounds (ai-cmd-h4.1). */
export const MULTI_SERVICE_CHECKOUT_PROMPTS: MultiServiceCheckoutPromptFixture[] =
  [
    {
      id: 'cart-block-book',
      prompt:
        'Add haircut and beard trim to cart, check block availability Tuesday, and book for Maria at 10am with Anna',
      serviceNames: ['haircut', 'beard trim'],
      customerName: 'Maria Lopez',
      employeeName: 'Anna Kim',
      date: 'Tuesday',
      timeSlot: '10:00',
      orderedActions: [
        'check_multi_service_block_availability',
        'create_multi_service_booking',
      ],
    },
    {
      id: 'check-block-book-multi',
      prompt:
        'Add haircut and beard trim to cart, check multi-service block availability tomorrow, book for Maria at 2pm with Anna',
      serviceNames: ['haircut', 'beard trim'],
      customerName: 'Maria Lopez',
      employeeName: 'Anna Kim',
      date: 'tomorrow',
      timeSlot: '14:00',
      orderedActions: [
        'check_multi_service_block_availability',
        'create_multi_service_booking',
      ],
    },
    {
      id: 'two-services-book',
      prompt:
        'Add haircut and color to cart, check block availability Wednesday, and book for James at 9am with Gevorg',
      serviceNames: ['haircut', 'color'],
      customerName: 'James',
      employeeName: 'Gevorg Gasparyan',
      date: 'Wednesday',
      timeSlot: '09:00',
      orderedActions: [
        'check_multi_service_block_availability',
        'create_multi_service_booking',
      ],
    },
  ];

export const SIMILAR_MULTI_SERVICE_CHECKOUT_PROMPTS: MultiServiceCheckoutPromptFixture[] =
  [
    {
      id: 'cart-then-check-book',
      prompt:
        'Add haircut and beard trim to cart; check block availability Tuesday; book for Maria at 10am with Anna',
      serviceNames: ['haircut', 'beard trim'],
      customerName: 'Maria Lopez',
      employeeName: 'Anna Kim',
      orderedActions: [
        'check_multi_service_block_availability',
        'create_multi_service_booking',
      ],
    },
    {
      id: 'multi-service-slots-book',
      prompt:
        'Add haircut and beard trim to cart, check multi-service block availability Friday, book for Maria at 11am',
      serviceNames: ['haircut', 'beard trim'],
      customerName: 'Maria Lopez',
      timeSlot: '11:00',
      orderedActions: [
        'check_multi_service_block_availability',
        'create_multi_service_booking',
      ],
    },
    {
      id: 'block-check-comma-book',
      prompt:
        'Add haircut and beard trim to cart, check block availability on Tuesday, book for Maria at 10am with Anna',
      serviceNames: ['haircut', 'beard trim'],
      customerName: 'Maria Lopez',
      employeeName: 'Anna Kim',
      orderedActions: [
        'check_multi_service_block_availability',
        'create_multi_service_booking',
      ],
    },
  ];

export const ALL_PACKAGE_CHECKOUT_PROMPTS = [
  ...PACKAGE_CHECKOUT_PROMPTS,
  ...SIMILAR_PACKAGE_CHECKOUT_PROMPTS,
];

export const ALL_MULTI_SERVICE_CHECKOUT_PROMPTS = [
  ...MULTI_SERVICE_CHECKOUT_PROMPTS,
  ...SIMILAR_MULTI_SERVICE_CHECKOUT_PROMPTS,
];
