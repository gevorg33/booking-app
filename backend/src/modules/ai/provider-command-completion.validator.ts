import {
  ValidationIssue,
  ValidationResult,
} from './command-completion.types.js';
import { buildClarifySummary } from './command-completion.validator.js';
import {
  hasAvailabilityWhen,
  hasRescheduleNewTime,
} from './booking-time-completion.util.js';

const PROVIDER_VALIDATED_ACTIONS = new Set([
  'cancel_bookings',
  'update_bookings',
  'mark_no_shows',
  'payment_sweep',
  'list_bookings',
  'show_appointments',
  'team_whos_next',
  'summarize_day',
  'reschedule_booking',
  'fill_unused_slots',
  'suggest_waitlist_for_gap',
  'add_retail_to_booking',
  'send_client_message',
  'block_my_time',
  'request_time_off',
  'check_availability',
  'block_schedule',
  'summarize_utilization',
  'check_in_client',
  'mark_running_late',
  'add_retail_to_booking',
  'send_client_message',
  'block_my_time',
  'request_time_off',
]);

export function shouldValidateProviderAction(action: string): boolean {
  return PROVIDER_VALIDATED_ACTIONS.has(action);
}

function hasBookingFilter(params: Record<string, unknown>): boolean {
  return (
    !!params.date ||
    !!params.customerName ||
    params.allAppointments === true ||
    !!params.timeSlot ||
    !!params.serviceName
  );
}

const PROVIDER_ACTION_RULES: Record<
  string,
  (params: Record<string, unknown>) => ValidationIssue[]
> = {
  cancel_bookings: (params) =>
    hasBookingFilter(params)
      ? []
      : [
          {
            field: 'date',
            label: 'Which appointments',
            message:
              'Specify which appointments to cancel (today, a customer, or a time)',
            example: "Cancel all my appointments today — I'm sick",
          },
        ],

  update_bookings: (params) => {
    const hasTarget =
      params.allAppointments === true ||
      !!params.customerName ||
      !!params.timeSlot;
    const hasChange = !!params.status || !!params.paymentStatus;
    return [
      ...(hasTarget
        ? []
        : [
            {
              field: 'customerName',
              label: 'Appointment',
              message: 'Specify which appointment(s) to update',
              example: "Mark John's 13:00 as done and paid",
            },
          ]),
      ...(hasChange
        ? []
        : [
            {
              field: 'status',
              label: 'Update',
              message: 'Specify status and/or payment to apply',
              example: 'Mark all today as done with payment paid',
            },
          ]),
    ];
  },

  mark_no_shows: (params) =>
    params.date || params.dateFrom || params.allAppointments === true
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify which day to mark no-shows for',
            example: 'Mark no-shows for today',
          },
        ],

  payment_sweep: (params) =>
    params.date || params.dateFrom || params.allAppointments === true
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify which day to run payment sweep for',
            example: 'Payment sweep for today',
          },
        ],

  list_bookings: () => [],
  show_appointments: () => [],
  team_whos_next: () => [],
  summarize_day: () => [],
  check_availability: (params) =>
    hasAvailabilityWhen(params)
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify which day to check',
            example: 'Any open slots this afternoon?',
          },
        ],
  block_schedule: (params) =>
    params.date || params.dateFrom || params.timeFrom
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify when to block time',
            example: 'Block lunch 12:00–13:00 today',
          },
        ],
  summarize_utilization: () => [],

  reschedule_booking: (params) => {
    const hasTarget =
      !!params.customerName ||
      !!params.timeSlot ||
      params.allAppointments === true;
    const hasNewTime = hasRescheduleNewTime(params);
    return [
      ...(hasTarget
        ? []
        : [
            {
              field: 'customerName',
              label: 'Appointment',
              message: 'Specify which appointment to reschedule',
              example: 'Reschedule John at 13:00 to 16:00',
            },
          ]),
      ...(hasNewTime
        ? []
        : [
            {
              field: 'timeSlot',
              label: 'New time',
              message: 'Specify the new time',
              example: 'Move to 16:00',
            },
          ]),
    ];
  },

  fill_unused_slots: (params) =>
    params.date || params.dateFrom || params.timeFrom
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify when to fill gaps',
            example: 'Fill gaps this afternoon between 14:00 and 18:00',
          },
        ],

  suggest_waitlist_for_gap: (params) =>
    (params.date || params.dateFrom) && params.timeFrom && params.timeTo
      ? []
      : [
          {
            field: 'timeFrom',
            label: 'Gap window',
            message: 'Specify the gap date and time window',
            example: 'Fill this gap on 09/06/2026 from 14:00 to 15:30',
          },
        ],

  add_retail_to_booking: (params) =>
    params.bookingId || params.customerName || params.productName
      ? []
      : [
          {
            field: 'productName',
            label: 'Product',
            message: 'Name the product and booking',
            example: 'Add shampoo to Jane booking',
          },
        ],

  send_client_message: (params) =>
    params.bookingId || params.customerName
      ? []
      : [
          {
            field: 'customerName',
            label: 'Client',
            message: 'Open an appointment or name the client to message',
            example: 'Text Jane running late',
          },
        ],

  block_my_time: (params) =>
    params.date && (params.timeFrom || params.startTime) && (params.timeTo || params.endTime)
      ? []
      : params.timeFrom || params.startTime
        ? []
        : [
            {
              field: 'timeFrom',
              label: 'Block window',
              message: 'Specify when to block your calendar',
              example: 'Block my lunch 12:00 to 13:00 today',
            },
          ],

  request_time_off: (params) =>
    params.startDate || params.date || params.dateFrom
      ? []
      : [
          {
            field: 'startDate',
            label: 'Dates',
            message: 'Specify the dates you need off',
            example: 'Request June 10–12 off',
          },
        ],

  check_in_client: (params) =>
    params.bookingId || params.customerName
      ? []
      : [
          {
            field: 'customerName',
            label: 'Client',
            message: 'Open an appointment or name the client to check in',
            example: 'Check in Jane Doe',
          },
        ],

  mark_running_late: (params) =>
    params.bookingId || params.customerName
      ? []
      : [
          {
            field: 'customerName',
            label: 'Client',
            message: 'Open an appointment or name the client for running late',
            example: "I'm running 10 minutes late for Jane",
          },
        ],
};

export function validateProviderCommand(
  action: string,
  params: Record<string, unknown>,
): ValidationResult {
  const rule = PROVIDER_ACTION_RULES[action];
  const issues = rule ? rule(params) : [];
  return { ok: issues.length === 0, issues };
}

export { buildClarifySummary };
