import { BookingStatus } from '../../modules/booking/entities/booking.entity.js';
import {
  extractClinicMetadata,
  type ClinicServiceMetadata,
} from './clinic-service.util.js';
import type { ClinicLabStaffContext } from './clinic-lab-access.util.js';

export interface EncounterBookingTarget {
  status: string;
  employeeId: string;
  linkedEmployeeIds?: string[] | null;
  serviceMetadata?: Record<string, unknown> | null;
}

export function readConsultationMetadata(
  serviceMetadata: Record<string, unknown> | null | undefined,
): ClinicServiceMetadata | null {
  const clinic = extractClinicMetadata(serviceMetadata);
  return clinic?.serviceType === 'consultation' ? clinic : null;
}

export function isCompletedConsultationBooking(
  booking: EncounterBookingTarget,
): boolean {
  if (booking.status !== BookingStatus.COMPLETED) return false;
  return readConsultationMetadata(booking.serviceMetadata) !== null;
}

export function isEmployeeAssignedToBooking(
  booking: Pick<EncounterBookingTarget, 'employeeId' | 'linkedEmployeeIds'>,
  employeeId: string | null | undefined,
): boolean {
  if (!employeeId) return false;
  if (booking.employeeId === employeeId) return true;
  return (booking.linkedEmployeeIds ?? []).includes(employeeId);
}

export function isClinicalChartOpsRole(membershipRole: string): boolean {
  const role = String(membershipRole).toLowerCase();
  return ['owner', 'admin', 'manager'].includes(role);
}

export function canAuthorEncounterVisitNote(
  ctx: ClinicLabStaffContext,
  booking: EncounterBookingTarget,
): boolean {
  if (!isCompletedConsultationBooking(booking)) return false;
  if (isClinicalChartOpsRole(String(ctx.membershipRole))) return true;
  if (!ctx.employeeId) return false;
  return isEmployeeAssignedToBooking(booking, ctx.employeeId);
}

export function canAppendEncounterAddendum(
  ctx: ClinicLabStaffContext,
  booking: EncounterBookingTarget,
): boolean {
  if (!isCompletedConsultationBooking(booking)) return false;
  if (!ctx.employeeId) return false;
  if (isClinicalChartOpsRole(String(ctx.membershipRole))) return true;
  return isEmployeeAssignedToBooking(booking, ctx.employeeId);
}
