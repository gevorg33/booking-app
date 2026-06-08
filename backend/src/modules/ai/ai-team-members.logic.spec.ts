import { MemberRole } from '../business/entities/business-member.entity.js';
import {
  handleUpdateTeamMemberRoleLogic,
  type TeamMembersLogicDeps,
} from './ai-team-members.logic.js';

function buildDeps(
  overrides: Partial<TeamMembersLogicDeps> = {},
): TeamMembersLogicDeps {
  return {
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', name: 'Test Salon' })),
    } as any,
    teamMembersService: {
      updateRole: jest.fn(async () => ({
        id: 'mem-1',
        email: 'anna@example.com',
        role: MemberRole.MANAGER,
      })),
      updateRoleByEmployeeId: jest.fn(async () => ({
        id: 'mem-2',
        email: 'john@example.com',
        role: MemberRole.STAFF,
      })),
    },
    ...overrides,
  };
}

describe('ai-team-members.logic (parity-2.1)', () => {
  it('requires signed-in owner', async () => {
    const result = await handleUpdateTeamMemberRoleLogic(
      buildDeps(),
      'biz-1',
      undefined,
      { role: 'manager', memberId: 'mem-1' },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/owner/i);
  });

  it('clarifies missing role', async () => {
    const result = await handleUpdateTeamMemberRoleLogic(
      buildDeps(),
      'biz-1',
      'user-owner',
      { memberId: 'mem-1' },
    );
    expect(result.success).toBe(false);
    expect((result.details as any).missing).toContain('role');
  });

  it('updates role by memberId', async () => {
    const deps = buildDeps();
    const result = await handleUpdateTeamMemberRoleLogic(
      deps,
      'biz-1',
      'user-owner',
      { memberId: 'mem-1', role: 'manager' },
    );
    expect(result.success).toBe(true);
    expect(deps.teamMembersService.updateRole).toHaveBeenCalledWith(
      'biz-1',
      'mem-1',
      MemberRole.MANAGER,
      'user-owner',
    );
  });

  it('updates role by employeeId', async () => {
    const deps = buildDeps();
    const result = await handleUpdateTeamMemberRoleLogic(
      deps,
      'biz-1',
      'user-owner',
      { employeeId: 'emp-1', role: 'staff' },
    );
    expect(result.success).toBe(true);
    expect(deps.teamMembersService.updateRoleByEmployeeId).toHaveBeenCalled();
  });

  it('clarifies when member identifier missing', async () => {
    const result = await handleUpdateTeamMemberRoleLogic(
      buildDeps(),
      'biz-1',
      'user-owner',
      { role: 'admin' },
    );
    expect(result.success).toBe(false);
    expect((result.details as any).missing).toContain('memberId');
  });

  it('does not support email-only lookup yet', async () => {
    const result = await handleUpdateTeamMemberRoleLogic(
      buildDeps(),
      'biz-1',
      'user-owner',
      { memberEmail: 'anna@example.com', role: 'manager' },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/memberId or employeeId/i);
  });
});
