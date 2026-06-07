import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import { BookingStatus } from '../../modules/booking/entities/booking.entity.js';
import {
  canAuthorClinicAfterVisitSummary,
  canExportClinicAfterVisitSummaryPdf,
  canReleaseClinicAfterVisitSummary,
} from './clinic-after-visit-summary-access.util.js';
import { CLINIC_AFTER_VISIT_SUMMARY_ACCESS_SCENARIOS } from '../../modules/patient-clinical-profiles/clinic-after-visit-summaries.fixtures.js';

describe('clinic-after-visit-summary-access.util', () => {
  const bookingTarget = {
    status: BookingStatus.COMPLETED,
    employeeId: 'emp-provider',
    linkedEmployeeIds: [] as string[],
    serviceMetadata: { serviceType: 'consultation' },
  };

  it.each(CLINIC_AFTER_VISIT_SUMMARY_ACCESS_SCENARIOS)(
    '$id author access',
    ({ role, employeeId, canAuthor }) => {
      expect(
        canAuthorClinicAfterVisitSummary(
          { userId: 'user-1', membershipRole: role, employeeId },
          bookingTarget,
        ),
      ).toBe(canAuthor);
    },
  );

  it('blocks non-consultation bookings', () => {
    expect(
      canAuthorClinicAfterVisitSummary(
        {
          userId: 'user-1',
          membershipRole: MemberRole.MANAGER,
          employeeId: 'emp-manager',
        },
        {
          ...bookingTarget,
          serviceMetadata: { serviceType: 'lab_test' },
        },
      ),
    ).toBe(false);
  });

  it('allows managers to release and export', () => {
    const ctx = {
      userId: 'user-1',
      membershipRole: MemberRole.MANAGER,
      employeeId: 'emp-manager',
    };
    expect(canReleaseClinicAfterVisitSummary(ctx, bookingTarget)).toBe(true);
    expect(canExportClinicAfterVisitSummaryPdf(ctx, bookingTarget)).toBe(true);
  });

  it('allows assigned provider to release but not unassigned staff', () => {
    const assigned = {
      userId: 'user-1',
      membershipRole: MemberRole.STAFF,
      employeeId: 'emp-provider',
    };
    const unassigned = {
      userId: 'user-2',
      membershipRole: MemberRole.STAFF,
      employeeId: 'emp-other',
    };
    expect(canReleaseClinicAfterVisitSummary(assigned, bookingTarget)).toBe(
      true,
    );
    expect(canReleaseClinicAfterVisitSummary(unassigned, bookingTarget)).toBe(
      false,
    );
    expect(canExportClinicAfterVisitSummaryPdf(unassigned, bookingTarget)).toBe(
      false,
    );
  });

  it('allows staff without employee profile to export when chart access exists', () => {
    expect(
      canExportClinicAfterVisitSummaryPdf(
        {
          userId: 'user-1',
          membershipRole: MemberRole.STAFF,
          employeeId: null,
        },
        bookingTarget,
      ),
    ).toBe(true);
  });

  it('blocks release for incomplete bookings and staff without employee profile', () => {
    expect(
      canReleaseClinicAfterVisitSummary(
        {
          userId: 'user-1',
          membershipRole: MemberRole.STAFF,
          employeeId: null,
        },
        bookingTarget,
      ),
    ).toBe(false);
    expect(
      canReleaseClinicAfterVisitSummary(
        {
          userId: 'user-1',
          membershipRole: MemberRole.STAFF,
          employeeId: 'emp-provider',
        },
        {
          ...bookingTarget,
          status: BookingStatus.CONFIRMED,
        },
      ),
    ).toBe(false);
  });
});
