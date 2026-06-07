import {
  CLINIC_LAB_ACCESS_BOOKING,
  CLINIC_LAB_ACCESS_SCENARIOS,
  CLINIC_LAB_PATIENT_RESULT_SCENARIOS,
} from './clinic-lab-access.fixtures.js';
import {
  canAccessBookingLabRecords,
  canCreateManualLabOrder,
  canPatientViewReleasedResult,
  resolveClinicLabAccessTier,
  resolveLabQueueEmployeeFilter,
} from './clinic-lab-access.util.js';

describe('clinic-lab-access.util', () => {
  it.each(CLINIC_LAB_ACCESS_SCENARIOS)(
    '$id resolves tier and booking access',
    ({ ctx, tier, canAccessBooking, queueEmployeeFilter }) => {
      expect(resolveClinicLabAccessTier(ctx)).toBe(tier);
      expect(canAccessBookingLabRecords(ctx, CLINIC_LAB_ACCESS_BOOKING)).toBe(
        canAccessBooking,
      );
      expect(canCreateManualLabOrder(ctx, CLINIC_LAB_ACCESS_BOOKING)).toBe(
        canAccessBooking,
      );
      expect(resolveLabQueueEmployeeFilter(ctx)).toBe(queueEmployeeFilter);
    },
  );

  it.each(CLINIC_LAB_PATIENT_RESULT_SCENARIOS)(
    '$id patient released-result gate',
    ({ viewerCustomerId, result, allowed }) => {
      expect(canPatientViewReleasedResult(viewerCustomerId, result)).toBe(
        allowed,
      );
    },
  );
});
