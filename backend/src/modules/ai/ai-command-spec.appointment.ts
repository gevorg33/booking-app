/**
 * AI-ROADMAP Phase 1 pilot — the `appointment` domain as CommandSpecs.
 *
 * Why this domain first: it carries the worst measured failure rates in
 * production (`create_booking` 58%, `book_appointment` 52%, `reschedule_booking`
 * 42%) and is the domain the multi-command example exercises ("move John's
 * appointment, cancel Mary's, create David").
 *
 * `surfaces` and `handler` below are copied from the live registry, not
 * invented — `ai-command-spec.conformance.spec.ts` fails if they ever drift.
 *
 * `risk` is genuinely new information: the registry only knows `mutating:
 * boolean`, which cannot tell "reschedule one appointment" (T1) from "cancel
 * every appointment this week" (T3) or "mark this paid" (T2, money).
 */
import type { CommandSpec } from './ai-command-spec.types.js';

/**
 * tech-debt A6 / `e2e-bug.399` — the appointment a command acts on.
 *
 * This was `appointmentId`, `required: true`. Three things were wrong with that
 * and only the third had been noticed:
 *
 * 1. **Nothing reads `appointmentId`.** `handleRescheduleBooking` reads
 *    `params.bookingId`; `handleMarkPaidLogic` reads `params.bookingId` /
 *    `params.bookingIds`. A plan filling `appointmentId` perfectly would still
 *    reach a handler that never looks at it.
 * 2. **It is not required.** Both handlers resolve the booking from a *human*
 *    reference when no id is given — `handleRescheduleBooking`'s own failure
 *    message spells the contract out: *"Specify bookingId, customer name, or
 *    provider + date/time."*
 * 3. The planner is asked for an id and rule 4 forbids inventing one, so it
 *    refuses. That is `e2e-bug.399`'s deadlock, and it is a *consequence* of 1
 *    and 2 rather than a missing resolver seam.
 *
 * The proof is in the specs' own examples: *"move John's appointment to tomorrow
 * at 3pm"* and *"mark the 2pm haircut as paid"* contain no id, so **every
 * documented example of both commands failed the command's own required-variable
 * check**. Two prompt-side attempts (§120, §130) tried to fix this by telling the
 * planner a resolver existed; the variable it was being told about was fictional.
 *
 * Optional, because the handlers accept any *one* of several identifiers and
 * `CommandVariableSpec.required` is per-variable with no "one of" form. Marking
 * any single one required would restore the deadlock; the handlers already
 * enforce the real rule and say so clearly when it is not met.
 */
const bookingId = {
  type: 'string',
  description:
    'Id of the booking to act on, when it is already known — e.g. produced by an earlier step. Omit it and name the customer, provider or time instead; the command resolves the booking itself.',
  required: false,
  resolver: 'appointment',
} as const;

/** The human references both handlers resolve a booking from when no id is given. */
const bookingLookupVariables = {
  bookingId,
  customerName: {
    type: 'string',
    description: 'Customer whose appointment this is.',
    required: false,
    resolver: 'customer',
  },
  employeeName: {
    type: 'string',
    description: 'Provider whose appointment this is.',
    required: false,
    resolver: 'employee',
  },
  serviceName: {
    type: 'string',
    description: 'Service the appointment is for, to tell two bookings apart.',
    required: false,
    resolver: 'service',
  },
} as const;

export const APPOINTMENT_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'appointment.create',
    aliases: ['create_booking'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Book a new appointment for a customer at a specific date and time, optionally with a named provider.',
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer the appointment is for.',
        required: true,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description: 'Service being booked.',
        required: true,
        resolver: 'service',
      },
      // `startsAt` was declared required and ISO 8601; `handleCreateBooking`
      // reads `date` and `timeSlot`, and the string `startsAt` appears nowhere
      // in `src/` as an AI param. Same defect as `newStart` on reschedule.
      date: {
        type: 'string',
        description: 'Day to book, ISO 8601 date.',
        required: true,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Time to book, `HH:MM`.',
        required: false,
        resolver: 'datetime',
      },
      bookingFirstAvailable: {
        type: 'boolean',
        description:
          'Take the first free slot on that day instead of a stated time — for "the first available massage slot on Monday".',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      employeeName: {
        type: 'string',
        description: 'Provider who will deliver the service.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: [
      'book Sarah a deep tissue massage tomorrow at 2pm',
      'put David down for a haircut with Karo on Friday morning',
      'create an appointment for Mary, facial, next Tuesday 10:00',
      'Book the nearest available slot for Swedish massage tomorrow',
      'Create an appointment for the first available facial slot next Monday for any provider',
    ],
    confirm: 'if-ambiguous',
    // Cancelling is not un-creating: it leaves a cancelled row and the customer
    // is typically notified. A compensation, not a rollback.
    compensation: {
      kind: 'inverse',
      command: 'appointment.cancel_mine',
      captures: ['appointmentId'],
    },
    handler: 'AiCommandService',
  },
  {
    id: 'appointment.reschedule',
    aliases: ['reschedule_booking'],
    domain: 'booking',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description:
      'Move an existing appointment to a new date and/or time, keeping the same customer and service.',
    variables: {
      // `employeeName` came in here described as *"move to a different provider
      // at the same time"*. `handleRescheduleBooking` reads it in exactly one
      // place — as a key to *find* the booking — and never reassigns the
      // provider; changing provider is `switch_provider_same_time`'s job. The
      // shared lookup description is what the code does.
      ...bookingLookupVariables,
      // `newStart` was declared required and ISO 8601. The handler reads neither
      // — it takes `date` and `timeSlot` separately, both produced by
      // `resolveRescheduleParams`. A required variable nothing consumes is the
      // other half of the deadlock described above.
      date: {
        type: 'string',
        description: 'Day to move the appointment to, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Time of day to move the appointment to, `HH:MM`.',
        required: false,
        resolver: 'datetime',
      },
      bookingFirstAvailable: {
        type: 'boolean',
        description:
          'Move to the soonest free slot instead of a stated time — for "reschedule to the earliest opening".',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      fromDate: {
        type: 'string',
        description:
          'Day the appointment is currently on, when it is needed to tell two bookings apart.',
        required: false,
        resolver: 'date',
      },
      fromTimeSlot: {
        type: 'string',
        description:
          'Time the appointment is currently at, when it is needed to tell two bookings apart.',
        required: false,
        resolver: 'datetime',
      },
    },
    examples: [
      "move John's appointment to tomorrow at 3pm",
      'push my Tuesday facial back an hour',
      'reschedule the 2pm massage to Thursday same time',
      'Reschedule Gevorg appointment to the soonest free slot tomorrow',
    ],
    confirm: 'if-ambiguous',
    // The original start exists only in the row before the write, so it must be
    // captured. Without it the "undo" moves the appointment to undefined.
    compensation: {
      kind: 'inverse',
      command: 'appointment.reschedule',
      captures: ['appointmentId', 'originalStart'],
    },
    handler: 'AiCommandService',
  },
  {
    id: 'appointment.cancel_bulk',
    aliases: ['cancel_bookings'],
    domain: 'booking',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['staff', 'manager', 'owner'],
    },
    // T3: matches on a filter, so one command can cancel an unbounded number of
    // appointments. Needs confirm + a blast-radius cap, unlike a single cancel.
    risk: 'T3',
    description:
      'Cancel one or more existing appointments matching a customer, provider, service or date range.',
    variables: {
      // §310 (`e2e-bug.533`): **this scope is not applied.** Nothing in
      // `findBookingsForCancel` reads `customerName` — the where-clause is
      // built from employee, service and date scope only. Kept declared rather
      // than deleted because the planner does emit it and the gap is the bug,
      // not the declaration; the description says so until the filter exists.
      customerName: {
        type: 'string',
        description:
          'Customer to restrict to. NOT CURRENTLY APPLIED — see e2e-bug.533; the bulk filter ignores it.',
        required: false,
        resolver: 'customer',
      },
      employeeName: {
        type: 'string',
        description: "Only cancel appointments on this provider's calendar.",
        required: false,
        resolver: 'employee',
      },
      date: {
        type: 'string',
        description: 'Only cancel appointments on this day, ISO date.',
        required: false,
        resolver: 'date',
      },
      reason: {
        type: 'string',
        description: 'Cancellation reason recorded on the appointment.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      "cancel Mary's appointment",
      'cancel everything on Karo’s calendar Friday',
      'clear all bookings for tomorrow, the salon is closed',
    ],
    confirm: 'always',
    // Un-cancelling is not a supported operation, and even where a row could be
    // flipped back the cancellation notices have already gone out.
    compensation: {
      kind: 'none',
      reason:
        'Cancellations notify customers; restoring the rows would not unsend those messages.',
    },
    handler: 'AiCommandService',
    bulkOf: 'appointment.cancel',
  },
  {
    id: 'appointment.update_bulk',
    aliases: ['update_bookings'],
    domain: 'booking',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['manager', 'owner'],
      provider: ['staff', 'manager', 'owner'],
    },
    risk: 'T3',
    description:
      'Change status or details on one or more existing appointments (e.g. mark completed, mark no-show).',
    variables: {
      status: {
        type: 'string',
        description: 'New appointment status.',
        required: false,
        resolver: 'none',
        enum: ['confirmed', 'completed', 'no_show', 'in_progress'],
      },
      // §310 (`e2e-bug.533`): **this scope is not applied.** Nothing in
      // `findBookingsForBulkUpdate` reads `customerName` — the where-clause is
      // built from employee, service and date scope only. Kept declared rather
      // than deleted because the planner does emit it and the gap is the bug,
      // not the declaration; the description says so until the filter exists.
      customerName: {
        type: 'string',
        description:
          'Customer to restrict to. NOT CURRENTLY APPLIED — see e2e-bug.533; the bulk filter ignores it.',
        required: false,
        resolver: 'customer',
      },
      date: {
        type: 'string',
        description: 'Restrict to this day, ISO date.',
        required: false,
        resolver: 'date',
      },
    },
    examples: [
      "mark Karo's 10am as completed",
      'set yesterday’s no-shows',
      'mark the 3pm massage as done',
    ],
    confirm: 'always',
    // Reversible in principle — restore each row's prior values — but a bulk
    // write spans many rows and the saga has no per-row pre-state. A human with
    // the audit log can do it; this cannot.
    compensation: {
      kind: 'manual',
      reason:
        'Restoring prior values needs per-row pre-state the executor does not capture.',
    },
    handler: 'AiCommandService',
  },
  {
    id: 'appointment.mark_paid',
    aliases: ['mark_paid'],
    domain: 'booking',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    // T2: money. Production shows `update_bookings -> mark_paid` steals failing
    // 91% of the time — a wrong write here is a financial record, so this can
    // never execute on an ambiguous plan.
    risk: 'T2',
    description:
      'Record payment against an existing appointment that has already been delivered.',
    variables: {
      ...bookingLookupVariables,
      date: {
        type: 'string',
        description: 'Day the appointment is on, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description:
          'Time of the appointment, `HH:MM` — how "the 2pm haircut" picks one booking out of several.',
        required: false,
        resolver: 'datetime',
      },
      amount: {
        type: 'number',
        description: 'Amount paid, when it differs from the service price.',
        required: false,
        resolver: 'money',
      },
      paymentMethod: {
        type: 'string',
        description: 'How the customer paid.',
        required: false,
        resolver: 'none',
        enum: ['cash', 'card', 'online', 'gift_card'],
      },
    },
    examples: [
      'mark the 2pm haircut as paid',
      "Sarah paid cash for today's massage",
    ],
    confirm: 'always',
    // T2, money. A refund is a second financial event with its own record and
    // possibly fees — not an undo. Declaring one here would let a failed plan
    // silently move money to tidy itself up.
    compensation: {
      kind: 'none',
      reason:
        'Payment records are financial events; reversing one is a refund, which is a new event and not a rollback.',
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'appointment.book_public',
    aliases: ['book_appointment'],
    domain: 'booking',
    surfaces: ['public', 'customer'],
    tiers: {
      public: ['client', 'staff', 'manager', 'owner'],
      customer: ['client'],
    },
    risk: 'T1',
    description:
      'A visitor books an appointment for themselves on the public booking page.',
    variables: {
      serviceName: {
        type: 'string',
        description: 'Service to book.',
        required: true,
        resolver: 'service',
      },
      // The second and last `startsAt`. `handleBookAppointment` in
      // `public-booking-assistant.service.ts` reads `date`, `timeSlot` and
      // `bookingFirstAvailable`; `startsAt` is not among them.
      date: {
        type: 'string',
        description: 'Day to book, ISO 8601 date.',
        required: true,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Time to book, `HH:MM`.',
        required: false,
        resolver: 'datetime',
      },
      bookingFirstAvailable: {
        type: 'boolean',
        description:
          'Take the first free slot on that day — for "whenever you have space Friday afternoon".',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
      employeeName: {
        type: 'string',
        description: 'Preferred provider.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: [
      'book a swedish massage with Gevorg tomorrow at 11am',
      "I'd like a haircut Friday afternoon",
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'appointment.cancel_mine',
      captures: ['appointmentId'],
    },
    handler: 'PublicBookingAssistantService',
  },
  {
    id: 'appointment.cancel_mine',
    aliases: ['cancel_my_booking'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'A signed-in customer cancels their own upcoming appointment.',
    variables: {
      // `resolveOwnedBooking` reads `bookingId` and reports `missing:
      // ['bookingId']` when it cannot narrow — the customer-side handlers name
      // the same field the dashboard ones do.
      bookingId,
      date: {
        type: 'string',
        description:
          'Day of the appointment being cancelled, ISO 8601 date — how "cancel Friday" picks one of several.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Time of the appointment being cancelled, `HH:MM`.',
        required: false,
        resolver: 'datetime',
      },
    },
    examples: ['cancel my appointment', 'I need to cancel Friday'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'none',
      reason:
        'The customer has been told the appointment is cancelled; the slot may already be taken.',
    },
    handler: 'AiSelfServiceBookingService',
  },
  {
    id: 'appointment.reschedule_mine',
    aliases: ['reschedule_my_booking'],
    domain: 'booking',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description:
      'A signed-in customer moves their own upcoming appointment to a new time.',
    variables: {
      bookingId,
      // `newStart` was `required: true` and read by nothing: the string
      // `newStart` does not appear as an AI param anywhere in `src/`.
      // `enrichRescheduleMyBookingParamsFromPrompt` produces `date`,
      // `timeSlot`, `fromDate` and `fromTimeSlot`.
      date: {
        type: 'string',
        description: 'Day to move the appointment to, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Time of day to move the appointment to, `HH:MM`.',
        required: false,
        resolver: 'datetime',
      },
      fromDate: {
        type: 'string',
        description: 'Day the appointment is currently on.',
        required: false,
        resolver: 'date',
      },
      fromTimeSlot: {
        type: 'string',
        description: 'Time the appointment is currently at.',
        required: false,
        resolver: 'datetime',
      },
    },
    examples: [
      'move my appointment to Saturday',
      'can I push my booking to 4pm instead',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'appointment.reschedule_mine',
      captures: ['appointmentId', 'originalStart'],
    },
    handler: 'AiSelfServiceBookingService',
  },
] as const;
