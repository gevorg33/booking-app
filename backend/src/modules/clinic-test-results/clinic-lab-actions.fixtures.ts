import {
  CLINIC_LAB_ORDER_TRANSITION_FIXTURES,
  CLINIC_LAB_RESULT_TRANSITION_FIXTURES,
} from '../../common/utils/clinic-lab-state.fixtures.js';
import type {
  ClinicTestOrderStatus,
  ClinicTestResultStatus,
} from '../../common/utils/clinic-lab-state.util.js';

/** Pollin `order-actions.test.ts` — skipped (fertility milestone / super-type UI). */
export const SKIPPED_POLLIN_ORDER_ACTION_SCENARIOS = [
  {
    id: 'pollin-get-order-actions',
    pollinSource: 'order-controller/order-actions.test.ts',
    reason:
      'GET /order/:id/order-actions milestone groups — fertility workflow; Booking uses ClinicTestOrderStatusService instead',
  },
] as const;

export interface PortedOrderStatusActionScenario {
  id: string;
  from: ClinicTestOrderStatus;
  to: ClinicTestOrderStatus;
  /** Pollin equivalent: status mutation via order-actions pipeline */
  pollinEquivalent: 'order-status-transition';
}

export const PORTED_ORDER_STATUS_ACTION_SCENARIOS: PortedOrderStatusActionScenario[] =
  CLINIC_LAB_ORDER_TRANSITION_FIXTURES.filter((fixture) => fixture.allowed).map(
    (fixture) => ({
      id: fixture.id,
      from: fixture.from as ClinicTestOrderStatus,
      to: fixture.to as ClinicTestOrderStatus,
      pollinEquivalent: 'order-status-transition' as const,
    }),
  );

export const PORTED_ORDER_STATUS_ACTION_REJECT_SCENARIOS =
  CLINIC_LAB_ORDER_TRANSITION_FIXTURES.filter(
    (fixture) => !fixture.allowed,
  ).map((fixture) => ({
    id: fixture.id,
    from: fixture.from as ClinicTestOrderStatus,
    to: fixture.to as ClinicTestOrderStatus,
  }));

export interface PortedTestResultActionScenario {
  id: string;
  pollinSource: string;
  action: 'markAsReleased' | 'markAsReviewed';
  fromStatus: ClinicTestResultStatus;
  comment?: string;
  employeeId?: string;
  expectReleasedAt?: boolean;
  expectReviewedAt?: boolean;
  expectPatientVisibilityNew?: boolean;
  expectEventPublish?: boolean;
}

/** Generic scenarios from Pollin `test-result/test-result-actions.test.ts` (no priming/cryo/US). */
export const PORTED_TEST_RESULT_ACTION_SCENARIOS: PortedTestResultActionScenario[] =
  [
    {
      id: 'pollin-review-success',
      pollinSource:
        'test-result-actions.test.ts — Should test result mark as reviewed',
      action: 'markAsReviewed',
      fromStatus: 'Completed',
      comment: 'Comment for review',
    },
    {
      id: 'pollin-release-success',
      pollinSource:
        'test-result-actions.test.ts — Should mark as released - success',
      action: 'markAsReleased',
      fromStatus: 'Reviewed',
      comment: 'comment for release',
      employeeId: 'emp-1',
      expectReleasedAt: true,
      expectPatientVisibilityNew: true,
      expectEventPublish: true,
    },
  ];

export const PORTED_TEST_RESULT_ACTION_NOT_FOUND_SCENARIOS = [
  {
    id: 'pollin-release-not-found',
    pollinSource:
      'test-result-actions.test.ts — Should throw error result not found (release)',
    action: 'markAsReleased' as const,
    resultId: 'INVALID_ID',
  },
  {
    id: 'pollin-review-not-found',
    pollinSource:
      'test-result-actions.test.ts — Should throw error result not found (review)',
    action: 'markAsReviewed' as const,
    resultId: 'INVALID_ID',
  },
];

export const PORTED_RESULT_STATUS_TRANSITION_SCENARIOS =
  CLINIC_LAB_RESULT_TRANSITION_FIXTURES.filter(
    (fixture) => fixture.allowed,
  ).map((fixture) => ({
    id: fixture.id,
    from: fixture.from as ClinicTestResultStatus,
    to: fixture.to as ClinicTestResultStatus,
  }));

export const PORTED_RESULT_STATUS_REJECT_SCENARIOS =
  CLINIC_LAB_RESULT_TRANSITION_FIXTURES.filter(
    (fixture) => !fixture.allowed,
  ).map((fixture) => ({
    id: fixture.id,
    from: fixture.from as ClinicTestResultStatus,
    to: fixture.to as ClinicTestResultStatus,
  }));
