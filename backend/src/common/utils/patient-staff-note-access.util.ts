import {
  CLINIC_LAB_OPS_ROLES,
  resolveClinicLabAccessTier,
  type ClinicLabStaffContext,
} from './clinic-lab-access.util.js';
import type { CustomerClinicalPhiAccessContext } from './clinic-chart-access.util.js';

export function canReadPatientStaffNotes(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
  access: CustomerClinicalPhiAccessContext,
): boolean {
  const tier = resolveClinicLabAccessTier(ctx);
  if (tier === 'lab_ops') return true;
  if (tier === 'receptionist') return false;
  return access.hasAssignedBooking;
}

export function canWritePatientStaffNotes(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
  access: CustomerClinicalPhiAccessContext,
): boolean {
  if (!canReadPatientStaffNotes(ctx, access)) return false;
  const role = String(ctx.membershipRole).toLowerCase();
  if (CLINIC_LAB_OPS_ROLES.has(role)) return true;
  return !!ctx.employeeId;
}
