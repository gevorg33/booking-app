import { describe, expect, it } from 'vitest';
import {
  buildMultiServiceVisitFromBookings,
  groupBookingsForAccount,
} from './group-package-bookings';
import type { PublicCustomerBookingItem } from './public-api';

function booking(
  overrides: Partial<PublicCustomerBookingItem>,
): PublicCustomerBookingItem {
  return {
    id: 'b1',
    startTime: '2026-07-20T09:00:00.000Z',
    endTime: '2026-07-20T10:00:00.000Z',
    status: 'confirmed',
    paymentStatus: 'paid',
    serviceName: 'Massage',
    employeeName: 'Alex',
    employeeId: 'emp-1',
    serviceId: 'svc-1',
    canReview: false,
    canCancel: true,
    canReschedule: true,
    policyMessage: null,
    rescheduleCount: 0,
    maxReschedules: 3,
    ...overrides,
  };
}

describe('groupBookingsForAccount (e2e-bug.34)', () => {
  it.each([
    {
      id: 'e2e-bug.34-groups-same-visit',
      bookings: [
        booking({
          id: 'b1',
          serviceName: 'Neck',
          multiServiceGroupId: 'g1',
          multiServiceSchedulingMode: 'same_visit',
        }),
        booking({
          id: 'b2',
          serviceName: 'Face',
          serviceId: 'svc-2',
          multiServiceGroupId: 'g1',
          multiServiceSchedulingMode: 'same_visit',
          startTime: '2026-07-20T10:00:00.000Z',
        }),
        booking({ id: 'b3', serviceName: 'Solo' }),
      ],
      expectMulti: 1,
      expectStandalone: 1,
      expectPackage: 0,
    },
    {
      id: 'e2e-bug.34-package-still-separate',
      bookings: [
        booking({
          id: 'p1',
          packagePurchaseId: 'pp-1',
          packageName: 'Pkg',
          multiServiceGroupId: 'should-ignore',
        }),
        booking({
          id: 'm1',
          multiServiceGroupId: 'g1',
          multiServiceSchedulingMode: 'same_visit',
        }),
      ],
      expectMulti: 1,
      expectStandalone: 0,
      expectPackage: 1,
    },
  ])('$id', ({ bookings, expectMulti, expectStandalone, expectPackage }) => {
    const grouped = groupBookingsForAccount(bookings);
    expect(grouped.multiServiceGroups).toHaveLength(expectMulti);
    expect(grouped.standalone).toHaveLength(expectStandalone);
    expect(grouped.packageGroups).toHaveLength(expectPackage);
  });

  it('builds same-visit summary with whole-visit actions', () => {
    const visit = buildMultiServiceVisitFromBookings([
      booking({
        id: 'b2',
        serviceName: 'Face',
        multiServiceGroupId: 'g1',
        multiServiceSchedulingMode: 'same_visit',
        startTime: '2026-07-20T10:00:00.000Z',
      }),
      booking({
        id: 'b1',
        serviceName: 'Neck',
        multiServiceGroupId: 'g1',
        multiServiceSchedulingMode: 'same_visit',
      }),
    ]);
    expect(visit.anchorBookingId).toBe('b1');
    expect(visit.label).toBe('Neck + Face');
    expect(visit.canCancelAll).toBe(true);
    expect(visit.canRescheduleAll).toBe(true);
  });

  it('keeps per_service lines as standalone cards', () => {
    const grouped = groupBookingsForAccount([
      booking({
        multiServiceGroupId: 'g1',
        multiServiceSchedulingMode: 'per_service',
      }),
      booking({
        id: 'b2',
        multiServiceGroupId: 'g1',
        multiServiceSchedulingMode: 'per_service',
      }),
    ]);
    expect(grouped.multiServiceGroups).toHaveLength(0);
    expect(grouped.standalone).toHaveLength(2);
  });
});
