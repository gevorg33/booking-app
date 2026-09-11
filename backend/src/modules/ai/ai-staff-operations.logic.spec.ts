import {
  handleConfigureOnlineBookingLogic,
  handleCreateEmployeeLogic,
  handleDeactivateEmployeeLogic,
  handleInviteStaffMemberLogic,
} from './ai-staff-operations.logic.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import type { Business } from '../business/entities/business.entity.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import type { TeamMemberView } from '../business/team-members.service.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { makeBusinessInvitation } from '../invitations/entities/business-invitation.test-fixture.js';
import { makeEmployee } from '../employee/entities/employee.test-fixture.js';

describe('ai-staff-operations.logic (ai-cmd-ext-2.5–2.8)', () => {
  const employeeService = {
    create: jest.fn(async () =>
      makeEmployee({ id: 'emp-new', name: 'Anna', email: 'anna@salon.com' }),
    ),
    findAll: jest.fn(async () => [
      makeEmployee({
        id: 'emp-1',
        name: 'Maria Lopez',
        email: 'maria@salon.com',
      }),
      makeEmployee({
        id: 'emp-2',
        name: 'Gevorg Gasparyan',
        email: 'gevorg@salon.com',
      }),
    ]),
    remove: jest.fn(async () => undefined),
    // `update` was absent while the dep was declared as the whole
    // `EmployeeService` — the logic calls it, so any test reaching
    // `update_employee` would have hit `undefined is not a function`.
    update: jest.fn(async () =>
      makeEmployee({ id: 'emp-1', name: 'Maria Lopez' }),
    ),
  };
  const invitationsService = {
    create: jest.fn(async () => makeBusinessInvitation({ id: 'inv-1' })),
    sendEmployeeAppAccess: jest.fn(async () =>
      makeBusinessInvitation({ id: 'inv-2' }),
    ),
  };
  const businessRepo = {
    findOne: jest.fn(
      async (): Promise<Business | null> =>
        makeBusiness({
          id: 'biz-1',
          settings: { publicBooking: { enabled: true } },
        }),
    ),
    update: jest.fn(async () => undefined),
  };
  const serviceRepo = {
    find: jest.fn(async () => [
      makeService({ id: 'svc-1', name: 'Massage Therapy' }),
      makeService({ id: 'svc-2', name: 'Haircut' }),
    ]),
  };
  const teamMembersService = {
    // A complete `TeamMemberView`: `{ role }` alone was missing the six fields
    // that identify *which* member had their role changed.
    updateRoleByEmployeeId: jest.fn(
      async (
        _b: string,
        employeeId: string,
        role: MemberRole,
      ): Promise<TeamMemberView> => ({
        id: 'member-1',
        userId: 'user-1',
        email: 'member@salon.com',
        name: 'Maria Lopez',
        role,
        employeeId,
        employeeName: 'Maria Lopez',
      }),
    ),
  };
  const deps = {
    employeeService,
    invitationsService,
    teamMembersService,
    businessRepo,
    serviceRepo,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('create employee requires name', async () => {
    const result = await handleCreateEmployeeLogic(
      deps,
      'biz-1',
      {},
      'Add stylist',
      'user-1',
    );
    expect(result.success).toBe(false);
  });

  it('creates employee with services and email from prompt', async () => {
    const result = await handleCreateEmployeeLogic(
      deps,
      'biz-1',
      {},
      'Hire provider Jake jake@salon.com with massage services',
      'user-1',
    );
    expect(result.success).toBe(true);
    expect(employeeService.create).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        name: 'Jake',
        email: 'jake@salon.com',
        serviceIds: ['svc-1'],
      }),
      'user-1',
    );
  });

  it('invite requires user id', async () => {
    const result = await handleInviteStaffMemberLogic(
      deps,
      'biz-1',
      { email: 'anna@salon.com' },
      'Invite anna@salon.com',
    );
    expect(result.success).toBe(false);
  });

  it('invites by email', async () => {
    const result = await handleInviteStaffMemberLogic(
      deps,
      'biz-1',
      {},
      'Invite anna@salon.com to the provider app',
      'user-1',
    );
    expect(result.success).toBe(true);
    expect(invitationsService.create).toHaveBeenCalled();
  });

  it('invites existing employee by name', async () => {
    const result = await handleInviteStaffMemberLogic(
      deps,
      'biz-1',
      { employeeName: 'Maria' },
      'Invite Maria to the provider app',
      'user-1',
    );
    expect(result.success).toBe(true);
    expect(invitationsService.sendEmployeeAppAccess).toHaveBeenCalledWith(
      'biz-1',
      'emp-1',
      'user-1',
    );
  });

  it('deactivate requires employee name', async () => {
    const result = await handleDeactivateEmployeeLogic(
      deps,
      'biz-1',
      {},
      'Deactivate someone',
      'user-1',
    );
    expect(result.success).toBe(false);
  });

  it('deactivates matched employee', async () => {
    const result = await handleDeactivateEmployeeLogic(
      deps,
      'biz-1',
      { employeeName: 'Gevorg' },
      'Deactivate employee Gevorg',
      'user-1',
    );
    expect(result.success).toBe(true);
    expect(employeeService.remove).toHaveBeenCalledWith('emp-2', 'user-1');
  });

  it('reports missing employee on deactivate', async () => {
    const result = await handleDeactivateEmployeeLogic(
      deps,
      'biz-1',
      { employeeName: 'Nobody' },
      'Deactivate employee Nobody',
      'user-1',
    );
    expect(result.success).toBe(false);
  });

  it('configure online booking explains current state', async () => {
    const result = await handleConfigureOnlineBookingLogic(
      deps,
      'biz-1',
      {},
      'Configure online booking settings',
    );
    expect(result.success).toBe(true);
    expect(result.details?.enabled).toBe(true);
  });

  it('surfaces create errors from employee service', async () => {
    employeeService.create.mockRejectedValueOnce(new Error('Duplicate email'));
    const result = await handleCreateEmployeeLogic(
      deps,
      'biz-1',
      { employeeName: 'Anna' },
      undefined,
      'user-1',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Duplicate email');
  });

  it('fails invite when employee has no email on file', async () => {
    employeeService.findAll.mockResolvedValueOnce([
      { id: 'emp-3', name: 'No Email', email: '' },
    ]);
    const result = await handleInviteStaffMemberLogic(
      deps,
      'biz-1',
      { employeeName: 'No Email' },
      undefined,
      'user-1',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('no email');
  });

  it('fails configure when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleConfigureOnlineBookingLogic(
      deps,
      'biz-1',
      { enabled: true },
      undefined,
    );
    expect(result.success).toBe(false);
  });

  it('disables online booking when requested', async () => {
    const result = await handleConfigureOnlineBookingLogic(
      deps,
      'biz-1',
      {},
      'Turn off public booking website',
    );
    expect(result.success).toBe(true);
    expect(businessRepo.update).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        settings: expect.objectContaining({
          publicBooking: expect.objectContaining({ enabled: false }),
        }),
      }),
    );
  });
});
