import { ValidationIssue, ValidationResult } from './command-completion.types.js';
import { buildClarifySummary } from './command-completion.validator.js';

const PROVIDER_VALIDATED_ACTIONS = new Set([
  'cancel_bookings',
  'update_bookings',
  'mark_no_shows',
  'payment_sweep',
  'list_bookings',
  'summarize_day',
  'reschedule_booking',
  'fill_unused_slots',
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

const PROVIDER_ACTION_RULES: Record<string, (params: Record<string, unknown>) => ValidationIssue[]> = {
  cancel_bookings: (params) =>
    hasBookingFilter(params)
      ? []
      : [{
          field: 'date',
          label: 'Which appointments',
          message: 'Specify which appointments to cancel (today, a customer, or a time)',
          example: "Cancel all my appointments today — I'm sick",
        }],

  update_bookings: (params) => {
    const hasTarget =
      params.allAppointments === true ||
      !!params.customerName ||
      !!params.timeSlot;
    const hasChange = !!params.status || !!params.paymentStatus;
    return [
      ...(hasTarget
        ? []
        : [{
            field: 'customerName',
            label: 'Appointment',
            message: 'Specify which appointment(s) to update',
            example: "Mark John's 13:00 as done and paid",
          }]),
      ...(hasChange
        ? []
        : [{
            field: 'status',
            label: 'Update',
            message: 'Specify status and/or payment to apply',
            example: 'Mark all today as done with payment paid',
          }]),
    ];
  },

  mark_no_shows: (params) =>
    params.date || params.dateFrom || params.allAppointments === true
      ? []
      : [{
          field: 'date',
          label: 'When',
          message: 'Specify which day to mark no-shows for',
          example: 'Mark no-shows for today',
        }],

  payment_sweep: (params) =>
    params.date || params.dateFrom || params.allAppointments === true
      ? []
      : [{
          field: 'date',
          label: 'When',
          message: 'Specify which day to run payment sweep for',
          example: 'Payment sweep for today',
        }],

  list_bookings: () => [],
  summarize_day: () => [],

  reschedule_booking: (params) => {
    const hasTarget =
      !!params.customerName ||
      !!params.timeSlot ||
      params.allAppointments === true;
    const hasNewTime = !!params.date || !!params.timeSlot;
    return [
      ...(hasTarget
        ? []
        : [{
            field: 'customerName',
            label: 'Appointment',
            message: 'Specify which appointment to reschedule',
            example: 'Reschedule John at 13:00 to 16:00',
          }]),
      ...(hasNewTime
        ? []
        : [{
            field: 'timeSlot',
            label: 'New time',
            message: 'Specify the new time',
            example: 'Move to 16:00',
          }]),
    ];
  },

  fill_unused_slots: (params) =>
    params.date || params.dateFrom || params.timeFrom
      ? []
      : [{
          field: 'date',
          label: 'When',
          message: 'Specify when to fill gaps',
          example: 'Fill gaps this afternoon between 14:00 and 18:00',
        }],
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
