import {
  CLINIC_LAB_OPS_ROLES,
  type ClinicLabStaffContext,
} from './clinic-lab-access.util.js';

export function canListClinicDiagnosticCodes(
  _ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
): boolean {
  return true;
}

export function canManageClinicDiagnosticCodes(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole'>,
): boolean {
  return CLINIC_LAB_OPS_ROLES.has(String(ctx.membershipRole).toLowerCase());
}
