import type { ClinicSpecimenStatus } from './clinic-lab-state.util.js';

export const CLINIC_OVERDUE_SPECIMEN_SCENARIOS = [
  {
    id: 'not-overdue-before-grace',
    status: 'NotCollected' as ClinicSpecimenStatus,
    bookingStartTime: new Date('2026-06-23T10:00:00.000Z'),
    specimenCreatedAt: new Date('2026-06-23T09:00:00.000Z'),
    now: new Date('2026-06-23T10:10:00.000Z'),
    overdue: false,
  },
  {
    id: 'overdue-after-grace',
    status: 'NotCollected' as ClinicSpecimenStatus,
    bookingStartTime: new Date('2026-06-23T10:00:00.000Z'),
    specimenCreatedAt: new Date('2026-06-23T09:00:00.000Z'),
    now: new Date('2026-06-23T10:20:00.000Z'),
    overdue: true,
  },
  {
    id: 'recollect-required-overdue',
    status: 'RecollectRequired' as ClinicSpecimenStatus,
    bookingStartTime: new Date('2026-06-23T08:00:00.000Z'),
    specimenCreatedAt: new Date('2026-06-23T07:30:00.000Z'),
    now: new Date('2026-06-23T09:00:00.000Z'),
    overdue: true,
  },
  {
    id: 'collected-not-overdue',
    status: 'Collected' as ClinicSpecimenStatus,
    bookingStartTime: new Date('2026-06-23T08:00:00.000Z'),
    specimenCreatedAt: new Date('2026-06-23T07:30:00.000Z'),
    now: new Date('2026-06-23T12:00:00.000Z'),
    overdue: false,
  },
  {
    id: 'walk-in-overdue-from-created-at',
    status: 'NotCollected' as ClinicSpecimenStatus,
    bookingStartTime: null,
    specimenCreatedAt: new Date('2026-06-23T08:00:00.000Z'),
    now: new Date('2026-06-23T08:20:00.000Z'),
    overdue: true,
  },
] as const;

export const CLINIC_LAB_BOOKING_REQUEST_CALLBACK_SCENARIOS = [
  {
    id: 'not-overdue-before-3-days',
    status: 'NotCollected' as const,
    bookingRequestPushedAt: new Date('2026-06-20T10:00:00.000Z'),
    collectionBookingId: null,
    now: new Date('2026-06-22T10:00:00.000Z'),
    overdue: false,
  },
  {
    id: 'overdue-after-3-days',
    status: 'NotCollected' as const,
    bookingRequestPushedAt: new Date('2026-06-20T10:00:00.000Z'),
    collectionBookingId: null,
    now: new Date('2026-06-23T10:00:00.000Z'),
    overdue: true,
  },
  {
    id: 'collection-booked-not-overdue',
    status: 'NotCollected' as const,
    bookingRequestPushedAt: new Date('2026-06-20T10:00:00.000Z'),
    collectionBookingId: 'collection-booking-1',
    now: new Date('2026-06-25T10:00:00.000Z'),
    overdue: false,
  },
  {
    id: 'not-pushed-not-overdue',
    status: 'NotCollected' as const,
    bookingRequestPushedAt: null,
    collectionBookingId: null,
    now: new Date('2026-06-25T10:00:00.000Z'),
    overdue: false,
  },
] as const;

export const CLINIC_RESULT_REVIEW_AUTO_TASK_SCENARIOS = [
  {
    id: 'completed-needs-task',
    status: 'Completed',
    shouldEnsure: true,
    shouldResolve: false,
  },
  {
    id: 'reviewed-resolves-task',
    status: 'Reviewed',
    shouldEnsure: false,
    shouldResolve: true,
  },
  {
    id: 'pending-no-task',
    status: 'Pending',
    shouldEnsure: false,
    shouldResolve: false,
  },
] as const;
