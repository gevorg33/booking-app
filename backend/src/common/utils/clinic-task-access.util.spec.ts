import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  canAssignClinicTask,
  canCancelClinicTask,
  canClaimClinicTask,
  canCompleteClinicTask,
  canCreateClinicTask,
  canListClinicTasks,
  canManageClinicTasks,
  isClinicTaskStaffRole,
  resolveClinicTaskAssigneeFilter,
} from './clinic-task-access.util.js';
import { CLINIC_TASK_FIXTURES } from '../../modules/clinic-tasks/clinic-task.fixtures.js';

describe('clinic-task-access.util', () => {
  const labOpsCtx = {
    userId: 'user-lab',
    membershipRole: MemberRole.MANAGER,
    employeeId: 'emp-lab-1',
  };
  const receptionistCtx = {
    userId: 'user-front',
    membershipRole: MemberRole.STAFF,
    employeeId: null,
  };
  const providerCtx = {
    userId: 'user-provider',
    membershipRole: MemberRole.STAFF,
    employeeId: 'emp-provider-1',
  };

  it('allows any clinic staff member to list tasks', () => {
    expect(canListClinicTasks(labOpsCtx)).toBe(true);
    expect(canListClinicTasks(receptionistCtx)).toBe(true);
    expect(canListClinicTasks(providerCtx)).toBe(true);
  });

  it('allows lab ops and receptionists to create tasks', () => {
    expect(canCreateClinicTask(labOpsCtx)).toBe(true);
    expect(canCreateClinicTask(receptionistCtx)).toBe(true);
    expect(canCreateClinicTask(providerCtx)).toBe(false);
  });

  it('restricts manage, assign, and cancel to lab ops', () => {
    expect(canManageClinicTasks(labOpsCtx)).toBe(true);
    expect(canManageClinicTasks(providerCtx)).toBe(false);
    expect(canAssignClinicTask(labOpsCtx)).toBe(true);
    expect(canAssignClinicTask(providerCtx)).toBe(false);
    expect(canCancelClinicTask(labOpsCtx, { status: 'open' })).toBe(true);
    expect(canCancelClinicTask(providerCtx, { status: 'open' })).toBe(false);
  });

  it('allows assignee or lab ops to complete open tasks', () => {
    const task = CLINIC_TASK_FIXTURES[0];
    expect(
      canCompleteClinicTask(providerCtx, {
        assigneeEmployeeId: 'emp-provider-1',
        status: 'open',
      }),
    ).toBe(true);
    expect(
      canCompleteClinicTask(providerCtx, {
        assigneeEmployeeId: 'emp-other',
        status: 'open',
      }),
    ).toBe(false);
    expect(
      canCompleteClinicTask(labOpsCtx, {
        assigneeEmployeeId: task.assigneeEmployeeId,
        status: 'open',
      }),
    ).toBe(true);
    expect(
      canCompleteClinicTask(providerCtx, {
        assigneeEmployeeId: 'emp-provider-1',
        status: 'completed',
      }),
    ).toBe(false);
  });

  it('allows providers to claim unassigned open tasks', () => {
    expect(
      canClaimClinicTask(providerCtx, {
        assigneeEmployeeId: null,
        status: 'open',
      }),
    ).toBe(true);
    expect(
      canClaimClinicTask(providerCtx, {
        assigneeEmployeeId: 'emp-other',
        status: 'open',
      }),
    ).toBe(false);
    expect(
      canClaimClinicTask(labOpsCtx, {
        assigneeEmployeeId: null,
        status: 'open',
      }),
    ).toBe(true);
    expect(
      canClaimClinicTask(receptionistCtx, {
        assigneeEmployeeId: null,
        status: 'open',
      }),
    ).toBe(false);
  });

  it('scopes provider inbox to unassigned or self-assigned tasks', () => {
    expect(resolveClinicTaskAssigneeFilter(labOpsCtx)).toBeUndefined();
    expect(resolveClinicTaskAssigneeFilter(receptionistCtx)).toBeUndefined();
    expect(resolveClinicTaskAssigneeFilter(providerCtx)).toBe('emp-provider-1');
  });

  it('recognizes clinic staff roles', () => {
    expect(isClinicTaskStaffRole(MemberRole.MANAGER)).toBe(true);
    expect(isClinicTaskStaffRole(MemberRole.STAFF)).toBe(true);
    expect(isClinicTaskStaffRole('guest')).toBe(false);
  });
});
