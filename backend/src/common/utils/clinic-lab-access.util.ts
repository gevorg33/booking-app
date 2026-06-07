import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  canAccessBookingPhi,
  type BookingPhiAccessTarget,
} from './phi-minimum-access.util.js';

export type ClinicLabAccessTier = 'lab_ops' | 'receptionist' | 'provider';

export interface ClinicLabStaffContext {
  userId: string;
  membershipRole: MemberRole | string;
  employeeId: string | null;
}

export const CLINIC_LAB_OPS_ROLES = new Set<string>([
  MemberRole.OWNER,
  MemberRole.ADMIN,
  MemberRole.MANAGER,
]);

/** Owner/admin/manager see all lab ops; staff without employee = front desk; linked employee = provider scope. */
export function resolveClinicLabAccessTier(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
): ClinicLabAccessTier {
  const role = String(ctx.membershipRole).toLowerCase();
  if (CLINIC_LAB_OPS_ROLES.has(role)) return 'lab_ops';
  if (ctx.employeeId) return 'provider';
  return 'receptionist';
}

export function canAccessBookingLabRecords(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
  booking: BookingPhiAccessTarget,
): boolean {
  const tier = resolveClinicLabAccessTier(ctx);
  if (tier === 'lab_ops' || tier === 'receptionist') return true;
  return canAccessBookingPhi(ctx.membershipRole, booking, ctx.employeeId);
}

export function resolveLabQueueEmployeeFilter(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
): string | undefined {
  if (resolveClinicLabAccessTier(ctx) !== 'provider') return undefined;
  return ctx.employeeId ?? undefined;
}

export function canCreateManualLabOrder(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
  booking: BookingPhiAccessTarget,
): boolean {
  return canAccessBookingLabRecords(ctx, booking);
}

export function canPatientViewReleasedResult(
  viewerCustomerId: string,
  result: { customerId: string; status: string },
): boolean {
  return viewerCustomerId === result.customerId && result.status === 'Released';
}
