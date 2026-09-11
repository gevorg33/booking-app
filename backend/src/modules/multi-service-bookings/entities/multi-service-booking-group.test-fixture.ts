import type { MultiServiceBookingGroup } from './multi-service-booking-group.entity.js';

/** Build a complete `MultiServiceBookingGroup` for tests; specs built it as `{ id }`. */
export function makeMultiServiceBookingGroup(
  partial: Partial<MultiServiceBookingGroup> = {},
): MultiServiceBookingGroup {
  return {
    id: 'group-test',
    business: undefined as unknown as MultiServiceBookingGroup['business'],
    businessId: 'biz-test',
    customer: null,
    customerId: null,
    schedulingMode: 'same_visit',
    totalDurationMinutes: 0,
    totalPrice: 0,
    currency: 'USD',
    blockStartTime: null,
    primaryEmployee: null,
    primaryEmployeeId: null,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
