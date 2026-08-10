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

const appointmentId = {
  type: 'string',
  description: 'The appointment being acted on.',
  required: true,
  resolver: 'appointment',
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
      startsAt: {
        type: 'string',
        description: 'Appointment start, ISO 8601.',
        required: true,
        resolver: 'datetime',
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
      appointmentId,
      newStart: {
        type: 'string',
        description: 'New start time, ISO 8601.',
        required: true,
        resolver: 'datetime',
      },
      employeeName: {
        type: 'string',
        description: 'Move to a different provider at the same time.',
        required: false,
        resolver: 'employee',
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
      customerName: {
        type: 'string',
        description: 'Only cancel appointments for this customer.',
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
      customerName: {
        type: 'string',
        description: 'Restrict to this customer.',
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
      appointmentId,
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
      startsAt: {
        type: 'string',
        description: 'Requested start time, ISO 8601.',
        required: true,
        resolver: 'datetime',
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
      appointmentId: { ...appointmentId, required: false },
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
      appointmentId: { ...appointmentId, required: false },
      newStart: {
        type: 'string',
        description: 'New start time, ISO 8601.',
        required: true,
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
