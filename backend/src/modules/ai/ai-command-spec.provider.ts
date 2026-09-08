/**
 * AI-ROADMAP Phase 1 - eighth domain slice: `provider` (registry
 * `provider-mobile`).
 *
 * 39 entries and the most read-heavy slice yet: **30 reads to 9 mutations**.
 * Most of the reads are `explain_*` product-guide commands, which is what a
 * mobile app for busy practitioners mostly needs - it answers questions about
 * the app itself.
 *
 * Two commands, `coordinate_waitlist_offer` and `team_whos_next`, permit
 * **client, manager and owner but not staff**. That is copied from the live
 * gate rather than invented, and it looks wrong: a staff member cannot run them
 * while a client-tier provider-app user can. Filed as e2e-bug.378 rather than
 * quietly "corrected" here, because the spec must match the running system or
 * the conformance suite - correctly - fails.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const PROVIDER_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'provider.coordinate_waitlist_offer',
    aliases: ['coordinate_waitlist_offer'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Work out which waitlisted customer to offer a freed slot to.',
    // §210 (C2/T0) — the booking picker's full set, plus the waitlist client
    // and the provider being offered the slot.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description: 'Service, used to narrow between appointments.',
        required: false,
        resolver: 'service',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time, used to narrow between appointments.',
        required: false,
        resolver: 'none',
      },
      status: {
        type: 'string',
        description: 'Booking status filter.',
        required: false,
        resolver: 'none',
      },
      paymentStatus: {
        type: 'string',
        description: 'Payment status filter.',
        required: false,
        resolver: 'none',
      },
      reason: {
        type: 'string',
        description: 'Reason given, carried into the action.',
        required: false,
        resolver: 'none',
      },
      allAppointments: {
        type: 'boolean',
        description:
          'Whether the whole day is in scope rather than one booking.',
        required: false,
        resolver: 'none',
      },
      waitlistCustomerName: {
        type: 'string',
        description: 'Client on the waitlist being offered the slot.',
        required: false,
        resolver: 'customer',
      },
      employeeName: {
        type: 'string',
        description: 'Provider the offer is coordinated with.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: [
      'who should get this cancelled slot',
      'coordinate the waitlist offer',
    ],
    confirm: 'never',
    // Permits client, manager and owner but NOT staff - taken from the live
    // gate, not invented. A staff member cannot run this while a client-tier
    // provider-app user can, which looks wrong; see e2e-bug.378.
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.team_whos_next',
    aliases: ['team_whos_next'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Report which team member is next up.',
    variables: {},
    examples: ['who is next on the floor', 'whose turn is it'],
    confirm: 'never',
    // Permits client, manager and owner but NOT staff - taken from the live
    // gate, not invented. A staff member cannot run this while a client-tier
    // provider-app user can, which looks wrong; see e2e-bug.378.
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_accessibility_settings',
    aliases: ['explain_accessibility_settings'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the accessibility options in the provider app.',
    variables: {},
    examples: [
      'how do I make the text bigger',
      'what accessibility settings are there',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_ai_suggestions',
    aliases: ['explain_ai_suggestions'],
    domain: 'provider',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain where the assistant suggestions come from.',
    // §190 (C2/T0) — the meta-guide path. `dispatchProviderMetaGuideIntent` reads
    // client state only, but the same action also routes through
    // `dispatchMetaProductGuideIntent` on the dashboard, which reads `date`; it is
    // declared because one live path reads it.
    variables: {
      date: {
        type: 'string',
        description:
          'Day the explanation is scoped to, when the topic is time-bound.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['why is it suggesting this', 'how do AI suggestions work'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'provider.explain_appointment_tax',
    aliases: ['explain_appointment_tax'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the tax lines on an appointment payment breakdown.',
    // §210 (C2/T0) — routed through `dispatchProviderClientContextIntent`,
    // which resolves the appointment by id then by client name.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['why is there tax on this', 'explain the tax on this booking'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_assistant_approval',
    aliases: ['explain_assistant_approval'],
    domain: 'provider',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain when the assistant needs approval before acting.',
    // §190 (C2/T0) — the meta-guide path. `dispatchProviderMetaGuideIntent` reads
    // client state only, but the same action also routes through
    // `dispatchMetaProductGuideIntent` on the dashboard, which reads `date`; it is
    // declared because one live path reads it.
    variables: {
      date: {
        type: 'string',
        description:
          'Day the explanation is scoped to, when the topic is time-bound.',
        required: false,
        resolver: 'date',
      },
    },
    examples: [
      'why is it asking me to approve',
      'when does the assistant need approval',
    ],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'provider.explain_assistant_confirm_swipe',
    aliases: ['explain_assistant_confirm_swipe'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the swipe-to-confirm gesture.',
    // §190 (C2/T0) — routed through `dispatchProviderProductGuideIntent`, which
    // reads `topicId` alongside client state (`bookingId`, `lastPush`,
    // `nativePlatform`, `online`, `offlineQueueCount`). Only the topic is user
    // input; the rest is what the mobile client attaches.
    variables: {
      topicId: {
        type: 'string',
        description: 'Guide topic being explained.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how do I confirm this', 'what is the swipe for'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'provider.explain_block_vs_time_off',
    aliases: ['explain_block_vs_time_off'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'Explain the difference between blocking time and requesting time off.',
    variables: {},
    examples: [
      'should I block time or request leave',
      'what is the difference between a block and time off',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_booking_status_badge',
    aliases: ['explain_booking_status_badge'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain what a booking status badge means.',
    variables: {},
    examples: ['what does this badge mean', 'why is this booking orange'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_calendar_utilization_bands',
    aliases: ['explain_calendar_utilization_bands'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the utilisation shading on the calendar.',
    variables: {},
    examples: [
      'what do the colours on my calendar mean',
      'explain the utilisation bands',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_dashboard_only_action',
    aliases: ['explain_dashboard_only_action'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain that an action is only available on the dashboard.',
    variables: {},
    examples: ['why can I not do this here', 'how do I do this on mobile'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_floor_status',
    aliases: ['explain_floor_status'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the floor status strip.',
    variables: {},
    examples: ['what does the floor strip show', 'explain the floor status'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_offline_suggestions',
    aliases: ['explain_offline_suggestions'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how suggestions behave without a connection.',
    variables: {},
    examples: [
      'why are suggestions not updating',
      'do suggestions work offline',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_profile_settings',
    aliases: ['explain_profile_settings'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the provider profile settings.',
    // §190 (C2/T0) — routed through `dispatchProviderProductGuideIntent`, which
    // reads `topicId` alongside client state (`bookingId`, `lastPush`,
    // `nativePlatform`, `online`, `offlineQueueCount`). Only the topic is user
    // input; the rest is what the mobile client attaches.
    variables: {
      topicId: {
        type: 'string',
        description: 'Guide topic being explained.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what can I change in my profile', 'explain profile settings'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'provider.explain_app_tabs',
    aliases: ['explain_provider_app_tabs'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain what each tab in the provider app is for.',
    // §190 (C2/T0) — routed through `dispatchProviderProductGuideIntent`, which
    // reads `topicId` alongside client state (`bookingId`, `lastPush`,
    // `nativePlatform`, `online`, `offlineQueueCount`). Only the topic is user
    // input; the rest is what the mobile client attaches.
    variables: {
      topicId: {
        type: 'string',
        description: 'Guide topic being explained.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is the Today tab', 'explain the app tabs'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'provider.explain_compound_steps',
    aliases: ['explain_provider_compound_steps'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how a multi-step request is carried out.',
    // §190 (C2/T0) — routed through `dispatchProviderProductGuideIntent`, which
    // reads `topicId` alongside client state (`bookingId`, `lastPush`,
    // `nativePlatform`, `online`, `offlineQueueCount`). Only the topic is user
    // input; the rest is what the mobile client attaches.
    variables: {
      topicId: {
        type: 'string',
        description: 'Guide topic being explained.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why did it do three things', 'explain the steps it took'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'provider.explain_context',
    aliases: ['explain_provider_context'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain what the assistant knows about the current context.',
    variables: {},
    examples: [
      'what do you know about right now',
      'what context are you using',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_reassign_limit',
    aliases: ['explain_reassign_limit'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the limit on reassigning bookings.',
    variables: {},
    examples: ['why can I not reassign this', 'what is the reassign limit'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_staff_invite',
    aliases: ['explain_staff_invite'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how staff are invited to the app.',
    // §190 (C2/T0) — routed through `dispatchProviderProductGuideIntent`, which
    // reads `topicId` alongside client state (`bookingId`, `lastPush`,
    // `nativePlatform`, `online`, `offlineQueueCount`). Only the topic is user
    // input; the rest is what the mobile client attaches.
    variables: {
      topicId: {
        type: 'string',
        description: 'Guide topic being explained.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how do I invite a colleague', 'explain staff invites'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'provider.explain_team_view_scope',
    aliases: ['explain_team_view_scope'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain whose bookings the team view shows.',
    // §190 (C2/T0) — routed through `dispatchProviderProductGuideIntent`, which
    // reads `topicId` alongside client state (`bookingId`, `lastPush`,
    // `nativePlatform`, `online`, `offlineQueueCount`). Only the topic is user
    // input; the rest is what the mobile client attaches.
    variables: {
      topicId: {
        type: 'string',
        description: 'Guide topic being explained.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['whose calendar am I seeing', 'what does the team view include'],
    confirm: 'never',
    handler: 'AiProductGuideService',
  },
  {
    id: 'provider.explain_time_off_approval',
    aliases: ['explain_time_off_approval'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain who approves time off and how long it takes.',
    variables: {},
    examples: ['who approves my time off', 'how does leave approval work'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_visibility_block',
    aliases: ['explain_visibility_block'],
    domain: 'provider',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain why something is hidden from view.',
    variables: {},
    examples: ['why can I not see this', 'what is blocking my view'],
    confirm: 'never',
    handler: 'AiProductGuideEmptyStateService',
  },
  {
    id: 'provider.get_calendar_month',
    aliases: ['get_calendar_month'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Show the provider calendar for a month.',
    // §210 (C2/T0) — the month being fetched.
    variables: {
      month: {
        type: 'string',
        description: 'Month to return.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['show me next month', 'my calendar for March'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.get_schedule_summary',
    aliases: ['get_schedule_summary'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise the provider schedule.',
    // §210 (C2/T0) — window length in days.
    variables: {
      days: {
        type: 'number',
        description: 'How many days the summary covers.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what does my week look like', 'summarise my schedule'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.list_my_multi_service_groups',
    aliases: ['list_my_multi_service_groups'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List multi-service visits assigned to this provider.',
    // §213 (C2/T0) — `resolveDateRange(params, prompt, tz)` plus the provider.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      sessionEmployeeId: {
        type: 'string',
        description: 'Provider from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what spa days do I have', 'my multi service bookings'],
    confirm: 'never',
    handler: 'AiProviderBookingService',
  },
  {
    id: 'provider.list_my_package_visits',
    aliases: ['list_my_package_visits'],
    domain: 'provider',
    surfaces: ['provider', 'customer'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T0',
    description: 'List package visits for this provider.',
    // §213 (C2/T0) — `resolveDateRange(params, prompt, tz)` plus the provider.
    // §224 — this command has **two implementations**, one per surface, and
    // §213 traced only the provider one. `surfaces: ['provider', 'customer']`:
    // the provider surface dispatches to `AiProviderBookingService` (the range
    // and provider fields below), the customer surface to
    // `AiSelfServiceBookingService.handleListMyPackageVisits` — a same-named
    // handler in a different file — which reads `packageName` and takes the
    // customer from the session. `handler` names only the first, which is why
    // a trace starting from the spec found one of the two.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      sessionEmployeeId: {
        type: 'string',
        description: 'Provider from the current session.',
        required: false,
        resolver: 'none',
      },
      packageName: {
        type: 'string',
        description: 'Package to narrow to, on the customer surface.',
        required: false,
        resolver: 'none',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Customer from the current session, on the customer surface.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what package visits do I have', 'my package appointments'],
    confirm: 'never',
    handler: 'AiProviderBookingService',
  },
  {
    id: 'provider.list_package_appointments_today',
    aliases: ['list_package_appointments_today'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List today package appointments.',
    // §213 (C2/T0) — scoped to the signed-in provider.
    variables: {
      employeeId: {
        type: 'string',
        description: 'Provider, by id.',
        required: false,
        resolver: 'employee',
      },
      sessionEmployeeId: {
        type: 'string',
        description: 'Provider from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what package visits are today', 'package appointments today'],
    confirm: 'never',
    handler: 'AiProviderBookingService',
  },
  {
    id: 'provider.list_upcoming_bookings',
    aliases: ['list_upcoming_bookings'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List the provider upcoming bookings.',
    // §210 (C2/T0) — window length in days.
    variables: {
      days: {
        type: 'number',
        description: 'How many days ahead to list.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is coming up', 'my next bookings'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.open_booking_detail',
    aliases: ['open_booking_detail'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Open the detail view for a booking.',
    // §210 (C2/T0) — the same booking picker, plus the day.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description: 'Service, used to narrow between appointments.',
        required: false,
        resolver: 'service',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time, used to narrow between appointments.',
        required: false,
        resolver: 'none',
      },
      status: {
        type: 'string',
        description: 'Booking status filter.',
        required: false,
        resolver: 'none',
      },
      paymentStatus: {
        type: 'string',
        description: 'Payment status filter.',
        required: false,
        resolver: 'none',
      },
      reason: {
        type: 'string',
        description: 'Reason given, carried into the action.',
        required: false,
        resolver: 'none',
      },
      allAppointments: {
        type: 'boolean',
        description:
          'Whether the whole day is in scope rather than one booking.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Day to look on.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['open my 3pm booking', 'show me that appointment'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.show_profile',
    aliases: ['show_provider_profile'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Show the provider own profile.',
    variables: {},
    examples: ['show my profile', 'what is on my profile'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.voice_summarize_next_client',
    aliases: ['voice_summarize_next_client'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise the next client out loud for hands-free use.',
    // §210 (C2/T0) — the day being summarized.
    variables: {
      date: {
        type: 'string',
        description: 'Day to take the next client from.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['who is next', 'tell me about my next client'],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.collect_remaining_balance',
    aliases: ['collect_remaining_balance'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Collect the outstanding balance on a booking.',
    variables: {
      // Delegates wholesale to `providerBooking.handleMarkPaid` — the same
      // mutation as `mark_paid`, phrased as collecting the rest. The employee
      // scope comes from the session; `bookingId` is the only input.
      //
      // The spec names `AiProviderBookingService`, but the switch case is in
      // `provider-mobile/provider-ai-command.service.ts` — e2e-bug.440 again.
      bookingId: {
        type: 'string',
        description: 'Booking whose remaining balance is being collected.',
        required: false,
        resolver: 'appointment',
      },
    },
    examples: ['take the rest of the payment', 'collect what they still owe'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiProviderBookingService',
  },
  {
    id: 'provider.confirm_pending_booking',
    aliases: ['confirm_pending_booking'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Confirm a booking that is awaiting confirmation.',
    // §177 (C2/T1) — same shared filter as the visit-status commands; the handler
    // defaults `date` to today and then keeps only PENDING matches.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to the session booking when omitted.',
        required: false,
        resolver: 'appointment',
      },
      date: {
        type: 'string',
        description: 'Day to search. Defaults to today.',
        required: false,
        resolver: 'date',
      },
      customerName: {
        type: 'string',
        description: 'Narrow the match by client.',
        required: false,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description: 'Narrow the match by service.',
        required: false,
        resolver: 'service',
      },
      timeSlot: {
        type: 'string',
        description: 'Narrow the match by appointment time.',
        required: false,
        resolver: 'none',
      },
      allAppointments: {
        type: 'boolean',
        description: 'Act on every match rather than requiring one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['confirm that pending booking', 'accept the 3pm request'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The customer has been told their booking is confirmed.',
    },
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.mark_visit_in_progress',
    aliases: ['mark_visit_in_progress'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Mark a visit as under way.',
    // §177 (C2/T1) — identification runs through `findMatchingBookings`, the
    // filter shared by the provider status commands. It also reads
    // `paymentStatus` and `reason`, which are meaningful for other actions on
    // that helper but not for this one, so they are deliberately not declared:
    // declaring inputs the command has no use for is `e2e-bug.399`'s mistake.
    // `status` is set by the handler, not the caller.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to the session booking when omitted.',
        required: false,
        resolver: 'appointment',
      },
      date: {
        type: 'string',
        description: 'Day to search. Defaults to today.',
        required: false,
        resolver: 'date',
      },
      customerName: {
        type: 'string',
        description: 'Narrow the match by client.',
        required: false,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description: 'Narrow the match by service.',
        required: false,
        resolver: 'service',
      },
      timeSlot: {
        type: 'string',
        description: 'Narrow the match by appointment time.',
        required: false,
        resolver: 'none',
      },
      allAppointments: {
        type: 'boolean',
        description: 'Act on every match rather than requiring one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['start this visit', 'mark them as in progress'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'provider.mark_visit_in_progress',
      captures: ['bookingId', 'previousStatus'],
    },
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.mark_visit_complete',
    aliases: ['mark_visit_complete'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Mark a visit as finished.',
    // §177 (C2/T1) — identification runs through `findMatchingBookings`, the
    // filter shared by the provider status commands. It also reads
    // `paymentStatus` and `reason`, which are meaningful for other actions on
    // that helper but not for this one, so they are deliberately not declared:
    // declaring inputs the command has no use for is `e2e-bug.399`'s mistake.
    // `status` is set by the handler, not the caller.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to the session booking when omitted.',
        required: false,
        resolver: 'appointment',
      },
      date: {
        type: 'string',
        description: 'Day to search. Defaults to today.',
        required: false,
        resolver: 'date',
      },
      customerName: {
        type: 'string',
        description: 'Narrow the match by client.',
        required: false,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description: 'Narrow the match by service.',
        required: false,
        resolver: 'service',
      },
      timeSlot: {
        type: 'string',
        description: 'Narrow the match by appointment time.',
        required: false,
        resolver: 'none',
      },
      allAppointments: {
        type: 'boolean',
        description: 'Act on every match rather than requiring one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['mark that visit done', 'finish this appointment'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'provider.mark_visit_complete',
      captures: ['bookingId', 'previousStatus'],
    },
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.mark_multi_service_step_done',
    aliases: ['mark_multi_service_step_done'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Mark one service in a multi-service visit as finished.',
    // §177 (C2/T1) — the anchor booking comes from
    // `resolveMultiServiceStepAnchorBookingId`, and the step is named either by
    // position or by service.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Multi-service booking whose step is being completed.',
        required: false,
        resolver: 'appointment',
      },
      stepIndex: {
        type: 'number',
        description: 'Position of the step within the booking.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description: 'Step named by its service instead of its position.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['the massage part is done', 'mark that step complete'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'provider.mark_multi_service_step_done',
      captures: ['stepId', 'previousStatus'],
    },
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.suggest_reschedule_from_push',
    aliases: ['suggest_reschedule_from_push'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Offer the customer a reschedule in response to a notification.',
    // §177 (C2/T1) — the whole input is the booking the push referred to.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking the push notification was about.',
        required: false,
        resolver: 'appointment',
      },
    },
    examples: ['suggest they move it', 'offer a reschedule for that push'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The suggestion has been sent to the customer and cannot be unsent.',
    },
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.update_profile',
    aliases: ['update_provider_profile'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Change the provider own profile details.',
    variables: {
      // Handled in `provider-mobile/provider-ai-command.service.ts`, not the
      // `ProviderAiCommandService` the spec names in the AI module sense —
      // e2e-bug.440's shape once more. It reports
      // `missing: ['title', 'avatarUrl']` when neither is supplied.
      title: {
        type: 'string',
        description: 'New profile title.',
        required: false,
        resolver: 'none',
      },
      avatarUrl: {
        type: 'string',
        description: 'New profile picture URL.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['update my bio', 'change my profile photo'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'provider.update_profile',
      captures: ['previousValues'],
    },
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.give_ai_feedback',
    aliases: ['give_provider_ai_feedback'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Record feedback about an assistant response.',
    variables: {},
    examples: ['that was wrong', 'this suggestion was unhelpful'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason:
        'Feedback is an observation about what happened; retracting it would remove the signal \u00a743 mines.',
    },
    handler: 'ProviderAiCommandService',
  },
  // tech-debt C1 / e2e-bug.379 — the nine §149 commands, finally specced.
  //
  // §149 found these nine sitting at exactly 0% across 241 eval cases: the
  // detectors matched, the handlers worked, and `isIntentAllowedOnSurface`
  // discarded the answer because none had a `COMMAND_REGISTRY` row. That fix
  // added the rows and stopped there.
  //
  // Nine registry entries were left with **no `CommandSpec`**, which is the
  // same defect one list over. The planner's entire catalogue is
  // `COMMAND_SPECS`, so all nine were invisible to it — unroutable by the layer
  // Phase 8 is replacing detectors with, and absent from every spec-derived
  // gate: risk tiers, the confirmation model, the shortlist, the retirement
  // criterion.
  //
  // Surfaces, tiers, handler and mutating are copied from the live registry and
  // capability matrix, not invented — `ai-command-spec.conformance.spec.ts`
  // fails otherwise. Descriptions and examples come from each command's own
  // classifier-rule fixture, which is what the detectors were already written
  // against.
  {
    id: 'provider.explain_today_timeline',
    aliases: ['explain_today_timeline'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      "Walk through today's bookings in order, calling out the gaps between clients.",
    // §210 (C2/T0) — the day being summarized.
    variables: {
      date: {
        type: 'string',
        description: 'Day the timeline covers.',
        required: false,
        resolver: 'date',
      },
    },
    examples: [
      'Walk me through my day',
      'Talk me through today',
      'Gaps between clients?',
      'What does my day look like?',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_booking_payment_breakdown',
    aliases: ['explain_booking_payment_breakdown'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'Full payment breakdown for a booking — service price, retail add-ons, discounts, tax, total, collected and still owed.',
    // §210 (C2/T0) — routed through `dispatchProviderClientContextIntent`,
    // which resolves the appointment by id then by client name.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      "What's the payment breakdown for this booking?",
      'Break down the total for this booking',
      'She prepaid online — show the breakdown',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_deposit_balance_due',
    aliases: ['explain_deposit_balance_due'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'How much is left to pay on a booking after any deposit — the number only, without itemised lines.',
    // §210 (C2/T0) — routed through `dispatchProviderClientContextIntent`,
    // which resolves the appointment by id then by client name.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      'How much is left at checkout?',
      "What's the balance due on this booking?",
      'How much does she still owe on this booking?',
      '50% deposit — what\u2019s the rest due?',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_cancel_policy_for_client',
    aliases: ['explain_cancel_policy_for_client'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      "The salon's cancel and reschedule policy, plus what this booking's deposit exposure would be if it were cancelled.",
    // §210 (C2/T0) — routed through `dispatchProviderClientContextIntent`,
    // which resolves the appointment by id then by client name.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      "What's our cancellation policy for this client?",
      'Explain the cancel policy for this booking',
      'Will she lose her deposit if she cancels?',
      'How much notice do we need to cancel this appointment?',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_gift_card_redemption',
    aliases: ['explain_gift_card_redemption'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'How much of a booking a gift card covers, and what is left on the card.',
    // §210 (C2/T0) — routed through `dispatchProviderClientContextIntent`,
    // which resolves the appointment by id then by client name.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      "She's paying with gift card — balance?",
      "What's left on the gift card?",
      'How much gift card balance does she have?',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_multi_service_timeline',
    aliases: ['explain_multi_service_timeline'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'The order of services in a multi-service booking — what is done, what is running, what is next.',
    // §210 (C2/T0) — routed through `dispatchProviderClientContextIntent`,
    // which resolves the appointment by id then by client name.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      "What's next after this blowdry?",
      "What's the order of services today?",
      'What else is on this booking?',
      'Spa day order',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_package_visit_context',
    aliases: ['explain_package_visit_context'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'Which visit of a package this booking is — visit number, package name and visits remaining.',
    // §210 (C2/T0) — routed through `dispatchProviderClientContextIntent`,
    // which resolves the appointment by id then by client name.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      'Which visit is this in her package?',
      'How many package visits does she have left?',
      'This is visit 2 of 6 facials, right?',
      'Is this a package visit?',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_retail_cart',
    aliases: ['explain_retail_cart'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'What is on the retail tab for a booking — product names, quantities and the retail total.',
    // §210 (C2/T0) — routed through `dispatchProviderClientContextIntent`,
    // which resolves the appointment by id then by client name.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      "What's on the retail tab?",
      'Show me the retail cart for this booking',
      'What products are on this booking?',
      'Total with products?',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
  {
    id: 'provider.explain_tour_group_on_booking',
    aliases: ['explain_tour_group_on_booking'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'The tour group size recorded on a booking — how many people are booked on this departure.',
    // §210 (C2/T0) — routed through `dispatchProviderClientContextIntent`,
    // which resolves the appointment by id then by client name.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment the answer is about.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      'How many pax on this tour?',
      'How many people are in this tour group?',
      "What's the pax count for this booking?",
      'Group booking details',
    ],
    confirm: 'never',
    handler: 'ProviderAiCommandService',
  },
] as const;
