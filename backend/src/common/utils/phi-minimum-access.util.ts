import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import type { BookingPhiCarrier } from './phi-encryption.util.js';

export interface BookingPhiAccessTarget {
  employeeId: string;
  linkedEmployeeIds?: string[] | null;
}

const FULL_PHI_ACCESS_ROLES = new Set<string>([
  MemberRole.OWNER,
  MemberRole.ADMIN,
  MemberRole.MANAGER,
]);

/** HIPAA minimum-necessary: staff/contributor only see PHI on assigned bookings. */
export function canAccessBookingPhi(
  membershipRole: string,
  booking: BookingPhiAccessTarget,
  userEmployeeId: string | null | undefined,
): boolean {
  const role = membershipRole.toLowerCase();
  if (FULL_PHI_ACCESS_ROLES.has(role)) return true;
  if (!userEmployeeId) return false;
  if (booking.employeeId === userEmployeeId) return true;
  return (booking.linkedEmployeeIds ?? []).includes(userEmployeeId);
}

export function maskBookingPhiFields<T extends BookingPhiCarrier>(
  booking: T,
): T {
  const next = { ...booking };
  if (next.notes) next.notes = null;
  if (!next.metadata) return next;

  const metadata = { ...next.metadata };
  delete metadata.referralNotes;
  delete metadata.symptoms;
  if (Array.isArray(metadata.patient_test_results)) {
    metadata.patient_test_results = metadata.patient_test_results.map(
      (entry) => {
        if (!entry || typeof entry !== 'object') return entry;
        const row = { ...(entry as Record<string, unknown>) };
        delete row.notes;
        return row;
      },
    );
  }
  next.metadata = metadata;
  return next;
}
