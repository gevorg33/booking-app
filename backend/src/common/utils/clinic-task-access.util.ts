import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  CLINIC_LAB_OPS_ROLES,
  resolveClinicLabAccessTier,
  type ClinicLabStaffContext,
} from './clinic-lab-access.util.js';
import type { ClinicTaskStatus } from './clinic-task.types.js';
import { isClinicTaskOpen } from './clinic-task.util.js';

export function canListClinicTasks(
  _ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
): boolean {
  return true;
}

export function canCreateClinicTask(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
): boolean {
  const tier = resolveClinicLabAccessTier(ctx);
  return tier === 'lab_ops' || tier === 'receptionist';
}

export function canManageClinicTasks(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole'>,
): boolean {
  return CLINIC_LAB_OPS_ROLES.has(String(ctx.membershipRole).toLowerCase());
}

export function canAssignClinicTask(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole'>,
): boolean {
  return canManageClinicTasks(ctx);
}

export function canCompleteClinicTask(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
  task: { assigneeEmployeeId?: string | null; status: ClinicTaskStatus },
): boolean {
  if (!isClinicTaskOpen(task.status)) return false;
  if (canManageClinicTasks(ctx)) return true;
  return ctx.employeeId != null && task.assigneeEmployeeId === ctx.employeeId;
}

export function canClaimClinicTask(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
  task: { assigneeEmployeeId?: string | null; status: ClinicTaskStatus },
): boolean {
  if (!isClinicTaskOpen(task.status)) return false;
  if (task.assigneeEmployeeId != null) return false;
  if (!ctx.employeeId) return false;
  if (canManageClinicTasks(ctx)) return true;
  return resolveClinicLabAccessTier(ctx) === 'provider';
}

export function canCancelClinicTask(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole'>,
  task: { status: ClinicTaskStatus },
): boolean {
  if (!isClinicTaskOpen(task.status)) return false;
  return canManageClinicTasks(ctx);
}

export function resolveClinicTaskAssigneeFilter(
  ctx: Pick<ClinicLabStaffContext, 'membershipRole' | 'employeeId'>,
): string | undefined {
  const tier = resolveClinicLabAccessTier(ctx);
  if (tier !== 'provider') return undefined;
  return ctx.employeeId ?? undefined;
}

export function isClinicTaskStaffRole(role: MemberRole | string): boolean {
  const normalized = String(role).toLowerCase();
  return (
    CLINIC_LAB_OPS_ROLES.has(normalized) || normalized === MemberRole.STAFF
  );
}
