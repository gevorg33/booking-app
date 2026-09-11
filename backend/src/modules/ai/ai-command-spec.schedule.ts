/**
 * AI-ROADMAP Phase 1 - fifth domain slice: `schedule` (the roadmap's
 * "staff/schedule").
 *
 * 32 registry entries across four modules that are one domain in practice:
 * `schedule-resources` (18), `provider-time-off` (5), `provider-open-shifts` (5)
 * and `schedule` (4). 18 reads, 14 mutations, and - unlike every slice so far -
 * **four different handlers**, so `handler` is per command rather than per file.
 *
 * The recurring compensation theme here is that scheduling decisions are
 * communicated. Approving leave, denying it, or closing the business are not
 * database states that can be quietly put back: a provider has been told, and
 * customers have been turned away. Those are declared `none` or `manual` for the
 * same reason payment commands are, without any money being involved.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const SCHEDULE_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'schedule.book_walk_in_gap',
    aliases: ['book_walk_in_gap'],
    domain: 'schedule',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Book a walk-in customer into a gap in the provider schedule.',
    // §177 (C2/T1) — the two names fall back to prompt extraction; the start time
    // comes from `resolveWalkInStartTime`, which reads `timeFrom`.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service for the walk-in. The handler refuses without it.',
        required: true,
        resolver: 'service',
      },
      customerName: {
        type: 'string',
        description: 'Walk-in customer, when named.',
        required: false,
        resolver: 'customer',
      },
      timeFrom: {
        type: 'string',
        description: 'Start of the gap to book into.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['quick book a trim now', 'fit this walk-in into my next gap'],
    confirm: 'always',
    // e2e-bug.377 FIXED. This creates a real booking — `handleBookWalkInGap`
    // calls `bookingService.create(...)` — but was registered `mutating: false`,
    // so it ran at T0 with no confirmation gate. The registry binding now lists
    // it in `mutateIntents` and this spec follows.
    compensation: {
      kind: 'none',
      reason:
        'The customer has been booked in and the slot is taken; cancelling is a separate action they are told about.',
    },
    handler: 'AiProviderOpenShiftsService',
  },
  {
    id: 'schedule.check_multi_service_block_availability',
    aliases: ['check_multi_service_block_availability'],
    domain: 'schedule',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description:
      'Check whether several services can be booked back to back in one visit.',
    // §190 (C2/T0) — services come from `resolveServiceIds`. Note there are **two**
    // functions of that name, in `ai-schedule-resources.logic.ts` and
    // `ai-staff-operations.logic.ts`; the other takes its names as an argument and
    // reads no params, so scanning by name alone finds the wrong contract.
    variables: {
      serviceIds: {
        type: 'string[]',
        description: 'Services by id — tried first by `resolveServiceIds`.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Services by name.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Single service, folded into the name list.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Day to check the block against.',
        required: false,
        resolver: 'date',
      },
    },
    examples: [
      'can I get a massage and a facial together',
      'is a spa day available friday',
    ],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.check_package_line_availability',
    aliases: ['check_package_line_availability'],
    domain: 'schedule',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Check whether every service in a package can be scheduled.',
    // §190 (C2/T0) — the whole input is the package.
    variables: {
      packageId: {
        type: 'string',
        description: 'Package whose lines are being checked.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'can I book the whole bridal package',
      'is the bundle available next week',
    ],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.draft_waitlist_offer_message',
    aliases: ['draft_waitlist_offer_message'],
    domain: 'schedule',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'Draft a message offering a freed slot to waitlisted customers.',
    // §212 (C2/T0) — the gap the offer is drafted for.
    variables: {
      date: {
        type: 'string',
        description: 'Day the gap falls on.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window searched.',
        required: false,
        resolver: 'date',
      },
      timeFrom: {
        type: 'string',
        description: 'Start of the gap.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'End of the gap.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'draft an offer for this cancellation',
      'write a waitlist message for the gap',
    ],
    confirm: 'never',
    handler: 'AiProviderOpenShiftsService',
  },
  {
    id: 'schedule.earliest_slot_all_services',
    aliases: ['earliest_slot_all_services'],
    domain: 'schedule',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Find the earliest slot available across every service.',
    // §190 (C2/T0) — services come from `resolveServiceIds`. Note there are **two**
    // functions of that name, in `ai-schedule-resources.logic.ts` and
    // `ai-staff-operations.logic.ts`; the other takes its names as an argument and
    // reads no params, so scanning by name alone finds the wrong contract.
    variables: {
      serviceIds: {
        type: 'string[]',
        description: 'Services by id — tried first by `resolveServiceIds`.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Services by name.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Single service, folded into the name list.',
        required: false,
        resolver: 'service',
      },
    },
    examples: [
      'when is your next free slot',
      'earliest availability for anything',
    ],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.explain_multi_service_settings',
    aliases: ['explain_multi_service_settings'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how multi-service visits are currently scheduled.',
    // §190 (C2/T0) — one flag, read by the parser;
    // `resolveMultiServiceSettings` reads business settings, not params.
    variables: {
      explainMultiServiceSettings: {
        type: 'boolean',
        description:
          'Ask for the multi-service settings explanation explicitly.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'how do we schedule spa days',
      'explain our multi service rules',
    ],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.explain_resource_conflict',
    aliases: ['explain_resource_conflict'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain why a resource is double-booked.',
    // §190 (C2/T0) — `parseTimeRange` supplies the window; the handler reads
    // nothing else directly.
    variables: {
      startTime: {
        type: 'string',
        description: 'Start of the window, read by `parseTimeRange`.',
        required: false,
        resolver: 'none',
      },
      endTime: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'none',
      },
      dateTime: {
        type: 'string',
        description: 'A single instant, as an alternative to a range.',
        required: false,
        resolver: 'datetime',
      },
    },
    examples: ['why is room 2 conflicting', 'explain this resource clash'],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.explain_why_no_slots',
    aliases: ['explain_why_no_slots'],
    domain: 'schedule',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain why no appointment slots are available.',
    // §190 (C2/T0) — services come from `resolveServiceIds`. Note there are **two**
    // functions of that name, in `ai-schedule-resources.logic.ts` and
    // `ai-staff-operations.logic.ts`; the other takes its names as an argument and
    // reads no params, so scanning by name alone finds the wrong contract.
    variables: {
      serviceIds: {
        type: 'string[]',
        description: 'Services by id — tried first by `resolveServiceIds`.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Services by name.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Single service, folded into the name list.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['why is nothing available', 'why can I not book friday'],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.list_my_time_off_requests',
    aliases: ['list_my_time_off_requests'],
    domain: 'schedule',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List the time-off requests made by the requesting provider.',
    variables: {},
    examples: ['what time off have I asked for', 'show my leave requests'],
    confirm: 'never',
    handler: 'AiProviderTimeOffService',
  },
  {
    id: 'schedule.list_rebooking_candidates',
    aliases: ['list_rebooking_candidates'],
    domain: 'schedule',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List customers who could fill a freed slot.',
    // §212 (C2/T0) — the booking to rebook around.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking the candidates are drawn for.',
        required: false,
        resolver: 'appointment',
      },
    },
    examples: [
      'who could take this cancelled slot',
      'list rebooking candidates',
    ],
    confirm: 'never',
    handler: 'AiProviderOpenShiftsService',
  },
  {
    id: 'schedule.list_resource_conflicts',
    aliases: ['list_resource_conflicts'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List scheduling conflicts on shared resources.',
    // §190 (C2/T0) — the same window as `explain_resource_conflict`, plus the
    // resource identification `resolveResource` performs.
    variables: {
      startTime: {
        type: 'string',
        description: 'Start of the window, read by `parseTimeRange`.',
        required: false,
        resolver: 'none',
      },
      endTime: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'none',
      },
      dateTime: {
        type: 'string',
        description: 'A single instant, as an alternative to a range.',
        required: false,
        resolver: 'datetime',
      },
      resourceId: {
        type: 'string',
        description: 'Resource to list conflicts for.',
        required: false,
        resolver: 'none',
      },
      resourceName: {
        type: 'string',
        description: 'Resource by name, when no id is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show me resource conflicts', 'what rooms are double booked'],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.list_scheduling_resources',
    aliases: ['list_scheduling_resources'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List the rooms, chairs and equipment that can be scheduled.',
    variables: {},
    examples: ['what resources do we have', 'list our rooms and equipment'],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.list_service_resource_requirements',
    aliases: ['list_service_resource_requirements'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List which resources each service needs.',
    // §190 (C2/T0) — read directly, without the shared `resolveServiceIds`.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service whose requirements are listed.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Several services.',
        required: false,
        resolver: 'service',
      },
      serviceId: {
        type: 'string',
        description: 'Service id, when known.',
        required: false,
        resolver: 'service',
      },
    },
    examples: [
      'what does a massage need',
      'list service resource requirements',
    ],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.list_time_off_requests',
    aliases: ['list_time_off_requests'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List time-off requests awaiting a decision.',
    // §214 (C2/T0) — status filter.
    variables: {
      status: {
        type: 'string',
        description: 'Only requests in this status.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['who has asked for time off', 'show pending leave requests'],
    confirm: 'never',
    handler: 'AiProviderTimeOffService',
  },
  {
    id: 'schedule.list_waitlist_for_my_services',
    aliases: ['list_waitlist_for_my_services'],
    domain: 'schedule',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'List customers waiting for the services this provider offers.',
    // §212 (C2/T0) — optionally narrowed to one service.
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service to narrow the waitlist to.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['who is on my waitlist', 'show waitlist for my services'],
    confirm: 'never',
    handler: 'AiProviderOpenShiftsService',
  },
  {
    id: 'schedule.my_resource_assignments',
    aliases: ['my_resource_assignments'],
    domain: 'schedule',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List the resources assigned to the requesting provider.',
    // §190 (C2/T0) — `employeeId` is the provider being asked about;
    // `sessionEmployeeId` is who is asking, injected by the pipeline, so only the
    // first is declared.
    variables: {
      employeeId: {
        type: 'string',
        description: 'Provider whose resource assignments are listed.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['which room am I in', 'what resources am I assigned'],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.providers_available_later_days',
    aliases: ['providers_available_later_days'],
    domain: 'schedule',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List providers with availability on later days.',
    // §190 (C2/T0) — services come from `resolveServiceIds`. Note there are **two**
    // functions of that name, in `ai-schedule-resources.logic.ts` and
    // `ai-staff-operations.logic.ts`; the other takes its names as an argument and
    // reads no params, so scanning by name alone finds the wrong contract. The two start fields are
    // read directly by the handler.
    variables: {
      serviceIds: {
        type: 'string[]',
        description: 'Services by id — tried first by `resolveServiceIds`.',
        required: false,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description: 'Services by name.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Single service, folded into the name list.',
        required: false,
        resolver: 'service',
      },
      startTime: {
        type: 'string',
        description: 'Earliest time to consider.',
        required: false,
        resolver: 'none',
      },
      blockStartTime: {
        type: 'string',
        description: 'Start of the multi-service block being placed.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['who is free later this week', 'any availability next week'],
    confirm: 'never',
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.suggest_waitlist_for_gap',
    aliases: ['suggest_waitlist_for_gap'],
    domain: 'schedule',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Suggest which waitlisted customers best fit a gap.',
    // §212 (C2/T0) — the gap being filled.
    variables: {
      date: {
        type: 'string',
        description: 'Day the gap falls on.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window searched.',
        required: false,
        resolver: 'date',
      },
      timeFrom: {
        type: 'string',
        description: 'Start of the gap.',
        required: false,
        resolver: 'none',
      },
      timeTo: {
        type: 'string',
        description: 'End of the gap.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'who should I offer this gap to',
      'suggest someone for the 3pm gap',
    ],
    confirm: 'never',
    handler: 'AiProviderOpenShiftsService',
  },
  {
    id: 'schedule.approve_time_off',
    aliases: ['approve_time_off_request'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Approve a time-off request, blocking the provider calendar.',
    // §177 (C2/T1) — `handleApproveTimeOffRequestLogic` reads `requestId` (refusing
    // with `clarify: true` when absent) and passes `reviewNotes` through to
    // `timeOffService.approveRequest`. Manager access is checked from `userId`,
    // not a param.
    variables: {
      requestId: {
        type: 'string',
        description:
          'Time-off request to act on. The handler refuses without it.',
        required: true,
        resolver: 'none',
      },
      reviewNotes: {
        type: 'string',
        description: 'Optional note recorded with the decision.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['approve Gevorg leave request', 'approve that time off'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The provider has been told the leave is approved and may have made plans on it.',
    },
    handler: 'AiProviderTimeOffService',
  },
  {
    id: 'schedule.deny_time_off',
    aliases: ['deny_time_off_request'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Deny a time-off request.',
    // §177 (C2/T1) — same shape as `approve_time_off_request`; the handlers are
    // mirror images and read the same two params.
    variables: {
      requestId: {
        type: 'string',
        description:
          'Time-off request to act on. The handler refuses without it.',
        required: true,
        resolver: 'none',
      },
      reviewNotes: {
        type: 'string',
        description: 'Optional note recorded with the decision.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['deny that leave request', 'reject Gevorg time off'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The provider has been told the request was denied; reversing it is a new decision.',
    },
    handler: 'AiProviderTimeOffService',
  },
  {
    id: 'schedule.cancel_time_off',
    aliases: ['cancel_time_off_request'],
    domain: 'schedule',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Withdraw a time-off request the provider made.',
    // §177 (C2/T1) — `handleCancelTimeOffRequestLogic` reads only `requestId`; when
    // it is missing it returns the pending list with `clarify: true` so the
    // provider can pick one.
    variables: {
      requestId: {
        type: 'string',
        description:
          'Time-off request to act on. The handler refuses without it.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['cancel my leave request', 'withdraw my time off request'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'Resubmitting is a new request that re-enters the approval queue.',
    },
    handler: 'AiProviderTimeOffService',
  },
  {
    id: 'schedule.assign_resource_hours',
    aliases: ['assign_resource_hours'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Set the hours a resource is available.',
    // §177 (C2/T1) — `handleAssignResourceHoursLogic` resolves the resource via
    // `resolveResource` and the service via `serviceId` / `serviceName` /
    // `serviceNames[0]`; it refuses with `missing: ['resourceName', 'serviceName']`.
    variables: {
      resourceId: {
        type: 'string',
        description: 'Resource id, when the caller already has it.',
        required: false,
        resolver: 'none',
      },
      resourceName: {
        type: 'string',
        description:
          'Resource to act on, matched by name. No `resource` resolver exists, so the handler does its own `resolveByName`.',
        required: true,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Service id, when the caller already has it.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service the resource is being assigned to.',
        required: true,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description:
          'Alternative to `serviceName`; only the first entry is read.',
        required: false,
        resolver: 'service',
      },
    },
    examples: [
      'set room 2 hours to 9 to 5',
      'assign hours for the massage chair',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'schedule.assign_resource_hours',
      captures: ['resourceId', 'previousHours'],
    },
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.block_resource_unavailable',
    aliases: ['block_resource_unavailable'],
    domain: 'schedule',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Mark a resource as unavailable for a period.',
    // §177 (C2/T1) — reads only what `resolveResource` reads. **Despite the name
    // there is no time window**: `handleBlockResourceUnavailableLogic` calls the
    // same `resourcesService.deactivateResource` as `deactivate_resource`, with
    // the same inputs. Declaring the inputs honestly is what surfaced that; see
    // e2e-bug.461.
    variables: {
      resourceId: {
        type: 'string',
        description: 'Resource id, when the caller already has it.',
        required: false,
        resolver: 'none',
      },
      resourceName: {
        type: 'string',
        description:
          'Resource to act on, matched by name. No `resource` resolver exists, so the handler does its own `resolveByName`.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'room 2 is out of action tomorrow',
      'block the chair for maintenance',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'schedule.block_resource_unavailable',
      captures: ['resourceId', 'previousAvailability'],
    },
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.configure_multi_service_scheduling_mode',
    aliases: ['configure_multi_service_scheduling_mode'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change how multi-service visits are sequenced.',
    // §177 (C2/T1) — one field; `resolveMultiServiceSettings` reads business
    // settings, not params.
    variables: {
      schedulingMode: {
        type: 'string',
        description:
          'How multi-service bookings are scheduled. The handler refuses without it.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'book spa services back to back',
      'change multi service scheduling mode',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'schedule.configure_multi_service_scheduling_mode',
      captures: ['previousMode'],
    },
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.create_resource',
    aliases: ['create_resource'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Add a room, chair or piece of equipment that can be scheduled.',
    // §177 (C2/T1) — read from `handleCreateResourceLogic`: it takes `resourceName`
    // (refuses with `missing: ['resourceName']` without it), and passes
    // `resourceType` (defaulting to 'room') and `locationId` to `createResource`.
    variables: {
      resourceName: {
        type: 'string',
        description: 'Name of the room, chair or equipment to create.',
        required: true,
        resolver: 'none',
      },
      resourceType: {
        type: 'string',
        description: "Kind of resource. Defaults to 'room' when omitted.",
        required: false,
        resolver: 'none',
      },
      locationId: {
        type: 'string',
        description:
          'Location the resource belongs to, when the business has several.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add a new treatment room', 'create a resource called Chair 3'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'schedule.deactivate_resource',
      captures: ['resourceId'],
    },
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.deactivate_resource',
    aliases: ['deactivate_resource'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Retire a resource so it can no longer be scheduled.',
    // §177 (C2/T1) — `handleDeactivateResourceLogic` reads nothing directly; it
    // passes `params` to `resolveResource`, which reads `resourceId` then
    // `resourceName`. A regex over the handler body reports zero variables here,
    // which is why C2 insists on reading rather than grepping.
    variables: {
      resourceId: {
        type: 'string',
        description: 'Resource id, when the caller already has it.',
        required: false,
        resolver: 'none',
      },
      resourceName: {
        type: 'string',
        description:
          'Resource to act on, matched by name. No `resource` resolver exists, so the handler does its own `resolveByName`.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['retire room 2', 'stop scheduling the old chair'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Existing bookings may already depend on the resource; restoring it needs a conflict check.',
    },
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.update_resource',
    aliases: ['update_resource'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change the details of a schedulable resource.',
    // §177 (C2/T1) — `handleUpdateResourceLogic` identifies the resource through
    // `resolveResource` (`resourceId` then `resourceName`) and then applies
    // `newName ?? resourceName`, `resourceType` and `locationId`.
    variables: {
      resourceId: {
        type: 'string',
        description: 'Resource id, when the caller already has it.',
        required: false,
        resolver: 'none',
      },
      resourceName: {
        type: 'string',
        description:
          'Resource to act on, matched by name. No `resource` resolver exists, so the handler does its own `resolveByName`.',
        required: true,
        resolver: 'none',
      },
      newName: {
        type: 'string',
        description:
          'New name for the resource. Falls back to `resourceName` when omitted.',
        required: false,
        resolver: 'none',
      },
      resourceType: {
        type: 'string',
        description: 'New kind of resource.',
        required: false,
        resolver: 'none',
      },
      locationId: {
        type: 'string',
        description: 'Move the resource to this location.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['rename room 2 to Studio', 'change the chair capacity'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'schedule.update_resource',
      captures: ['resourceId', 'previousValues'],
    },
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.set_service_resource_requirements',
    aliases: ['set_service_resource_requirements'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Declare which resources a service needs in order to be booked.',
    // §177 (C2/T1) — `handleSetServiceResourceRequirementsLogic` picks the service
    // from `serviceId` / `serviceName` / `serviceNames[0]` (refusing with
    // `missing: ['serviceName']`) and the resources from `resourceIds` or
    // `resourceNames`.
    variables: {
      serviceId: {
        type: 'string',
        description: 'Service id, when the caller already has it.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service these resource requirements apply to.',
        required: true,
        resolver: 'service',
      },
      serviceNames: {
        type: 'string[]',
        description:
          'Alternative to `serviceName`; only the first entry is read.',
        required: false,
        resolver: 'service',
      },
      resourceIds: {
        type: 'string[]',
        description: 'Resource ids required by the service.',
        required: false,
        resolver: 'none',
      },
      resourceNames: {
        type: 'string[]',
        description:
          'Resource names required by the service, when ids are not known.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'massages need a treatment room',
      'set resource requirements for facials',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'schedule.set_service_resource_requirements',
      captures: ['serviceId', 'previousRequirements'],
    },
    handler: 'AiScheduleResourcesService',
  },
  {
    id: 'schedule.holiday_mode',
    aliases: ['holiday_mode'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T3',
    description: 'Close the business for a period, blocking all booking.',
    variables: {
      // `prepareHolidayModePlanLogic` -> `parseHolidayModeDates` +
      // `resolveEmployees`. Failure message: *"Specify closure dates (e.g.
      // Dec 24-26) and optionally extended hours before closure."*
      closeDates: {
        type: 'string[]',
        description: 'Days the business is closed, ISO 8601 dates.',
        required: false,
        resolver: 'date',
      },
      holidayDates: {
        type: 'string[]',
        description:
          'Alternative spelling of `closeDates`; the parser accepts either.',
        required: false,
        resolver: 'date',
      },
      extendDate: {
        type: 'string',
        description:
          'Day to extend opening hours on, usually the day before closure.',
        required: false,
        resolver: 'date',
      },
      extendTimeFrom: {
        type: 'string',
        description: 'Start of the extended window, `HH:MM`.',
        required: false,
        resolver: 'none',
      },
      extendTimeTo: {
        type: 'string',
        description: 'End of the extended window, `HH:MM`.',
        required: false,
        resolver: 'none',
      },
      allProviders: {
        type: 'boolean',
        description: 'Close for the whole team rather than named providers.',
        required: false,
        resolver: 'none',
      },
      // §306 (`e2e-bug.462`): `prepareHolidayModePlanLogic` reads
      // `params.placeholder` directly and calls `resolveEmployees(employees,
      // params)`, which reads the two name fields.
      employeeName: {
        type: 'string',
        description: 'Close the schedule for this provider.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description: 'Close the schedule for these providers.',
        required: false,
        resolver: 'employee',
      },
      placeholder: {
        type: 'string',
        description: 'Label written on the closure blocks. Defaults to "Holiday closure".',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['we are closed next week', 'turn on holiday mode for christmas'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Turning holiday mode off does not restore bookings that were declined while it was on.',
    },
    handler: 'AiSchedulingService',
  },
  {
    id: 'schedule.onboard_provider',
    aliases: ['onboard_provider_schedule'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Set up a new provider working schedule.',
    // §177 (C2/T1) — the last schedule command: `prepareOnboardProviderSchedulePlan`
    // composes the same helpers as `block_schedule` (`resolveEmployees`,
    // `resolveDateRange`, `parseWeekdaysFromParams`) and adds the template pair.
    variables: {
      employeeName: {
        type: 'string',
        description: 'Provider being onboarded.',
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
        description: 'Apply to every provider.',
        required: false,
        resolver: 'none',
      },
      templateName: {
        type: 'string',
        description: 'Schedule template to apply for the first week.',
        required: false,
        resolver: 'none',
      },
      repeatWeeksCount: {
        type: 'number',
        description: 'How many weeks the template repeats for.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Single day to apply.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the onboarding range.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the onboarding range.',
        required: false,
        resolver: 'date',
      },
      weekdays: {
        type: 'string[]',
        description: 'Days the template applies to. `applyDays` is an alias.',
        required: false,
        resolver: 'none',
      },
      applyDays: {
        type: 'string[]',
        description: 'Alias for `weekdays`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['set up Mary schedule', 'onboard the new stylist hours'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'schedule.onboard_provider',
      captures: ['employeeId', 'previousSchedule'],
    },
    handler: 'AiSchedulingService',
  },
  {
    id: 'schedule.rebalance_capacity',
    aliases: ['rebalance_capacity'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T3',
    description: 'Redistribute booking capacity across providers.',
    variables: {
      // `prepareRebalanceCapacityPlanLogic` -> `parseRebalanceSlotCount`,
      // `resolveRebalanceTargetDate`, `resolveScheduleDates`,
      // `resolveEmployees`, `resolveServices`. Failure message: *"Specify
      // source and target providers, service, date, and how many slots to
      // move."*
      fromEmployeeName: {
        type: 'string',
        description: 'Provider the slots move away from.',
        required: false,
        resolver: 'employee',
      },
      toEmployeeName: {
        type: 'string',
        description: 'Provider the slots move to.',
        required: false,
        resolver: 'employee',
      },
      employeeName: {
        type: 'string',
        description: 'First provider.',
        required: false,
        resolver: 'employee',
      },
      swapWithEmployeeName: {
        type: 'string',
        description: 'Provider to swap with.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description:
          'Both providers at once, when the message names them as a pair.',
        required: false,
        resolver: 'employee',
      },
      serviceName: {
        type: 'string',
        description: 'Service whose slots are being moved.',
        required: false,
        resolver: 'service',
      },
      slotCount: {
        type: 'number',
        description: 'How many slots to move.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Day to rebalance, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'First day affected, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description:
          'Last day affected, ISO 8601 date. Same as `dateFrom` for a single day.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['rebalance the team capacity', 'spread bookings more evenly'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Rebalancing moves many bookings at once; restoring them needs per-booking pre-state.',
    },
    handler: 'AiSchedulingService',
  },
  {
    id: 'schedule.swap_schedules',
    aliases: ['swap_schedules'],
    domain: 'schedule',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T3',
    description: 'Swap the working schedules of two providers.',
    variables: {
      // tech-debt C2 — traced through `prepareSwapSchedulesPlanLogic` ->
      // `parseSwapEmployeeNames` + `resolveScheduleDates`. The schedule family
      // funnels params through a plan builder, so the contract sits two layers
      // below the handler rather than in it.
      //
      // The command's own failure message states the rule: *"Specify two
      // providers to swap schedules between"* and *"specify when"*. Neither is
      // required — the providers arrive as a pair OR as `employeeNames`, and
      // `required` has no "one of" form.
      employeeName: {
        type: 'string',
        description: 'First provider.',
        required: false,
        resolver: 'employee',
      },
      swapWithEmployeeName: {
        type: 'string',
        description: 'Provider to swap with.',
        required: false,
        resolver: 'employee',
      },
      employeeNames: {
        type: 'string[]',
        description:
          'Both providers at once, when the message names them as a pair.',
        required: false,
        resolver: 'employee',
      },
      dateFrom: {
        type: 'string',
        description: 'First day affected, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description:
          'Last day affected, ISO 8601 date. Same as `dateFrom` for a single day.',
        required: false,
        resolver: 'date',
      },
      // §306 (`e2e-bug.462`): `prepareSwapSchedulesPlanLogic` calls
      // `resolveScheduleDates(params, prompt)`, which reads `date`.
      // `allProviders` also reaches `resolveEmployees` through the spread, but
      // is deliberately not declared: a swap needs exactly two named targets,
      // so the all-providers arm can only ever fail the `length !== 2` check.
      date: {
        type: 'string',
        description: 'Single day to swap, ISO 8601 date. Alternative to dateFrom/dateTo.',
        required: false,
        resolver: 'date',
      },
    },
    examples: [
      'swap Gevorg and Mary shifts',
      'exchange their schedules this week',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'schedule.swap_schedules',
      captures: ['employeeIds', 'previousSchedules'],
    },
    handler: 'AiSchedulingService',
  },
] as const;
