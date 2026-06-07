import {
  CLINIC_LAB_OPS_ROLES,
  type ClinicLabStaffContext,
} from './clinic-lab-access.util.js';

export function canListClinicLabRegistry(
  _ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
): boolean {
  return true;
}

export function canManageClinicLabRegistry(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole'>,
): boolean {
  return CLINIC_LAB_OPS_ROLES.has(String(ctx.membershipRole).toLowerCase());
}

export function canAssignClinicLabMachine(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole'>,
): boolean {
  return canManageClinicLabRegistry(ctx);
}

export function canIngestClinicLabSyncObservations(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole'>,
): boolean {
  return canManageClinicLabRegistry(ctx);
}

export function canLinkClinicLabSyncObservations(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole'>,
): boolean {
  return canManageClinicLabRegistry(ctx);
}
