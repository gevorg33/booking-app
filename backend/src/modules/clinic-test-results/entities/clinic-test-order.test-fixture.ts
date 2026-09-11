import type { ClinicSpecimen } from './clinic-specimen.entity.js';
import type { ClinicTestOrder } from './clinic-test-order.entity.js';

/**
 * Build a complete `ClinicTestOrder` for tests.
 *
 * 27 properties; specs build it as `{ id, businessId, bookingId }`. Reachable
 * only after `ClinicTestResultExtLogicDeps` stopped demanding TypeORM's
 * untestable `findOne`/`find` overloads — while those were the reported error,
 * the incomplete literals underneath were invisible.
 *
 * Defaults are inert: an uncollected order with no booking, no employee, no
 * items and no specimens. The two required relations are left unpopulated the
 * way a query without `relations` returns them.
 */
export function makeClinicTestOrder(
  partial: Partial<ClinicTestOrder> = {},
): ClinicTestOrder {
  return {
    id: 'order-test',
    business: undefined as unknown as ClinicTestOrder['business'],
    businessId: 'biz-test',
    customer: undefined as unknown as ClinicTestOrder['customer'],
    customerId: 'cust-test',
    booking: null,
    bookingId: null,
    collectionBooking: null,
    collectionBookingId: null,
    collectionServiceId: null,
    bookingRequestToken: null,
    bookingRequestPushedAt: null,
    bookingRequestPushedBy: null,
    bookingRequestPushedByEmployeeId: null,
    employee: null,
    employeeId: null,
    status: 'NotCollected',
    comment: null,
    customCancellationReason: null,
    cancelledAt: null,
    displayNames: null,
    items: [],
    statusHistory: [],
    specimens: [],
    results: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}

/**
 * Build a complete `ClinicSpecimen` for tests.
 *
 * Lives beside `makeClinicTestOrder` because a specimen always belongs to an
 * order; 27 properties, and specs build it as `{ id, status, orderId }`.
 *
 * Defaults are inert: an uncollected specimen with no booking, no storage
 * location and no transport folder.
 */
export function makeClinicSpecimen(
  partial: Partial<ClinicSpecimen> = {},
): ClinicSpecimen {
  return {
    id: 'specimen-test',
    business: undefined as unknown as ClinicSpecimen['business'],
    businessId: 'biz-test',
    customer: undefined as unknown as ClinicSpecimen['customer'],
    customerId: 'cust-test',
    order: undefined as unknown as ClinicSpecimen['order'],
    orderId: 'order-test',
    booking: null,
    bookingId: null,
    specimenIdentifier: null,
    status: 'NotCollected',
    collectedAt: null,
    receivedInLabAt: null,
    rejectedAt: null,
    incompletionReason: null,
    collectedByEmployee: null,
    collectedByEmployeeId: null,
    storageLocation: null,
    storageLocationId: null,
    storedAt: null,
    transportFolder: null,
    transportFolderId: null,
    labMachineId: null,
    results: [],
    statusHistory: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
