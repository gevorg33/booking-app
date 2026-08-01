/**
 * e2e-bug.254 fixtures — Face Pilling-style exclusive assignee with only past hours.
 */

import {
  E2E254_EMPTY_REASON_ASSIGNED_UNSCHEDULED,
  type E2e254ServiceBlockPattern,
} from './e2e254-assigned-provider-hours.util.js';

export const E2E254_FACE_PILLING_SERVICE_ID =
  '69adc9ef-3a25-486b-b12d-13fc4855e44c';

export const E2E254_UNIT_CASES = [
  {
    id: 'period-allows-explicit-service',
    description: 'periodAllowsService accepts explicit service id list',
  },
  {
    id: 'period-allows-open-null',
    description: 'periodAllowsService treats null/empty as any service',
  },
  {
    id: 'extract-patterns-filters-service',
    description: 'extractServiceBlockPatterns keeps only blocks allowing the service',
  },
  {
    id: 'project-same-weekday-forward',
    description: 'projectPatternsOntoDateKeys lands on matching weekdays only',
  },
  {
    id: 'build-micro-slots-10-min',
    description: 'buildMicroSlotsForServiceBlock emits 10-minute available slots',
  },
  {
    id: 'diagnose-assigned-unscheduled',
    description: 'diagnose returns assigned_providers_unscheduled when gap matches',
  },
  {
    id: 'diagnose-null-when-dates-exist',
    description: 'diagnose returns null when bookable dates were found',
  },
] as const;

export const E2E254_LIVE_CASES = [
  {
    id: 'face-pilling-online-full-prepay',
    description: 'Face Pilling remains onlinePaymentEnabled + prepaymentMode full',
  },
  {
    id: 'face-pilling-bookable-dates-nonempty',
    description: 'Face Pilling bookable-dates returns ≥1 date in next 21 days',
  },
  {
    id: 'face-pilling-day-slots-nonempty',
    description: 'Face Pilling slots on first bookable date are non-empty',
  },
  {
    id: 'swedish-still-bookable',
    description: 'Swedish massage still has bookable dates (control)',
  },
  {
    id: 'face-pilling-slot-employee-is-assignee',
    description: 'Returned Face Pilling slot employee is an assigned Face Pilling provider',
  },
  {
    id: 'empty-reason-constant-stable',
    description: 'emptyReason constant stays assigned_providers_unscheduled',
  },
  {
    id: 'face-pilling-bookable-dates-idempotent',
    description: 'Second bookable-dates call stays non-empty (roll-forward idempotent)',
  },
] as const;

export const E2E254_SAMPLE_PAST_PATTERNS: E2e254ServiceBlockPattern[] = [
  {
    startMinute: 9 * 60,
    endMinute: 13 * 60,
    serviceIds: [E2E254_FACE_PILLING_SERVICE_ID],
    maxAppointmentCount: 1,
    utcDayOfWeek: 3, // Wednesday
  },
  {
    startMinute: 14 * 60,
    endMinute: 18 * 60,
    serviceIds: [E2E254_FACE_PILLING_SERVICE_ID],
    maxAppointmentCount: 1,
    utcDayOfWeek: 3,
  },
];

export { E2E254_EMPTY_REASON_ASSIGNED_UNSCHEDULED };
