/** prov-exp-9.1 — customer snapshot badge scenarios (referral, first visit, win-back). */

import type { ResolveProviderCustomerSnapshotBadgesInput } from './provider-booking-customer-badges.util.js';

export interface ProviderCustomerSnapshotBadgeScenario {
  id: string;
  input: ResolveProviderCustomerSnapshotBadgesInput;
  expectedBadgeIds: Array<'first_visit' | 'referred_by' | 'win_back'>;
}

const REFERRAL = {
  referredByCustomerId: 'cust-ref',
  referredByCustomerName: 'Alice Friend',
  referralCodeUsed: 'FRIEND10' as string | null,
};

export const PROVIDER_CUSTOMER_SNAPSHOT_BADGE_SCENARIOS: ProviderCustomerSnapshotBadgeScenario[] =
  [
    {
      id: 'first-visit-no-referral',
      input: {
        completedVisitCount: 0,
        lastCompletedVisitAt: null,
        referral: null,
        inactiveDaysThreshold: 90,
        referenceDate: new Date('2026-06-09T12:00:00.000Z'),
      },
      expectedBadgeIds: ['first_visit'],
    },
    {
      id: 'first-visit-with-referral',
      input: {
        completedVisitCount: 0,
        lastCompletedVisitAt: null,
        referral: REFERRAL,
        inactiveDaysThreshold: 90,
        referenceDate: new Date('2026-06-09T12:00:00.000Z'),
      },
      expectedBadgeIds: ['first_visit', 'referred_by'],
    },
    {
      id: 'returning-regular-no-badges',
      input: {
        completedVisitCount: 5,
        lastCompletedVisitAt: new Date('2026-05-01T10:00:00.000Z'),
        referral: null,
        inactiveDaysThreshold: 90,
        referenceDate: new Date('2026-06-09T12:00:00.000Z'),
      },
      expectedBadgeIds: [],
    },
    {
      id: 'win-back-lapsed-return',
      input: {
        completedVisitCount: 3,
        lastCompletedVisitAt: new Date('2025-12-01T10:00:00.000Z'),
        referral: null,
        inactiveDaysThreshold: 90,
        referenceDate: new Date('2026-06-09T12:00:00.000Z'),
      },
      expectedBadgeIds: ['win_back'],
    },
    {
      id: 'win-back-with-referral',
      input: {
        completedVisitCount: 2,
        lastCompletedVisitAt: new Date('2025-11-15T09:00:00.000Z'),
        referral: REFERRAL,
        inactiveDaysThreshold: 60,
        referenceDate: new Date('2026-06-09T12:00:00.000Z'),
      },
      expectedBadgeIds: ['win_back', 'referred_by'],
    },
    {
      id: 'just-under-win-back-threshold',
      input: {
        completedVisitCount: 2,
        lastCompletedVisitAt: new Date('2026-03-15T12:00:00.000Z'),
        referral: null,
        inactiveDaysThreshold: 90,
        referenceDate: new Date('2026-06-09T12:00:00.000Z'),
      },
      expectedBadgeIds: [],
    },
    {
      id: 'win-back-custom-threshold',
      input: {
        completedVisitCount: 1,
        lastCompletedVisitAt: new Date('2026-04-01T10:00:00.000Z'),
        referral: null,
        inactiveDaysThreshold: 30,
        referenceDate: new Date('2026-06-09T12:00:00.000Z'),
      },
      expectedBadgeIds: ['win_back'],
    },
    {
      id: 'prior-visits-but-no-last-visit-date',
      input: {
        completedVisitCount: 2,
        lastCompletedVisitAt: null,
        referral: null,
        inactiveDaysThreshold: 90,
        referenceDate: new Date('2026-06-09T12:00:00.000Z'),
      },
      expectedBadgeIds: [],
    },
  ];
