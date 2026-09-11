import type { Booking } from './booking.entity.js';
import { BookingStatus, PaymentStatus } from './booking.entity.js';

/**
 * Build a complete `Booking` for tests.
 *
 * An earlier attempt at this builder was reverted because it made the project
 * *worse* — but that was before `*LogicDeps` stopped demanding TypeORM's
 * untestable `find`/`save` overloads. While those were the reported error the
 * booking literals underneath were merely masked, so wrapping them moved the
 * complaint around instead of resolving it. With the deps narrowed, the
 * incompleteness is the actual error and the builder resolves it.
 *
 * Defaults are inert: a confirmed, unpaid, un-hidden booking with no notes,
 * no linked employees and no package or multi-service grouping. The four
 * relations are left unpopulated the way a query without `relations` returns
 * them; callers that assert on `customer.name` pass their own.
 */
export function makeBooking(partial: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-test',
    business: undefined as unknown as Booking['business'],
    businessId: 'biz-test',
    locationId: '',
    employee: undefined as unknown as Booking['employee'],
    employeeId: 'emp-test',
    service: undefined as unknown as Booking['service'],
    serviceId: 'svc-test',
    customer: undefined as unknown as Booking['customer'],
    customerId: 'cust-test',
    slotId: '',
    startTime: new Date('2026-01-01T09:00:00.000Z'),
    endTime: new Date('2026-01-01T10:00:00.000Z'),
    status: BookingStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PENDING,
    notes: '',
    description: '',
    cancellationReason: '',
    linkedEmployeeIds: [],
    virtualMeetingUrl: '',
    metadata: {},
    checkedInAt: null,
    hiddenFromCalendar: false,
    packagePurchaseId: null,
    multiServiceGroupId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
