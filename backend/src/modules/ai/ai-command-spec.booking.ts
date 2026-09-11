/**
 * AI-ROADMAP Phase 1 - sixth domain slice: `booking` (registry `public-booking`).
 *
 * 66 registry entries - the largest slice so far and the most read-heavy: 40
 * reads to 26 mutations. It is the customer-facing surface, and §28 measured
 * customer as 69% of all traffic at the worst completion rate, so these are the
 * commands the north-star metric is mostly made of.
 *
 * Three commands look like writes and are registered as reads. All three were
 * checked against their handlers before speccing, and all three are correct:
 * `book_another_service` and `complete_intake_and_book` return a `navigate`
 * target rather than creating anything, and `add_booking_to_calendar` builds a
 * calendar link. Naming is not evidence - e2e-bug.377 was found by reading the
 * handler, and so was the absence of a defect here.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const BOOKING_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'booking.add_to_calendar',
    aliases: ['add_booking_to_calendar'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Give the customer a calendar link for their booking.',
    // §190 (C2/T0) — `parseAddBookingToCalendarFromPrompt` supplies the booking
    // and format; the handler adds `locale`.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking in question.',
        required: false,
        resolver: 'appointment',
      },
      sessionBookingId: {
        type: 'string',
        description:
          'Booking the client is currently viewing, used when none is named.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Service, used to find the booking when no id is given.',
        required: false,
        resolver: 'service',
      },
      format: {
        type: 'string',
        description: 'Calendar format wanted (ics, Google, …).',
        required: false,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Locale for the calendar entry.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add this to my calendar', 'send me a calendar invite'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.book_another_service',
    aliases: ['book_another_service'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description:
      'Route the customer to book an additional service. Returns a navigation target; creates nothing.',
    // §190 (C2/T0) — the anchor booking plus what to add.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking in question.',
        required: false,
        resolver: 'appointment',
      },
      sessionBookingId: {
        type: 'string',
        description:
          'Booking the client is currently viewing, used when none is named.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Service to book alongside the anchor.',
        required: false,
        resolver: 'service',
      },
      sameDay: {
        type: 'boolean',
        description: 'Keep the new booking on the same day.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['I want to book something else too', 'add another service'],
    confirm: 'never',
    // Registered READ and correct: the handler returns `navigate`, not a booking.
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.help',
    aliases: ['booking_help'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain how booking works on the public page.',
    variables: {},
    examples: ['how do I book', 'help me make a booking'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.business_info',
    aliases: ['business_info'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description:
      'Answer questions about the business - hours, address, contact.',
    variables: {},
    examples: ['what are your opening hours', 'where are you'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.check_availability',
    aliases: ['check_availability'],
    domain: 'booking',
    surfaces: ['dashboard', 'provider', 'public', 'customer'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['staff', 'manager', 'owner'],
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Check what appointment slots are free.',
    // §211 (C2/T0) — `enrichDashboardCheckAvailabilityParams` adds the service
    // pair; `parseTimeWindow` and `parseTimeOfDayWindow` read the two time shapes.
    variables: {
      date: {
        type: 'string',
        description: 'Day to check.',
        required: false,
        resolver: 'date',
      },
      serviceName: {
        type: 'string',
        description: 'Service, by name.',
        required: false,
        resolver: 'service',
      },
      serviceCategory: {
        type: 'string',
        description: 'Service category, used when no service is named.',
        required: false,
        resolver: 'service',
      },
      timeFrom: {
        type: 'string',
        description: 'Start of the time window.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'End of the time window.',
        required: false,
        resolver: 'none',
      },
      timeOfDay: {
        type: 'string',
        description: 'Part of the day wanted (morning, afternoon).',
        required: false,
        resolver: 'none',
      },
      dayPart: {
        type: 'string',
        description: 'Part of the day wanted (alternate key).',
        required: false,
        resolver: 'none',
      },
      timeSlot: {
        type: 'string',
        description: 'Specific start time.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'what is free on friday',
      'do you have anything tomorrow',
      'is Gevorg open tomorrow morning for Swedish massage',
      'Check availability for Swedish massage on 02/08/2026',
    ],
    confirm: 'never',
    handler: 'AiCommandService',
  },
  {
    id: 'booking.check_multi_service_availability',
    aliases: ['check_multi_service_availability'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Check whether several services can be booked in one visit.',
    variables: {},
    examples: [
      'can I do a massage and facial together',
      'is a spa day possible',
    ],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.check_package_availability',
    aliases: ['check_package_availability'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Check whether a package can be scheduled.',
    // §190 (C2/T0) — `resolvePackageId` reads either field, falling back to
    // extracting the name from the prompt.
    variables: {
      packageId: {
        type: 'string',
        description: 'Package to check.',
        required: false,
        resolver: 'none',
      },
      packageName: {
        type: 'string',
        description: 'Package by name, when no id is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['can I book the bridal package', 'is the bundle available'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.check_waitlist_status',
    aliases: ['check_waitlist_status'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Report the customer position on a waitlist.',
    variables: {},
    examples: ['where am I on the waitlist', 'any news on my waitlist spot'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.complete_intake_and_book',
    aliases: ['complete_intake_and_book'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description:
      'Route the customer to finish an intake form and then book. Returns a navigation target.',
    // §214 (C2/T0) — the intake-then-book compound entry.
    variables: {
      completeIntakeAndBook: {
        type: 'boolean',
        description: 'Set when the intake and booking are done together.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      serviceName: {
        type: 'string',
        description: 'Service to book.',
        required: false,
        resolver: 'service',
      },
      bookingFirstAvailable: {
        type: 'boolean',
        description: 'Take the first available slot.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      customerId: {
        type: 'string',
        description: 'Customer, by id.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Customer from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['finish my intake and book', 'complete the form and book me in'],
    confirm: 'never',
    // Registered READ. The handler returns `navigate`; it calls
    // `ensureCustomerDraft`, which is an idempotent get-or-create of a draft
    // rather than a booking, and draft creation has its own MUT command
    // (`create_intake_draft`).
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.confirm_my_details',
    aliases: ['confirm_my_booking_details'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Show the customer their booking details for confirmation.',
    // §190 (C2/T0) — booking identification plus the aspect being confirmed;
    // `resolveManageBookingCredentials` also accepts a pasted manage link.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking in question.',
        required: false,
        resolver: 'appointment',
      },
      sessionBookingId: {
        type: 'string',
        description:
          'Booking the client is currently viewing, used when none is named.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Service, used to find the booking when no id is given.',
        required: false,
        resolver: 'service',
      },
      aspect: {
        type: 'string',
        description: 'Which detail to confirm.',
        required: false,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Locale for the reply.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what are my booking details', 'confirm my appointment details'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_cancel_policy',
    aliases: ['explain_cancel_policy'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the cancellation policy that applies.',
    // §190 (C2/T0) — the booking whose policy is being explained; the settings
    // come from the business, not params.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking in question.',
        required: false,
        resolver: 'appointment',
      },
      sessionBookingId: {
        type: 'string',
        description:
          'Booking the client is currently viewing, used when none is named.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is your cancellation policy', 'can I cancel for free'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_clinic_booking_fields',
    aliases: ['explain_clinic_booking_fields'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the extra fields a clinic booking asks for.',
    // §190 (C2/T0) — one aspect, via the enrichment helper.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which clinic booking field to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'why do you need my date of birth',
      'what are these clinic fields',
    ],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_deposit_forfeiture',
    aliases: ['explain_deposit_forfeiture'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain when a deposit is kept rather than refunded.',
    variables: {},
    examples: [
      'do I lose my deposit if I cancel',
      'when is the deposit non refundable',
    ],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_lab_prep',
    aliases: ['explain_lab_prep'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain how to prepare for a lab appointment.',
    // §190 (C2/T0) — one service, via the enrichment helper.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Lab service whose preparation is being explained.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['how do I prepare for the blood test', 'do I need to fast'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_manage_booking_context',
    aliases: ['explain_manage_booking_context'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain what can be changed from the manage-booking view.',
    variables: {},
    examples: [
      'what can I change about my booking',
      'what does manage booking do',
    ],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_manage_booking_page',
    aliases: ['explain_manage_booking_page'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain how to use the manage-booking page.',
    // §190 (C2/T0) — one `aspect`, read by the parser one level down.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the manage-booking page to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how do I use this page', 'explain the manage booking screen'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_multi_service_cart',
    aliases: ['explain_multi_service_cart'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain what is in the multi-service cart.',
    // §190 (C2/T0) — the cart contents, supplied by the client.
    variables: {
      cartServiceIds: {
        type: 'string[]',
        description: 'Service ids currently in the cart.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is in my cart', 'explain my spa day selection'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_package_savings',
    aliases: ['explain_package_savings'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain how much a package saves against booking separately.',
    // §190 (C2/T0) — `resolvePublicPackage` reads both, with the enrichment
    // helper filling the name from the prompt.
    variables: {
      packageName: {
        type: 'string',
        description:
          'Package in question. Extracted from the prompt when omitted.',
        required: false,
        resolver: 'none',
      },
      packageId: {
        type: 'string',
        description: 'Package id — tried first by `resolvePublicPackage`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['is the package worth it', 'how much do I save with the bundle'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_package_visit_rules',
    aliases: ['explain_package_visit_rules'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the rules governing package visits.',
    // §190 (C2/T0) — `resolvePublicPackage` reads both, with the enrichment
    // helper filling the name from the prompt.
    variables: {
      packageName: {
        type: 'string',
        description:
          'Package in question. Extracted from the prompt when omitted.',
        required: false,
        resolver: 'none',
      },
      packageId: {
        type: 'string',
        description: 'Package id — tried first by `resolvePublicPackage`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'how do package visits work',
      'can I use two package visits at once',
    ],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_post_visit_review_prompt',
    aliases: ['explain_post_visit_review_prompt'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the review request sent after a visit.',
    variables: {},
    examples: ['why are you asking me to review', 'what is this review prompt'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_preparation_notes',
    aliases: ['explain_preparation_notes'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain how to prepare for an appointment.',
    // §190 (C2/T0) — the widest of this batch: `parseExplainPreparationNotesFromPrompt`
    // reads the booking pair, the service and the aspect.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking whose preparation notes are wanted.',
        required: false,
        resolver: 'appointment',
      },
      sessionBookingId: {
        type: 'string',
        description: 'Booking the client is viewing, used when none is named.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Service, when asking about it rather than a booking.',
        required: false,
        resolver: 'service',
      },
      aspect: {
        type: 'string',
        description: 'Which preparation detail to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how should I prepare', 'anything I need to do before'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_provider_availability',
    aliases: ['explain_provider_availability'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain when a particular provider works.',
    // §190 (C2/T0) — **pass-through delegation**: this handler never dereferences
    // `params`, it hands the whole object to `handleCheckAvailability`, which reads
    // the eleven fields below. A `params.x` grep of the handler body reports
    // nothing, which would have made it look input-free. It also runs
    // `validateExplainProviderAvailabilityParams`, which reads none of its own.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service being looked for.',
        required: false,
        resolver: 'service',
      },
      serviceCategory: {
        type: 'string',
        description: 'Category to search within.',
        required: false,
        resolver: 'none',
      },
      serviceRank: {
        type: 'string',
        description:
          'Ranking hint (cheapest, premium) used to pick among matches.',
        required: false,
        resolver: 'none',
      },
      maxPrice: {
        type: 'number',
        description: 'Price ceiling.',
        required: false,
        resolver: 'money',
      },
      employeeName: {
        type: 'string',
        description: 'Preferred provider.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Search every provider.',
        required: false,
        resolver: 'none',
      },
      timeOfDay: {
        type: 'string',
        description: 'Part of the day wanted.',
        required: false,
        resolver: 'none',
      },
      timeFrom: {
        type: 'string',
        description: 'Earliest acceptable time.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'Latest acceptable time.',
        required: false,
        resolver: 'none',
      },
      timeSlot: {
        type: 'string',
        description: 'A specific slot.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['when does Gevorg work', 'what are their hours'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.explain_public_intake_form',
    aliases: ['explain_public_intake_form'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Explain the intake form shown before booking.',
    // §190 (C2/T0) — one `aspect`, read by the parser one level down.
    variables: {
      aspect: {
        type: 'string',
        description: 'Which part of the intake form to explain.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is this form for', 'why do I need to fill this in'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.explain_subscription_vs_one_time',
    aliases: ['explain_subscription_vs_one_time'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Compare subscribing against paying per visit.',
    variables: {},
    examples: [
      'should I subscribe or pay each time',
      'is the membership better value',
    ],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.find_evening_weekend_slots',
    aliases: ['find_evening_weekend_slots'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Find slots outside normal working hours.',
    // §190 (C2/T0) — **pass-through delegation**: this handler never dereferences
    // `params`, it hands the whole object to `handleCheckAvailability`, which reads
    // the eleven fields below. A `params.x` grep of the handler body reports
    // nothing, which would have made it look input-free.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service being looked for.',
        required: false,
        resolver: 'service',
      },
      serviceCategory: {
        type: 'string',
        description: 'Category to search within.',
        required: false,
        resolver: 'none',
      },
      serviceRank: {
        type: 'string',
        description:
          'Ranking hint (cheapest, premium) used to pick among matches.',
        required: false,
        resolver: 'none',
      },
      maxPrice: {
        type: 'number',
        description: 'Price ceiling.',
        required: false,
        resolver: 'money',
      },
      employeeName: {
        type: 'string',
        description: 'Preferred provider.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Several providers.',
        required: false,
        resolver: 'employee',
      },
      allProviders: {
        type: 'boolean',
        description: 'Search every provider.',
        required: false,
        resolver: 'none',
      },
      timeOfDay: {
        type: 'string',
        description: 'Part of the day wanted.',
        required: false,
        resolver: 'none',
      },
      timeFrom: {
        type: 'string',
        description: 'Earliest acceptable time.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'Latest acceptable time.',
        required: false,
        resolver: 'none',
      },
      timeSlot: {
        type: 'string',
        description: 'A specific slot.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['anything in the evening', 'do you have weekend appointments'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.find_services_under_budget',
    aliases: ['find_services_under_budget'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Find services within a price limit.',
    // §190 (C2/T0) — pass-through to `handleListServices`, so it inherits that
    // command's whole filter set; `enrichFindServicesUnderBudgetParamsFromPrompt`
    // adds `maxPrice` from the prompt via `extractMaxPriceFromBudgetPrompt`.
    variables: {
      maxPrice: {
        type: 'number',
        description: 'Budget ceiling. Extracted from the prompt when omitted.',
        required: false,
        resolver: 'money',
      },
      serviceCategory: {
        type: 'string',
        description: 'Category to search within.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Service to price-check.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['what can I get for 50', 'services under 100'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.get_intake_flow_status',
    aliases: ['get_intake_flow_status'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Report how far the customer has got through the intake flow.',
    variables: {},
    examples: ['where am I in the form', 'how much of the intake is left'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.get_manage_link',
    aliases: ['get_manage_link'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Give the customer the link to manage their booking.',
    // §190 (C2/T0) — `resolveParsedManageLink` reads the booking pair plus the
    // guest-lookup contact fields, which are how someone without a session proves
    // the booking is theirs.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking whose manage link is wanted.',
        required: false,
        resolver: 'appointment',
      },
      sessionBookingId: {
        type: 'string',
        description: 'Booking the client is viewing.',
        required: false,
        resolver: 'none',
      },
      guestLookup: {
        type: 'boolean',
        description:
          'Look the booking up by contact details rather than session.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      email: {
        type: 'string',
        description: 'Email the booking was made with.',
        required: false,
        resolver: 'none',
      },
      phone: {
        type: 'string',
        description: 'Phone the booking was made with.',
        required: false,
        resolver: 'none',
      },
      delivery: {
        type: 'string',
        description: 'How to send the link (email or SMS).',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['send me the manage link', 'how do I change my booking'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.list_my_appointments',
    aliases: ['list_my_appointments'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'List the customer appointments.',
    variables: {},
    examples: ['what appointments do I have', 'list my bookings'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.list_my_upcoming_appointments',
    aliases: ['list_my_upcoming_appointments'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'List the customer upcoming appointments only.',
    // §199 (C2/T0) — `parseListMyUpcomingAppointmentsFromPrompt` reads `scope`
    // from params before falling back to the prompt.
    variables: {
      scope: {
        type: 'string',
        description:
          'How far ahead to look: next, this_week or all_upcoming.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is coming up', 'my next appointments'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.list_providers',
    aliases: ['list_providers'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'List the providers who work here.',
    // §190 (C2/T0) — one filter.
    variables: {
      date: {
        type: 'string',
        description: 'Day to list providers for.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['who works there', 'list your staff'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.list_public_promotions',
    aliases: ['list_public_promotions'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'List current public offers.',
    variables: {},
    examples: ['any deals on', 'what promotions do you have'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.list_services',
    aliases: ['list_services'],
    domain: 'booking',
    surfaces: ['dashboard', 'public', 'customer'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'List the services offered.',
    // §190 (C2/T0) — the widest read in this cluster; `enrichListServicesParamsFromPrompt`
    // fills the service fields from the prompt when they are absent.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service to look up.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Several services.',
        required: false,
        resolver: 'service',
      },
      serviceCategory: {
        type: 'string',
        description: 'Category filter.',
        required: false,
        resolver: 'none',
      },
      serviceTier: {
        type: 'string',
        description: 'Tier filter.',
        required: false,
        resolver: 'none',
      },
      serviceRank: {
        type: 'string',
        description: 'Ranking hint used to order results.',
        required: false,
        resolver: 'none',
      },
      serviceCount: {
        type: 'number',
        description: 'How many services to return.',
        required: false,
        resolver: 'none',
      },
      minPrice: {
        type: 'number',
        description: 'Lowest price to include.',
        required: false,
        resolver: 'money',
      },
      maxPrice: {
        type: 'number',
        description: 'Highest price to include.',
        required: false,
        resolver: 'money',
      },
      maxTotalPrice: {
        type: 'number',
        description: 'Cap on the combined price of the results.',
        required: false,
        resolver: 'money',
      },
      minDurationMinutes: {
        type: 'number',
        description: 'Shortest service to include.',
        required: false,
        resolver: 'none',
      },
      preferShortDuration: {
        type: 'boolean',
        description: 'Prefer shorter services when ordering.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description: 'Restrict to services a provider offers.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['what do you offer', 'list your services'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.preview_multi_service_cart',
    aliases: ['preview_multi_service_cart'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Preview the multi-service cart before booking.',
    // §199 (C2/T0) — `resolveServices` reads the cart by id, then by name,
    // before falling back to names extracted from the prompt.
    variables: {
      cartServiceIds: {
        type: 'string[]',
        description: 'Services in the cart, by id.',
        required: false,
        resolver: 'service',
      },
      serviceIds: {
        type: 'string[]',
        description: 'Services in the cart, by id (alternate key).',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Services in the cart, by name.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Single service, when only one is named.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['show me my cart', 'preview my spa day'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.recommend_specialists',
    aliases: ['recommend_specialists'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'Recommend which provider suits what the customer wants.',
    // §190 (C2/T0) — read directly by the handler.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service to recommend specialists for.',
        required: false,
        resolver: 'service',
      },
      serviceCategory: {
        type: 'string',
        description: 'Category to recommend within.',
        required: false,
        resolver: 'none',
      },
      employeeRole: {
        type: 'string',
        description: 'Restrict to a staff role.',
        required: false,
        resolver: 'none',
      },
      maxPrice: {
        type: 'number',
        description: 'Price ceiling.',
        required: false,
        resolver: 'money',
      },
    },
    examples: ['who is best for colour', 'which stylist should I see'],
    confirm: 'never',
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.recover_lost_manage_link',
    aliases: ['recover_lost_manage_link'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Help a customer who has lost their manage-booking link.',
    // §199 (C2/T0) — `parseRecoverLostManageLinkFromPrompt` reads the guest
    // contact details and delivery channel from params before the prompt.
    variables: {
      email: {
        type: 'string',
        description:
          'Guest email the link should be looked up by or sent to.',
        required: false,
        resolver: 'customer',
      },
      phone: {
        type: 'string',
        description:
          'Guest phone the link should be looked up by or sent to.',
        required: false,
        resolver: 'customer',
      },
      delivery: {
        type: 'string',
        description: 'How to deliver it: link_only, email, sms or auto.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['I lost the link to my booking', 'resend my booking link'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.share_my_booking',
    aliases: ['share_my_booking'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description:
      'Give the customer something to share their booking with someone else.',
    // §199 (C2/T0) — `parseShareMyBookingFromPrompt` reads the booking;
    // `resolveBusinessSlugFromParamsOrId` reads the slug.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking to share.',
        required: false,
        resolver: 'appointment',
      },
      sessionBookingId: {
        type: 'string',
        description:
          'Booking the client is currently viewing, used when none is named.',
        required: false,
        resolver: 'none',
      },
      slug: {
        type: 'string',
        description: 'Business slug, used to build the share link.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'share my booking with my partner',
      'send these details to someone',
    ],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.show_cart_total_duration',
    aliases: ['show_cart_total_duration'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Report how long everything in the cart will take.',
    // §199 (C2/T0) — `parseCartServiceIds` reads the cart off params.
    variables: {
      cartServiceIds: {
        type: 'string[]',
        description: 'Services in the cart, by id.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['how long will this all take', 'total duration of my cart'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.sign_in_after_booking',
    aliases: ['sign_in_after_booking'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain how to create an account after booking as a guest.',
    // §199 (C2/T0) — `resolveGuestMergeHintFromParams` reads the guest
    // contact details; `resolveSessionBookingId` reads the booking.
    variables: {
      email: {
        type: 'string',
        description: 'Account email being signed in to.',
        required: false,
        resolver: 'customer',
      },
      guestEmail: {
        type: 'string',
        description: 'Email used on the guest booking, for merging.',
        required: false,
        resolver: 'customer',
      },
      phone: {
        type: 'string',
        description: 'Account phone being signed in with.',
        required: false,
        resolver: 'customer',
      },
      guestPhone: {
        type: 'string',
        description: 'Phone used on the guest booking, for merging.',
        required: false,
        resolver: 'customer',
      },
      bookingId: {
        type: 'string',
        description: 'Booking just made, to attach to the account.',
        required: false,
        resolver: 'appointment',
      },
      sessionBookingId: {
        type: 'string',
        description:
          'Booking from the current session, used when none is named.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how do I make an account now', 'sign me in after booking'],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.sign_in_to_manage_booking',
    aliases: ['sign_in_to_manage_booking'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain how to sign in to manage an existing booking.',
    // §199 (C2/T0) — `parseSignInToManageBookingFromPrompt` reads `aspect`
    // from the enriched params before falling back to the prompt.
    variables: {
      aspect: {
        type: 'string',
        description:
          'Which help is wanted: manage_hint, invalid_link or account_path.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'how do I sign in to change my booking',
      'log me in to manage it',
    ],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.suggest_package_block',
    aliases: ['suggest_package_block'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Suggest booking package visits as one block.',
    // §199 (C2/T0) — `resolvePackageId` reads the package by id then by name.
    variables: {
      packageId: {
        type: 'string',
        description: 'Package to build the block for.',
        required: false,
        resolver: 'none',
      },
      packageName: {
        type: 'string',
        description: 'Package by name, when no id is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'can I do all my package visits together',
      'suggest a block for my package',
    ],
    confirm: 'never',
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.add_services_to_cart',
    aliases: ['add_services_to_cart'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Add services to the multi-service cart.',
    // §177 (C2/T1) — `resolveServices` reads the four service fields; the
    // handler refuses with `missing: ['serviceNames']`.
    variables: {
      serviceNames: {
        type: 'string[]',
        description: 'Services to add to the cart.',
        required: true,
        resolver: 'service',
      },
      serviceIds: {
        type: 'string[]',
        description: 'Services by id, when known.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Single service, as an alternative to the list.',
        required: false,
        resolver: 'service',
      },
      cartServiceIds: {
        type: 'string[]',
        description: 'Ids already in the cart, supplied by the client.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add a facial to my cart', 'also book a manicure'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'booking.remove_service_from_cart',
      captures: ['cartId', 'previousItems'],
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.remove_service_from_cart',
    aliases: ['remove_service_from_cart'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Remove a service from the multi-service cart.',
    // §177 (C2/T1) — same `resolveServices` family, plus `serviceId` for removing
    // one row directly.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service to remove.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Services to remove.',
        required: false,
        resolver: 'service',
      },
      serviceId: {
        type: 'string',
        description: 'Service to remove, by id.',
        required: false,
        resolver: 'service',
      },
      serviceIds: {
        type: 'string[]',
        description: 'Services to remove, by id.',
        required: false,
        resolver: 'service',
      },
      cartServiceIds: {
        type: 'string[]',
        description: 'Ids currently in the cart, supplied by the client.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['take the facial out', 'remove that from my cart'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'booking.add_services_to_cart',
      captures: ['cartId', 'previousItems'],
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.book_multi_service',
    aliases: ['book_multi_service'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Book several services in one visit.',
    variables: {
      // `handleBookMultiServiceLogic` -> `resolveServices`. Nothing is
      // required: with no names it falls back to the session cart, and with
      // neither it returns `missing: ['serviceNames']` rather than failing.
      serviceNames: {
        type: 'string[]',
        description:
          'Services to book together. Falls back to names found in the message, then to the session cart.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'A single service, when only one was named.',
        required: false,
        resolver: 'service',
      },
      blockStartTime: {
        type: 'string',
        description:
          'Start of the chosen time block. Without it the reply sends the customer to the block picker instead of checkout.',
        required: false,
        resolver: 'datetime',
      },
    },
    examples: ['book a massage and a facial', 'book my spa day'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.book_package',
    aliases: ['book_package'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Book the visits that make up a package.',
    variables: {
      // `handleBookPackageLogic` -> `resolvePackageId`. `packageName` is the
      // only way to name a package in words; without one the handler returns
      // `missing: ['packageName']` and sends the customer to the package list.
      packageName: {
        type: 'string',
        description:
          'Package to book. Falls back to a package name found in the message.',
        required: false,
        resolver: 'none',
      },
      bookingFirstAvailable: {
        type: 'boolean',
        description:
          'Take the earliest block the package fits into, instead of asking for a date.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      date: {
        type: 'string',
        description: 'Day to book the package block on.',
        required: false,
        resolver: 'date',
      },
      blockStartTime: {
        type: 'string',
        description: 'Start of the chosen block, once one has been picked.',
        required: false,
        resolver: 'datetime',
      },
    },
    examples: ['book my bridal package', 'schedule the bundle'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.book_with_cash',
    aliases: ['book_with_cash'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Book an appointment to be paid for in cash.',
    variables: {},
    examples: [
      'book it and I will pay cash',
      'reserve it, paying at the venue',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.book_with_gift_card',
    aliases: ['book_with_gift_card'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Book an appointment paid for with a gift card.',
    variables: {
      // `enrichBookWithGiftCardParamsFromPrompt` prefers a supplied
      // `giftCardCode` over the one it extracts from the message, so this is a
      // real input even though the handler itself only reads `_prompt`.
      giftCardCode: {
        type: 'string',
        description:
          'Gift card to pay with. Falls back to a code found in the message; the customer is asked at checkout if neither has one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['book it using my gift card', 'pay with the gift card'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.use_subscription_credit',
    aliases: ['use_subscription_credit'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Book a visit against a subscription credit.',
    variables: {
      // `handleUseSubscriptionCreditLogic`. Optional on purpose: with one
      // active subscription the handler picks it, and the id it accepts is one
      // it handed back in an earlier reply, not something a planner invents.
      subscriptionId: {
        type: 'string',
        description:
          'Which membership to draw the credit from. Defaults to the only active one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['use my membership credit', 'book with my subscription'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.select_subscription_plan',
    aliases: ['select_subscription_plan'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Choose a subscription plan to join.',
    variables: {
      // `handleSelectSubscriptionPlanLogic`. With no name it selects the first
      // plan on offer, so `required: true` would block a prompt the handler
      // already answers.
      planName: {
        type: 'string',
        description:
          'Plan to join. Defaults to the first plan available; an unmatched name comes back as a clarification listing the real ones.',
        required: false,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description:
          'Narrow the plans on offer to the ones covering one service.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['I want the gold plan', 'pick the monthly membership'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.cancel_all_upcoming',
    aliases: ['cancel_all_upcoming_bookings'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T3',
    description: 'Cancel every upcoming booking the customer has.',
    variables: {
      // tech-debt C2 — `handleCancelAllUpcomingBookingsLogic`. `_prompt`,
      // `conversationHistory` and `sessionCustomerId` are pipeline- or
      // session-injected and deliberately not declared.
      //
      // T3 and destructive: without `bookingIds` this cancels *every* upcoming
      // booking the customer has, so the list is the difference between "some"
      // and "all".
      confirm: {
        type: 'boolean',
        description:
          'Proceed with the cancellation. Without it the command previews what would be cancelled and asks.',
        required: false,
        resolver: 'none',
      },
      bookingIds: {
        type: 'string[]',
        description:
          'Restrict the cancellation to these bookings. Omit to cancel every upcoming booking.',
        required: false,
        resolver: 'appointment',
      },
    },
    examples: ['cancel everything', 'cancel all my appointments'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The customer has been told the booking is cancelled and the slot may already be taken.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.cancel_with_token',
    aliases: ['cancel_booking_with_token'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Cancel a booking using a manage-booking link.',
    // §177 (C2/T1) — credentials come from `resolveManageBookingCredentials`,
    // which reads `bookingId` and `manageToken` and otherwise falls back to
    // `extractManageLinkCredentialsFromPrompt` on a pasted manage link. A grep of
    // the handler body shows only `_prompt`, because the reads happen two levels
    // down — the recurring under-report this campaign keeps hitting.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking the manage link refers to.',
        required: true,
        resolver: 'none',
      },
      manageToken: {
        type: 'string',
        description:
          'Token from the customer\u2019s manage link. Extracted from a pasted link when not supplied as a param.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['cancel my booking', 'I need to cancel'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The customer has been told the booking is cancelled and the slot may already be taken.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.cancel_my_subscription',
    aliases: ['cancel_my_subscription'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Cancel the customer own subscription.',
    variables: {
      // `handleCancelMySubscriptionLogic`. Not required — with one active
      // membership it cancels that one, and with several it asks. Marking it
      // required would make "cancel my membership" undeliverable for the
      // common case, which is e2e-bug.399's shape.
      subscriptionId: {
        type: 'string',
        description:
          'Which membership to cancel. Defaults to the only active one; with more than one the customer is asked which.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['cancel my membership', 'stop my subscription'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Cancelling stops billing and confirms to the customer; resubscribing is a new agreement.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.cancel_package_visit_self',
    aliases: ['cancel_package_visit_self'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Cancel one visit from a package.',
    // §177 (C2/T1) — the signed-in variant: the customer comes from
    // `resolveSessionCustomerId` (session, not user input), and the visit is
    // named by any one of three fields.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Package visit to act on.',
        required: false,
        resolver: 'appointment',
      },
      packageName: {
        type: 'string',
        description:
          'Package the visit belongs to, when no booking id is given.',
        required: false,
        resolver: 'none',
      },
      visitIndex: {
        type: 'number',
        description:
          'Which visit in the package (\u201cvisit 2 of my package\u201d).',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'cancel my package visit on friday',
      'drop one of my package sessions',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The customer has been told the booking is cancelled and the slot may already be taken.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.cancel_package_visit_with_token',
    aliases: ['cancel_package_visit_with_token'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Cancel a package visit using a manage-booking link.',
    // §177 (C2/T1) — credentials come from `resolveManageBookingCredentials`,
    // which reads `bookingId` and `manageToken` and otherwise falls back to
    // `extractManageLinkCredentialsFromPrompt` on a pasted manage link. A grep of
    // the handler body shows only `_prompt`, because the reads happen two levels
    // down — the recurring under-report this campaign keeps hitting.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking the manage link refers to.',
        required: true,
        resolver: 'none',
      },
      manageToken: {
        type: 'string',
        description:
          'Token from the customer\u2019s manage link. Extracted from a pasted link when not supplied as a param.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['cancel this package visit', 'cancel the session in my link'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The customer has been told the booking is cancelled and the slot may already be taken.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.reschedule_with_token',
    aliases: ['reschedule_booking_with_token'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Move a booking using a manage-booking link.',
    // §177 (C2/T1) — credentials come from `resolveManageBookingCredentials`,
    // which reads `bookingId` and `manageToken` and otherwise falls back to
    // `extractManageLinkCredentialsFromPrompt` on a pasted manage link. A grep of
    // the handler body shows only `_prompt`, because the reads happen two levels
    // down — the recurring under-report this campaign keeps hitting. The new time is required:
    // the handler refuses with `missing: ['startTime']`.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking the manage link refers to.',
        required: true,
        resolver: 'none',
      },
      manageToken: {
        type: 'string',
        description:
          'Token from the customer\u2019s manage link. Extracted from a pasted link when not supplied as a param.',
        required: true,
        resolver: 'none',
      },
      startTime: {
        type: 'string',
        description:
          'New start time (ISO). Built from `date` + `timeSlot` when absent.',
        required: false,
        resolver: 'datetime',
      },
      date: {
        type: 'string',
        description:
          'New day, used with `timeSlot` when no `startTime` is given.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description:
          'New time of day. Defaults to 09:00 when only a date is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['move my booking to friday', 'reschedule my appointment'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'booking.reschedule_with_token',
      captures: ['bookingId', 'originalStart'],
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.reschedule_package_lines',
    aliases: ['reschedule_package_lines'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T3',
    description: 'Move several package visits at once.',
    variables: {},
    examples: ['move all my package visits', 'reschedule the whole package'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Moves several bookings at once; restoring them needs per-visit pre-state.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.reschedule_package_visit_self',
    aliases: ['reschedule_package_visit_self'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Move one visit from a package.',
    // §177 (C2/T1) — as `cancel_package_visit_self`, plus the new time.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Package visit to act on.',
        required: false,
        resolver: 'appointment',
      },
      packageName: {
        type: 'string',
        description:
          'Package the visit belongs to, when no booking id is given.',
        required: false,
        resolver: 'none',
      },
      visitIndex: {
        type: 'number',
        description:
          'Which visit in the package (\u201cvisit 2 of my package\u201d).',
        required: false,
        resolver: 'none',
      },
      startTime: {
        type: 'string',
        description:
          'New start time (ISO). Built from `date` + `timeSlot` when absent.',
        required: false,
        resolver: 'datetime',
      },
      date: {
        type: 'string',
        description:
          'New day, used with `timeSlot` when no `startTime` is given.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description:
          'New time of day. Defaults to 09:00 when only a date is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['move my package visit to tuesday', 'reschedule that session'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'booking.reschedule_package_visit_self',
      captures: ['bookingId', 'originalStart'],
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.reschedule_package_visit_with_token',
    aliases: ['reschedule_package_visit_with_token'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Move a package visit using a manage-booking link.',
    // §177 (C2/T1) — credentials come from `resolveManageBookingCredentials`,
    // which reads `bookingId` and `manageToken` and otherwise falls back to
    // `extractManageLinkCredentialsFromPrompt` on a pasted manage link. A grep of
    // the handler body shows only `_prompt`, because the reads happen two levels
    // down — the recurring under-report this campaign keeps hitting. The new time is required:
    // the handler refuses with `missing: ['startTime']`.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking the manage link refers to.',
        required: true,
        resolver: 'none',
      },
      manageToken: {
        type: 'string',
        description:
          'Token from the customer\u2019s manage link. Extracted from a pasted link when not supplied as a param.',
        required: true,
        resolver: 'none',
      },
      startTime: {
        type: 'string',
        description:
          'New start time (ISO). Built from `date` + `timeSlot` when absent.',
        required: false,
        resolver: 'datetime',
      },
      date: {
        type: 'string',
        description:
          'New day, used with `timeSlot` when no `startTime` is given.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description:
          'New time of day. Defaults to 09:00 when only a date is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['reschedule this package visit', 'move the session in my link'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'booking.reschedule_package_visit_with_token',
      captures: ['bookingId', 'originalStart'],
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.change_provider_on_reschedule',
    aliases: ['change_provider_on_reschedule'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Change which provider will carry out a rescheduled booking.',
    // §177 (C2/T1) — the whole input is the provider being switched to;
    // `resolveCustomerSelfServiceSettings` reads business settings, not params.
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider the customer wants instead.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: [
      'can I see someone else instead',
      'change my stylist for that booking',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'booking.change_provider_on_reschedule',
      captures: ['bookingId', 'previousEmployeeId'],
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.join_waitlist',
    aliases: ['join_waitlist'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T1',
    description: 'Add the customer to the waitlist for a fully-booked slot.',
    // §177 slice 25 — **corrected**. Exempted in slice 17 on the grounds that its
    // parser read no params; `parseJoinWaitlistFromPrompt` in fact calls
    // `enrichJoinWaitlistParamsFromPrompt(params, prompt, timeZone)`, which reads
    // `employeeName` and carries `serviceName` through. The exemption was argued
    // from a genuine structural difference (it does not use the
    // `enrichCancelMyBooking…` family) which turned out not to mean what I took it
    // to mean.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service the customer wants to be waitlisted for.',
        required: false,
        resolver: 'service',
      },
      employeeName: {
        type: 'string',
        description: 'Preferred provider, when the customer names one.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['put me on the waitlist', 'let me know if something frees up'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'booking.join_waitlist',
      captures: ['waitlistId'],
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.leave_visit_review',
    aliases: ['leave_visit_review'],
    domain: 'booking',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Leave a review for a completed visit.',
    // §177 (C2/T1) — the booking is identified by
    // `enrichCancelMyBookingParamsFromPrompt`, shared with `cancel_my_booking`,
    // which reads this family from `params` before falling back to the prompt.
    // The customer comes from `resolveSessionCustomerId` (session, not input). The rating and comment are read from
    // the prompt only — `parseLeaveVisitReviewFromPrompt` takes no params — so
    // they are deliberately not declared.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'The customer\u2019s booking. Resolved from their own bookings when omitted.',
        required: false,
        resolver: 'appointment',
      },
      serviceName: {
        type: 'string',
        description: 'Narrow to a booking for this service.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Narrow to a booking on this day.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Narrow to a booking at this time.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['leave a 5 star review', 'review my last visit'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A review may already be visible to other customers and to the provider.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.notify_running_late',
    aliases: ['notify_running_late'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Tell the business the customer is running late.',
    // §177 (C2/T1) — the booking is identified by
    // `enrichCancelMyBookingParamsFromPrompt`, shared with `cancel_my_booking`,
    // which reads this family from `params` before falling back to the prompt.
    // The customer comes from `resolveSessionCustomerId` (session, not input). `minutesLate` is read by
    // `parseNotifyRunningLateFromPrompt`, which also accepts it from the prompt.
    variables: {
      minutesLate: {
        type: 'number',
        description: 'How late the customer will be.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description:
          'The customer\u2019s booking. Resolved from their own bookings when omitted.',
        required: false,
        resolver: 'appointment',
      },
      serviceName: {
        type: 'string',
        description: 'Narrow to a booking for this service.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Narrow to a booking on this day.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Narrow to a booking at this time.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['I am running 10 minutes late', 'tell them I will be late'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'none',
      reason: 'The business has been told; the message cannot be unsent.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.report_problem',
    aliases: ['report_booking_problem'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Report a problem with a booking to the business.',
    // §177 (C2/T1) — the booking is identified by
    // `enrichCancelMyBookingParamsFromPrompt`, shared with `cancel_my_booking`,
    // which reads this family from `params` before falling back to the prompt.
    // The customer comes from `resolveSessionCustomerId` (session, not input). The problem description comes
    // from the prompt only, so it is not declared.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'The customer\u2019s booking. Resolved from their own bookings when omitted.',
        required: false,
        resolver: 'appointment',
      },
      serviceName: {
        type: 'string',
        description: 'Narrow to a booking for this service.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Narrow to a booking on this day.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Narrow to a booking at this time.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'the time on my booking is wrong',
      'report a problem with my appointment',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'Raises a support case that a person acts on; withdrawing it needs the same person.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'booking.create_intake_draft',
    aliases: ['create_intake_draft'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T1',
    description: 'Start a draft intake form for a customer.',
    // §177 (C2/T1) — the patient comes from the session (`missing:
    // ['sessionCustomerId']` is a sign-in prompt); the service is required.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service the intake draft is for.',
        required: true,
        resolver: 'service',
      },
      serviceId: {
        type: 'string',
        description: 'Service id, when known.',
        required: false,
        resolver: 'service',
      },
      questionnaireId: {
        type: 'string',
        description: 'Questionnaire the draft is based on.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['start my intake form', 'begin the pre visit questions'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'booking.create_intake_draft',
      captures: ['draftId'],
    },
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.start_pre_visit_intake',
    aliases: ['start_pre_visit_intake'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T1',
    description: 'Begin the pre-visit intake flow.',
    // §177 (C2/T1) — `sessionIntakeId` is the client-carried draft; `intakeId` is
    // the explicit one, and the handler refuses without either.
    variables: {
      intakeId: {
        type: 'string',
        description:
          'Intake to start. The handler refuses when neither this nor the session draft resolves.',
        required: true,
        resolver: 'none',
      },
      sessionIntakeId: {
        type: 'string',
        description:
          'Draft carried by the client session, used when no `intakeId` is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['start the pre visit intake', 'begin my clinic form'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'booking.start_pre_visit_intake',
      captures: ['intakeId'],
    },
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'booking.submit_intake_answers',
    aliases: ['submit_intake_answers'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T2',
    description: 'Submit the answers a customer gave on an intake form.',
    variables: {
      // `handleSubmitIntakeAnswersLogic`. `sessionIntakeId` is the fallback
      // and is session-injected, so only the explicit form is declared.
      intakeId: {
        type: 'string',
        description:
          'Which intake form the answers belong to. Falls back to the intake already open in the session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['submit my intake answers', 'I have finished the form'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'booking.submit_intake_answers',
      captures: ['intakeId', 'previousAnswers'],
    },
    handler: 'PublicBookingAssistantService',
  },
] as const;
