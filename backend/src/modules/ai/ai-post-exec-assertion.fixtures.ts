import type { ClassificationSurface } from './ai-classification-engine.types.js';

export interface PostExecAssertionScenario {
  id: string;
  surface?: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  executionResult: Record<string, unknown>;
  expectOk: boolean;
  expectMessageIncludes?: string;
}

export const POST_EXEC_ASSERTABLE_ACTIONS = new Set([
  'create_booking',
  'reschedule_booking',
  'cancel_booking',
  'cancel_bookings',
  'mark_paid',
  'fill_slot_from_waitlist',
  'update_bookings',
]);

export const POST_EXEC_ASSERTION_SCENARIOS: PostExecAssertionScenario[] = [
  {
    id: 'create-booking-ok',
    action: 'create_booking',
    params: {
      employeeId: 'e1',
      serviceId: 's1',
      timeSlot: '10:00',
      date: '2026-06-08',
    },
    executionResult: {
      bookingId: 'bk-1',
      employeeId: 'e1',
      serviceId: 's1',
      startTime: '2026-06-08T10:00:00.000Z',
      timeSlot: '10:00',
    },
    expectOk: true,
  },
  {
    id: 'create-booking-missing-id',
    action: 'create_booking',
    params: { employeeId: 'e1', serviceId: 's1', date: '2026-06-08', timeSlot: '10:00' },
    executionResult: {},
    expectOk: false,
    expectMessageIncludes: 'not created',
  },
  {
    id: 'create-booking-wrong-provider',
    action: 'create_booking',
    params: { employeeId: 'e1', serviceId: 's1' },
    executionResult: { bookingId: 'bk-1', employeeId: 'e2' },
    expectOk: false,
    expectMessageIncludes: 'different provider',
  },
  {
    id: 'create-booking-wrong-time',
    action: 'create_booking',
    params: { employeeId: 'e1', timeSlot: '10:00', date: '2026-06-08' },
    executionResult: {
      bookingId: 'bk-1',
      employeeId: 'e1',
      startTime: '2026-06-08T11:00:00.000Z',
      timeSlot: '11:00',
    },
    expectOk: false,
    expectMessageIncludes: 'requested',
  },
  {
    id: 'create-booking-from-workflow-steps',
    action: 'create_booking',
    params: { employeeId: 'e1', serviceId: 's1' },
    executionResult: {
      status: 'completed',
      steps: [
        {
          stepId: 's1',
          status: 'completed',
          result: { bookingId: 'bk-9', employeeId: 'e1', serviceId: 's1' },
        },
      ],
    },
    expectOk: true,
  },
  {
    id: 'cancel-bookings-none',
    action: 'cancel_bookings',
    params: { bookingIds: ['a', 'b'] },
    executionResult: { cancelledCount: 0 },
    expectOk: false,
    expectMessageIncludes: 'No bookings were cancelled',
  },
  {
    id: 'cancel-bookings-ok',
    action: 'cancel_bookings',
    params: { bookingIds: ['a', 'b'] },
    executionResult: { cancelledCount: 2 },
    expectOk: true,
  },
  {
    id: 'reschedule-booking-ok',
    action: 'reschedule_booking',
    params: { bookingId: 'bk-1', timeSlot: '15:00', date: '2026-06-08' },
    executionResult: {
      bookingId: 'bk-1',
      startTime: '2026-06-08T15:00:00.000Z',
      timeSlot: '15:00',
    },
    expectOk: true,
  },
  {
    id: 'reschedule-booking-wrong-time',
    action: 'reschedule_booking',
    params: { bookingId: 'bk-1', timeSlot: '15:00' },
    executionResult: {
      bookingId: 'bk-1',
      startTime: '2026-06-08T16:00:00.000Z',
      timeSlot: '16:00',
    },
    expectOk: false,
    expectMessageIncludes: 'requested',
  },
  {
    id: 'mark-paid-ok',
    action: 'mark_paid',
    params: { bookingId: 'bk-1' },
    executionResult: { bookingId: 'bk-1', paymentStatus: 'paid' },
    expectOk: true,
  },
  {
    id: 'mark-paid-missing',
    action: 'mark_paid',
    params: { bookingId: 'bk-1' },
    executionResult: { bookingId: 'bk-1', paymentStatus: 'pending' },
    expectOk: false,
    expectMessageIncludes: 'paid',
  },
  {
    id: 'fill-waitlist-ok',
    action: 'fill_slot_from_waitlist',
    params: { serviceName: 'Massage', date: '2026-06-08' },
    executionResult: { bookingId: 'bk-w1' },
    expectOk: true,
  },
  {
    id: 'read-action-skipped',
    action: 'list_appointments',
    params: { date: '2026-06-08' },
    executionResult: {},
    expectOk: true,
  },
];
