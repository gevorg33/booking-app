import type { ClinicTestResult } from './clinic-test-result.entity.js';

/**
 * Build a complete `ClinicTestResult` for tests.
 *
 * The entity has 31 properties and specs build it as `{ id: 'result-1' }`, which
 * only became visible once `*LogicDeps` stopped demanding TypeORM's untestable
 * `findOne`/`save` overloads — while those were the reported error, the
 * incomplete literal underneath could not be seen.
 *
 * Defaults are inert: a pending, unlinked, single-test-type result with no
 * measurements, comments or review timestamps. Callers override exactly the
 * fields their assertion is about. The two required relations are left
 * unpopulated the way a query without `relations` returns them.
 */
export function makeClinicTestResult(
  partial: Partial<ClinicTestResult> = {},
): ClinicTestResult {
  return {
    id: 'result-test',
    business: undefined as unknown as ClinicTestResult['business'],
    businessId: 'biz-test',
    customer: undefined as unknown as ClinicTestResult['customer'],
    customerId: 'cust-test',
    order: null,
    orderId: null,
    booking: null,
    bookingId: null,
    specimen: null,
    specimenId: null,
    status: 'Pending',
    resultKind: 'test_type',
    testType: null,
    testTypeId: null,
    testPanel: null,
    testPanelId: null,
    measurementFlag: null,
    patientVisibility: null,
    comment: null,
    reviewComment: null,
    releaseComment: null,
    completedByEmployee: null,
    completedByEmployeeId: null,
    completedAt: null,
    reviewedAt: null,
    releasedAt: null,
    measurements: [],
    statusHistory: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
