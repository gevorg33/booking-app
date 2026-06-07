import {
  CLINIC_LAB_OPS_ROLES,
  type ClinicLabStaffContext,
} from './clinic-lab-access.util.js';

export interface CustomerClinicalPhiAccessContext {
  hasAssignedBooking: boolean;
}

export function canAccessCustomerClinicalChart(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
  access: CustomerClinicalPhiAccessContext,
): boolean {
  const role = String(ctx.membershipRole).toLowerCase();
  if (CLINIC_LAB_OPS_ROLES.has(role)) return true;
  if (!ctx.employeeId) return true;
  return access.hasAssignedBooking;
}

export function canAccessCustomerClinicalPhi(
  membershipRole: string,
  access: CustomerClinicalPhiAccessContext,
  userEmployeeId: string | null | undefined,
): boolean {
  return canAccessCustomerClinicalChart(
    { membershipRole, employeeId: userEmployeeId ?? null },
    access,
  );
}

export function isProviderScopedClinicalChartRole(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
): boolean {
  const role = String(ctx.membershipRole).toLowerCase();
  return !CLINIC_LAB_OPS_ROLES.has(role) && !!ctx.employeeId;
}
