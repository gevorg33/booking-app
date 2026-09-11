import type { PublicCustomerBookingItem } from './public-customer-auth.types.js';

/**
 * Build a complete `PublicCustomerBookingItem` for tests.
 *
 * 21 fields, of which specs supply seven. The omitted ones are not decoration:
 * `canCancel` / `canReschedule` / `policyMessage` / `rescheduleCount` /
 * `maxReschedules` are the self-service policy answers this item exists to
 * carry, so a fixture without them cannot exercise a policy decision at all.
 *
 * Defaults are inert: a completed, paid booking that permits nothing and has no
 * package or multi-service grouping. Callers override what their assertion is
 * about.
 */
export function makePublicCustomerBookingItem(
  partial: Partial<PublicCustomerBookingItem> = {},
): PublicCustomerBookingItem {
  return {
    id: 'booking-test',
    startTime: '2026-01-01T09:00:00.000Z',
    endTime: '2026-01-01T10:00:00.000Z',
    status: 'completed',
    paymentStatus: 'paid',
    serviceName: 'Test service',
    employeeName: 'Test employee',
    employeeId: 'emp-test',
    serviceId: 'svc-test',
    canReview: false,
    canCancel: false,
    canReschedule: false,
    policyMessage: null,
    rescheduleCount: 0,
    maxReschedules: 0,
    allowProviderChangeOnReschedule: false,
    packagePurchaseId: null,
    packageId: null,
    packageName: null,
    multiServiceGroupId: null,
    multiServiceSchedulingMode: null,
    ...partial,
  };
}
