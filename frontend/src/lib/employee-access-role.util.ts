import type { TeamMemberRole } from '@/components/employees/team-members-card';
import type { EmployeeRecord } from '@/lib/employee-types';

export interface EmployeeAccessRoleConfig {
  initialRole: TeamMemberRole;
  editable: boolean;
}

export interface LinkedTeamMember {
  userId: string;
  role: TeamMemberRole;
}

export interface AccessRoleContext {
  isOwner: boolean;
  currentUserId?: string;
  linkedMember?: LinkedTeamMember | null;
  pendingAppAccessRoles?: Record<string, TeamMemberRole>;
}

export function getEmployeeAccessRoleConfig(
  emp: Pick<EmployeeRecord, 'id' | 'userId' | 'email'>,
  ctx: AccessRoleContext,
): EmployeeAccessRoleConfig | null {
  const linkedMember = ctx.linkedMember;
  const isSelf = linkedMember?.userId === ctx.currentUserId;
  const canEditAccessRole =
    ctx.isOwner &&
    !!emp.userId &&
    !!linkedMember &&
    linkedMember.role !== 'owner' &&
    !isSelf;
  const canSetPendingAccessRole = ctx.isOwner && !emp.userId && !!emp.email;

  if (canEditAccessRole && linkedMember) {
    return { initialRole: linkedMember.role, editable: true };
  }
  if (linkedMember && (linkedMember.role === 'owner' || isSelf)) {
    return { initialRole: linkedMember.role, editable: false };
  }
  if (canSetPendingAccessRole) {
    return {
      initialRole: ctx.pendingAppAccessRoles?.[emp.id] ?? 'contributor',
      editable: true,
    };
  }
  return null;
}

export function getDisplayAccessRole(
  emp: Pick<EmployeeRecord, 'id' | 'email'>,
  linkedMemberRole?: TeamMemberRole | null,
  pendingAppAccessRoles?: Record<string, TeamMemberRole>,
): TeamMemberRole | null {
  if (linkedMemberRole) return linkedMemberRole;
  if (emp.email) return pendingAppAccessRoles?.[emp.id] ?? 'contributor';
  return null;
}

export interface SaveAccessRoleParams {
  accessRole?: TeamMemberRole;
  accessRoleConfig: EmployeeAccessRoleConfig | null;
  employee: Pick<EmployeeRecord, 'userId' | 'email'>;
  linkedMemberRole?: TeamMemberRole;
}

export interface ResolvedSaveAccessRole {
  accessRole?: TeamMemberRole;
  previousAccessRole?: TeamMemberRole;
  savePendingAccessRole: boolean;
  shouldPatchAccessRole: boolean;
}

export function resolveSaveAccessRole(
  params: SaveAccessRoleParams,
): ResolvedSaveAccessRole {
  const canEditAccessRole =
    params.accessRoleConfig?.editable && !!params.employee.userId;
  const savePendingAccessRole =
    params.accessRoleConfig?.editable &&
    !params.employee.userId &&
    !!params.employee.email;

  const accessRole =
    canEditAccessRole || savePendingAccessRole ? params.accessRole : undefined;
  const previousAccessRole = canEditAccessRole
    ? params.linkedMemberRole
    : undefined;

  return {
    accessRole,
    previousAccessRole,
    savePendingAccessRole: Boolean(savePendingAccessRole),
    shouldPatchAccessRole: shouldPatchAccessRoleOnSave(
      accessRole,
      previousAccessRole,
    ),
  };
}

export function shouldPatchAccessRoleOnSave(
  accessRole: TeamMemberRole | undefined,
  previousAccessRole: TeamMemberRole | undefined,
): boolean {
  return !!(
    accessRole &&
    previousAccessRole &&
    accessRole !== previousAccessRole
  );
}
