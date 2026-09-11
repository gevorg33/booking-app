import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';
import { AiOperationsService } from './ai-operations.service.js';
import {
  CONFIGURE_ONLINE_BOOKING_PROMPTS,
  CREATE_EMPLOYEE_PROMPTS,
  DEACTIVATE_EMPLOYEE_PROMPTS,
  INVITE_STAFF_MEMBER_PROMPTS,
  STAFF_OPERATIONS_RESCUE_SCENARIOS,
} from './ai-staff-operations.fixtures.js';

describe('AiStaffOperations integration (ai-cmd-ext-2.5–2.8)', () => {
  const rescueService = new AiIntentRescueService();

  it.each(STAFF_OPERATIONS_RESCUE_SCENARIOS)(
    'rescues misclassified staff prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it.each(CREATE_EMPLOYEE_PROMPTS.slice(0, 3))(
    'rescues unknown create prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('create_employee');
    },
  );

  it.each(INVITE_STAFF_MEMBER_PROMPTS.slice(0, 3))(
    'rescues unknown invite prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('invite_staff_member');
    },
  );

  it.each(DEACTIVATE_EMPLOYEE_PROMPTS.slice(0, 3))(
    'rescues unknown deactivate prompt $id',
    ({ prompt, expectedParams }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('deactivate_employee');
      if (expectedParams?.employeeName) {
        expect(rescued?.params.employeeName).toBe(expectedParams.employeeName);
      }
    },
  );

  it.each(CONFIGURE_ONLINE_BOOKING_PROMPTS.slice(0, 3))(
    'rescues unknown configure booking prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('configure_online_booking');
    },
  );

  describe('AiOperationsService staff handlers', () => {
    const employeeService = {
      create: jest.fn(async (_biz, body) => ({
        id: 'emp-9',
        name: body.name,
        email: body.email,
      })),
      findAll: jest.fn(async () => [
        makeService({ id: 'emp-1', name: 'Maria Lopez', email: 'maria@salon.com' }),
      ]),
      update: jest.fn(async (_id, dto) => ({
        id: 'emp-1',
        name: dto.name ?? 'Maria Lopez',
        email: dto.email ?? 'maria@salon.com',
      })),
      remove: jest.fn(async () => undefined),
    };
    const invitationsService = {
      create: jest.fn(async () => ({ id: 'inv-1' })),
      sendEmployeeAppAccess: jest.fn(async () => ({ id: 'inv-2' })),
    };
    const businessRepo = {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: { publicBooking: { enabled: false } },
      })),
      update: jest.fn(async () => undefined),
    };
    const serviceRepo = {
      find: jest.fn(async () => [
        { id: 'svc-1', name: 'Massage Therapy' },
        { id: 'svc-2', name: 'Haircut' },
      ]),
    };
    const bookingRepo = { find: jest.fn(async () => []) };
    const orchestration = { executePlan: jest.fn() };
    const planBuilder = { wrapOperationsPlan: jest.fn() };
    const teamMembersService = {
      updateRoleByEmployeeId: jest.fn(
        async (_biz: string, _employeeId: string, role: string) => ({
          role,
        }),
      ),
    };

    const service = new AiOperationsService(
      bookingRepo as any,
      businessRepo as any,
      serviceRepo as any,
      orchestration as any,
      planBuilder as any,
      employeeService as any,
      invitationsService as any,
      teamMembersService as any,
    );

    it('delegates create_employee through service', async () => {
      const result = await service.handleCreateEmployee(
        'biz-1',
        { employeeName: 'Anna' },
        'Add stylist Anna',
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('create_employee');
    });

    it('delegates update_employee through service', async () => {
      const result = await service.handleUpdateEmployee(
        'biz-1',
        {},
        "Change Maria's email to maria.new@salon.com",
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('update_employee');
      expect(employeeService.update).toHaveBeenCalledWith(
        'emp-1',
        { email: 'maria.new@salon.com' },
        'user-1',
      );
    });

    it('update_employee resolves and replaces serviceIds', async () => {
      const result = await service.handleUpdateEmployee(
        'biz-1',
        { employeeName: 'Maria', serviceNames: ['Massage Therapy'] },
        undefined,
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(employeeService.update).toHaveBeenCalledWith(
        'emp-1',
        { serviceIds: ['svc-1'] },
        'user-1',
      );
    });

    it('delegates update_team_member_role through service', async () => {
      const result = await service.handleUpdateTeamMemberRole('biz-1', {
        employeeName: 'Maria',
        role: 'manager',
      });
      expect(result.success).toBe(true);
      expect(result.action).toBe('update_team_member_role');
      expect(teamMembersService.updateRoleByEmployeeId).toHaveBeenCalledWith(
        'biz-1',
        'emp-1',
        'manager',
        '',
      );
    });

    it('rejects update_team_member_role without employeeName or a valid role', async () => {
      const missingEmployee = await service.handleUpdateTeamMemberRole(
        'biz-1',
        { role: 'manager' },
      );
      expect(missingEmployee.success).toBe(false);

      const missingRole = await service.handleUpdateTeamMemberRole('biz-1', {
        employeeName: 'Maria',
      });
      expect(missingRole.success).toBe(false);

      const invalidRole = await service.handleUpdateTeamMemberRole('biz-1', {
        employeeName: 'Maria',
        role: 'owner',
      });
      expect(invalidRole.success).toBe(false);
    });

    it('surfaces errors from the team members service (e.g. owner role change attempt)', async () => {
      teamMembersService.updateRoleByEmployeeId.mockRejectedValueOnce(
        new Error('The business owner role cannot be changed'),
      );
      const result = await service.handleUpdateTeamMemberRole('biz-1', {
        employeeName: 'Maria',
        role: 'admin',
      });
      expect(result.success).toBe(false);
      expect(result.summary).toContain('owner role cannot be changed');
    });

    it('rejects update_employee without a target or fields', async () => {
      const missingTarget = await service.handleUpdateEmployee(
        'biz-1',
        {},
        'Update the employee profile',
        'user-1',
      );
      expect(missingTarget.success).toBe(false);

      const missingFields = await service.handleUpdateEmployee(
        'biz-1',
        { employeeName: 'Maria' },
        undefined,
        'user-1',
      );
      expect(missingFields.success).toBe(false);
      expect(missingFields.summary).toContain('What should I change');
    });

    it('delegates invite_staff_member through service', async () => {
      const result = await service.handleInviteStaffMember(
        'biz-1',
        {},
        'Invite anna@salon.com to the provider app',
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('invite_staff_member');
    });

    it('delegates deactivate_employee through service', async () => {
      const result = await service.handleDeactivateEmployee(
        'biz-1',
        { employeeName: 'Maria' },
        'Remove Maria from the team',
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('deactivate_employee');
    });

    it('delegates configure_online_booking through service', async () => {
      const result = await service.handleConfigureOnlineBooking(
        'biz-1',
        {},
        'Enable online booking on our public page',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('configure_online_booking');
      expect(businessRepo.update).toHaveBeenCalled();
    });
  });
});
