import type { ClinicLabStaffContext } from './clinic-lab-access.util.js';
import {
  canAuthorEncounterVisitNote,
  isClinicalChartOpsRole,
  isCompletedConsultationBooking,
  isEmployeeAssignedToBooking,
  type EncounterBookingTarget,
} from './patient-encounter-access.util.js';

export function canAuthorClinicAfterVisitSummary(
  ctx: ClinicLabStaffContext,
  booking: EncounterBookingTarget,
): boolean {
  return canAuthorEncounterVisitNote(ctx, booking);
}

export function canReleaseClinicAfterVisitSummary(
  ctx: ClinicLabStaffContext,
  booking: EncounterBookingTarget,
): boolean {
  if (!isCompletedConsultationBooking(booking)) return false;
  if (isClinicalChartOpsRole(String(ctx.membershipRole))) return true;
  if (!ctx.employeeId) return false;
  return isEmployeeAssignedToBooking(booking, ctx.employeeId);
}

export function canExportClinicAfterVisitSummaryPdf(
  ctx: ClinicLabStaffContext,
  booking: EncounterBookingTarget,
): boolean {
  if (!isCompletedConsultationBooking(booking)) return false;
  if (isClinicalChartOpsRole(String(ctx.membershipRole))) return true;
  if (!ctx.employeeId) return true;
  return isEmployeeAssignedToBooking(booking, ctx.employeeId);
}
