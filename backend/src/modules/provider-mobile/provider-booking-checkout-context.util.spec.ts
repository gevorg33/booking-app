import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  buildProviderBookingCheckoutContextView,
  buildProviderMultiServiceBadge,
  buildProviderPackageBadge,
  buildProviderSubscriptionBadge,
  readSubscriptionIdFromBookingMetadata,
} from './provider-booking-checkout-context.util.js';

describe('provider-booking-checkout-context.util (prov-exp-1.4)', () => {
  const baseBooking = {
    id: 'bk-1',
    businessId: 'biz-1',
    packagePurchaseId: 'purchase-1',
    multiServiceGroupId: null,
    metadata: { packageId: 'pkg-1', packageName: 'Glow package' },
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2026-06-01T10:00:00.000Z'),
    endTime: new Date('2026-06-01T11:00:00.000Z'),
    service: { name: 'Facial' },
    employee: { name: 'Sam' },
  } as const;

  it('builds a package badge with line index and remaining services', () => {
    const siblings = [
      { ...baseBooking, id: 'bk-1', status: BookingStatus.CONFIRMED },
      {
        ...baseBooking,
        id: 'bk-2',
        status: BookingStatus.COMPLETED,
        startTime: new Date('2026-06-01T11:00:00.000Z'),
      },
      {
        ...baseBooking,
        id: 'bk-3',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-01T12:00:00.000Z'),
      },
    ] as never[];

    expect(buildProviderPackageBadge(baseBooking as never, siblings)).toEqual({
      packagePurchaseId: 'purchase-1',
      packageId: 'pkg-1',
      packageName: 'Glow package',
      serviceIndex: 1,
      serviceTotal: 3,
      visitsRemaining: 2,
    });
  });

  it('builds subscription and multi-service badges', () => {
    expect(
      buildProviderSubscriptionBadge({
        id: 'sub-1',
        status: 'active',
        appointmentsRemaining: 4,
        appointmentsIncluded: 6,
        plan: { name: 'Monthly glow' },
      } as never),
    ).toMatchObject({
      planName: 'Monthly glow',
      appointmentsRemaining: 4,
      isActive: true,
    });

    const multi = buildProviderMultiServiceBadge(
      {
        id: 'group-1',
        schedulingMode: 'same_visit',
        totalDurationMinutes: 90,
        totalPrice: 120,
        currency: 'USD',
      } as never,
      [
        {
          id: 'bk-1',
          startTime: new Date('2026-06-01T10:00:00.000Z'),
          endTime: new Date('2026-06-01T10:45:00.000Z'),
          status: BookingStatus.CONFIRMED,
          service: { name: 'Cut' },
          employee: { name: 'Alex' },
        },
        {
          id: 'bk-2',
          startTime: new Date('2026-06-01T10:50:00.000Z'),
          endTime: new Date('2026-06-01T11:30:00.000Z'),
          status: BookingStatus.CONFIRMED,
          service: { name: 'Color' },
          employee: { name: 'Alex' },
        },
      ] as never[],
      'bk-2',
    );

    expect(multi.serviceCount).toBe(2);
    expect(multi.lines[1]?.isCurrent).toBe(true);
  });

  it('reads subscription id from booking metadata', () => {
    expect(
      readSubscriptionIdFromBookingMetadata({ subscriptionId: 'sub-1' }),
    ).toBe('sub-1');
    expect(buildProviderBookingCheckoutContextView({
      package: null,
      subscription: null,
      multiService: null,
    })).toEqual({ package: null, subscription: null, multiService: null });
  });
});
