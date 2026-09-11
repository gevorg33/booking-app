import type { ClinicPatientAlertDismissal } from './clinic-patient-alert-dismissal.entity.js';

/**
 * Build a complete `ClinicPatientAlertDismissal` for tests.
 *
 * Specs build it as `{ alertType, sourceId }` — the two fields the filter reads
 * — omitting `businessId`, `customerId` and `dismissedAt`, which are what make a
 * dismissal *someone's*, at a time. A two-field literal cannot exercise a
 * per-customer or per-business scoping decision.
 */
export function makeClinicPatientAlertDismissal(
  partial: Partial<ClinicPatientAlertDismissal> = {},
): ClinicPatientAlertDismissal {
  return {
    id: 'dismissal-test',
    business: undefined as unknown as ClinicPatientAlertDismissal['business'],
    businessId: 'biz-test',
    customer: undefined as unknown as ClinicPatientAlertDismissal['customer'],
    customerId: 'cust-test',
    alertType: 'TestResultReleased',
    sourceId: 'source-test',
    dismissedByEmployee: null,
    dismissedByEmployeeId: null,
    dismissedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
