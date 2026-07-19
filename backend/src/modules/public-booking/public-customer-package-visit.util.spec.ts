import { BookingStatus } from '../booking/entities/booking.entity.js';
import * as customerSelfService from '../../common/utils/customer-self-service.util.js';
import {
  evaluatePackageVisitPolicy,
  isPackageVisitBooking,
  readMultiServiceSchedulingMode,
  readPackageIdFromMetadata,
  readPackageNameFromMetadata,
  sortPackageVisitBookings,
  toPackageLineInputs,
  toPackageServiceLines,
  PACKAGE_VISIT_ACTIVE_STATUSES,
} from './public-customer-package-visit.util.js';

describe('public-customer-package-visit.util', () => {
  const settings = {
    allowCancel: true,
    allowReschedule: true,
    minimumNoticeHours: 24,
    maxReschedulesPerBooking: 2,
    allowProviderChangeOnReschedule: false,
  };

  const future = new Date(Date.now() + 72 * 60 * 60 * 1000);

  it('reads package metadata helpers', () => {
    expect(readPackageIdFromMetadata({ packageId: ' pkg-1 ' })).toBe('pkg-1');
    expect(readPackageIdFromMetadata({})).toBeNull();
    expect(readPackageNameFromMetadata({ packageName: 'Glow' })).toBe('Glow');
    expect(readPackageNameFromMetadata(null)).toBeNull();
    expect(isPackageVisitBooking({ packagePurchaseId: 'p1' } as any)).toBe(
      true,
    );
    expect(isPackageVisitBooking({ packagePurchaseId: null } as any)).toBe(
      false,
    );
  });

  it('reads multi-service scheduling mode from metadata (e2e-bug.34)', () => {
    expect(readMultiServiceSchedulingMode({ schedulingMode: 'same_visit' })).toBe(
      'same_visit',
    );
    expect(
      readMultiServiceSchedulingMode({ schedulingMode: 'per_service' }),
    ).toBe('per_service');
    expect(readMultiServiceSchedulingMode({ schedulingMode: 'other' })).toBeNull();
    expect(readMultiServiceSchedulingMode(null)).toBeNull();
  });

  it('sorts visit bookings by start time', () => {
    const later = { startTime: new Date(future.getTime() + 3600000) } as any;
    const earlier = { startTime: future } as any;
    expect(sortPackageVisitBookings([later, earlier])[0]).toBe(earlier);
  });

  it('evaluates inactive visit', () => {
    const policy = evaluatePackageVisitPolicy(
      [
        {
          status: BookingStatus.CANCELLED,
          startTime: future,
          metadata: {},
        } as any,
      ],
      settings,
    );
    expect(policy).toEqual({
      canCancelAll: false,
      canRescheduleAll: false,
      policyMessage: 'This package visit is no longer active',
    });
  });

  it('evaluates package visit policy across all appointments', () => {
    const bookings = [
      {
        status: BookingStatus.CONFIRMED,
        startTime: future,
        metadata: { customerRescheduleCount: 0 },
        serviceId: 's1',
        service: { durationMinutes: 30, bufferMinutes: 0 },
      },
      {
        status: BookingStatus.CONFIRMED,
        startTime: new Date(future.getTime() + 40 * 60 * 1000),
        metadata: { customerRescheduleCount: 2 },
        serviceId: 's2',
        service: { durationMinutes: 20, bufferMinutes: 0 },
      },
    ] as any[];

    const policy = evaluatePackageVisitPolicy(bookings, settings);
    expect(policy.canCancelAll).toBe(true);
    expect(policy.canRescheduleAll).toBe(false);
    expect(policy.policyMessage).toContain('maximum');
  });

  it('blocks cancel or reschedule when individual policy fails', () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const cancelBlocked = evaluatePackageVisitPolicy(
      [
        {
          status: BookingStatus.CONFIRMED,
          startTime: soon,
          metadata: {},
        } as any,
      ],
      settings,
    );
    expect(cancelBlocked.canCancelAll).toBe(false);
    expect(cancelBlocked.policyMessage).toContain('24 hours');

    const rescheduleDisabled = evaluatePackageVisitPolicy(
      [
        {
          status: BookingStatus.CONFIRMED,
          startTime: future,
          metadata: {},
        } as any,
      ],
      { ...settings, allowReschedule: false },
    );
    expect(rescheduleDisabled.canRescheduleAll).toBe(false);
    expect(rescheduleDisabled.policyMessage).toContain('rescheduling');
  });

  it('keeps the first policy message when multiple appointments fail', () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const policy = evaluatePackageVisitPolicy(
      [
        {
          status: BookingStatus.CONFIRMED,
          startTime: soon,
          metadata: {},
        } as any,
        {
          status: BookingStatus.CONFIRMED,
          startTime: soon,
          metadata: {},
        } as any,
      ],
      settings,
    );
    expect(policy.canCancelAll).toBe(false);
    expect(policy.policyMessage).toContain('24 hours');
  });

  it('does not overwrite an earlier policy message on later failures', () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const policy = evaluatePackageVisitPolicy(
      [
        {
          status: BookingStatus.CONFIRMED,
          startTime: soon,
          metadata: {},
        } as any,
        {
          status: BookingStatus.CONFIRMED,
          startTime: future,
          metadata: { customerRescheduleCount: 2 },
        } as any,
      ],
      settings,
    );
    expect(policy.canRescheduleAll).toBe(false);
    expect(policy.policyMessage).toContain('24 hours');
  });

  it('uses default service durations when relation is missing', () => {
    expect(
      toPackageServiceLines([
        { serviceId: 's1', startTime: future, service: {} } as any,
      ]),
    ).toEqual([{ serviceId: 's1', durationMinutes: 30, bufferMinutes: 0 }]);
  });

  it('maps reschedule lines to package line inputs in visit order', () => {
    const bookings = [
      {
        id: 'b1',
        serviceId: 's1',
        employeeId: 'e1',
        startTime: future,
        service: { durationMinutes: 30, bufferMinutes: 0 },
      },
      {
        id: 'b2',
        serviceId: 's2',
        employeeId: 'e1',
        startTime: new Date(future.getTime() + 35 * 60 * 1000),
        service: { durationMinutes: 20, bufferMinutes: 0 },
      },
    ] as any[];

    const lines = toPackageLineInputs(bookings, [
      {
        bookingId: 'b2',
        startTime: new Date(future.getTime() + 86400000).toISOString(),
      },
      { bookingId: 'b1', startTime: future.toISOString() },
    ]);

    expect(lines).toHaveLength(2);
    expect(lines[0].serviceId).toBe('s1');
    expect(lines[1].serviceId).toBe('s2');
    expect(toPackageServiceLines(bookings)).toEqual([
      { serviceId: 's1', durationMinutes: 30, bufferMinutes: 0 },
      { serviceId: 's2', durationMinutes: 20, bufferMinutes: 0 },
    ]);
  });

  it('throws when a package line is missing for an appointment', () => {
    expect(() =>
      toPackageLineInputs(
        [
          {
            id: 'b1',
            serviceId: 's1',
            employeeId: 'e1',
            startTime: future,
          } as any,
        ],
        [],
      ),
    ).toThrow('Each package appointment must have a new time');
  });

  it('applies max reschedule limit message on a single appointment', () => {
    const policy = evaluatePackageVisitPolicy(
      [
        {
          status: BookingStatus.CONFIRMED,
          startTime: future,
          metadata: { customerRescheduleCount: 2 },
        } as any,
      ],
      settings,
    );
    expect(policy.canRescheduleAll).toBe(false);
    expect(policy.policyMessage).toContain('maximum of 2');
  });

  it('exports active statuses for confirmed and pending', () => {
    expect(PACKAGE_VISIT_ACTIVE_STATUSES).toContain(BookingStatus.CONFIRMED);
    expect(PACKAGE_VISIT_ACTIVE_STATUSES).toContain(BookingStatus.PENDING);
  });

  it('leaves policy message null when a failed policy has no reason text', () => {
    const policySpy = jest
      .spyOn(customerSelfService, 'evaluateCustomerBookingPolicy')
      .mockReturnValue({ allowed: false });

    const policy = evaluatePackageVisitPolicy(
      [
        {
          status: BookingStatus.CONFIRMED,
          startTime: future,
          metadata: {},
        } as any,
      ],
      settings,
    );
    expect(policy.canCancelAll).toBe(false);
    expect(policy.policyMessage).toBeNull();

    policySpy.mockRestore();
  });
});
