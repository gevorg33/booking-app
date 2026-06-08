import type { TeamMembersService } from '../business/team-members.service.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Repository } from 'typeorm';
import { MemberRole } from '../business/entities/business-member.entity.js';
import type { CommandResult } from './command-completion.types.js';

export interface TeamMembersLogicDeps {
  businessRepo: Repository<Business>;
  teamMembersService: Pick<TeamMembersService, 'updateRole' | 'updateRoleByEmployeeId'>;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

type AssignableMemberRole =
  | MemberRole.ADMIN
  | MemberRole.MANAGER
  | MemberRole.STAFF
  | MemberRole.CONTRIBUTOR;

function normalizeRole(value: unknown): AssignableMemberRole | null {
  const role = String(value ?? '')
    .trim()
    .toLowerCase();
  switch (role) {
    case 'admin':
      return MemberRole.ADMIN;
    case 'manager':
      return MemberRole.MANAGER;
    case 'staff':
      return MemberRole.STAFF;
    case 'contributor':
      return MemberRole.CONTRIBUTOR;
    default:
      return null;
  }
}

export async function handleUpdateTeamMemberRoleLogic(
  deps: TeamMembersLogicDeps,
  businessId: string,
  requesterId: string | undefined,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  if (!requesterId) {
    return failure(
      'update_team_member_role',
      'Sign in as the business owner to change team roles.',
      { clarify: true },
    );
  }

  const role = normalizeRole(params.role);
  if (!role) {
    return failure(
      'update_team_member_role',
      'Which role should I assign (staff, manager, admin, or contributor)?',
      { clarify: true, missing: ['role'] },
    );
  }

  const memberId = String(params.memberId ?? '').trim();
  const employeeId = String(params.employeeId ?? '').trim();
  const memberEmail = String(params.memberEmail ?? params.email ?? '').trim();

  if (memberId) {
    const updated = await deps.teamMembersService.updateRole(
      businessId,
      memberId,
      role,
      requesterId,
    );
    return success(
      'update_team_member_role',
      `Updated ${updated.email ?? 'team member'} to ${role}.`,
      { memberId, role },
    );
  }

  if (employeeId) {
    const updated = await deps.teamMembersService.updateRoleByEmployeeId(
      businessId,
      employeeId,
      role,
      requesterId,
    );
    return success(
      'update_team_member_role',
      `Updated team role to ${role}.`,
      { employeeId, role, memberId: updated.id },
    );
  }

  if (memberEmail) {
    return failure(
      'update_team_member_role',
      'Provide memberId or employeeId to update a team role (email lookup is not supported in AI yet).',
      { clarify: true, missing: ['memberId'] },
    );
  }

  return failure(
    'update_team_member_role',
    'Which team member should I update? Provide memberId or employeeId and the target role.',
    { clarify: true, missing: ['memberId', 'role'] },
  );
}
