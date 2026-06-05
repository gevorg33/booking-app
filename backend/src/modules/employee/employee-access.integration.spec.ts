import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { InvitationsService } from '../invitations/invitations.service.js';
import { TeamMembersService } from '../business/team-members.service.js';

describe('Employee access integration', () => {
  const businessId = 'biz-1';
  const ownerUserId = 'user-owner';
  const employeeId = 'emp-pending';

  const pendingEmployee = {
    id: employeeId,
    businessId,
    name: 'Karo Mazmanyan',
    email: 'karo@test.com',
    userId: null,
    isActive: true,
  };

  const linkedEmployee = {
    id: 'emp-linked',
    businessId,
    name: 'Mary Torgomyan',
    email: 'mary@test.com',
    userId: 'user-mary',
    isActive: true,
  };

  const inviteRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (invite: Record<string, unknown>) => ({
      id: 'invite-1',
      ...invite,
    })),
    create: jest.fn((invite: Record<string, unknown>) => invite),
    update: jest.fn(),
  };

  const memberRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (member: Record<string, unknown>) => member),
  };

  const userRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const employeeRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const emailService = {
    send: jest.fn(async () => ({ ok: true })),
  };

  const tenantContactService = {
    assertEmailAvailableForInvite: jest.fn(async () => undefined),
    assertEmailAvailableInTenant: jest.fn(async () => undefined),
  };

  const businessService = {
    ensureMember: jest.fn(async () => ({ role: MemberRole.OWNER })),
    ensureOwner: jest.fn(async () => ({ role: MemberRole.OWNER })),
  };

  const invitationsService = new InvitationsService(
    inviteRepo as any,
    memberRepo as any,
    userRepo as any,
    employeeRepo as any,
    emailService as any,
    tenantContactService as any,
  );

  const teamMembersService = new TeamMembersService(
    memberRepo as any,
    employeeRepo as any,
    businessService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    inviteRepo.find.mockResolvedValue([]);
    inviteRepo.update.mockResolvedValue(undefined);
  });

  describe('sendEmployeeAppAccess', () => {
    it('creates app-access invite with requested role', async () => {
      employeeRepo.findOne.mockResolvedValue(pendingEmployee);

      const invite = await invitationsService.sendEmployeeAppAccess(
        businessId,
        employeeId,
        ownerUserId,
        MemberRole.STAFF,
      );

      expect(tenantContactService.assertEmailAvailableInTenant).toHaveBeenCalledWith(
        businessId,
        'karo@test.com',
        { employeeId },
      );
      expect(inviteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'karo@test.com',
          role: MemberRole.STAFF,
          employeeId,
          employeeName: 'Karo Mazmanyan',
        }),
      );
      expect(invite.role).toBe(MemberRole.STAFF);
      expect(emailService.send).toHaveBeenCalled();
    });

    it('expires stale pending invites before creating app-access invite', async () => {
      employeeRepo.findOne.mockResolvedValue(pendingEmployee);
      inviteRepo.find.mockResolvedValue([
        {
          id: 'old-invite',
          businessId,
          email: 'karo@test.com',
          employeeId,
          acceptedAt: null,
          expiresAt: new Date('2099-01-01'),
        },
      ]);

      await invitationsService.sendEmployeeAppAccess(
        businessId,
        employeeId,
        ownerUserId,
        MemberRole.MANAGER,
      );

      expect(inviteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('throws when email provider fails', async () => {
      employeeRepo.findOne.mockResolvedValue(pendingEmployee);
      emailService.send.mockResolvedValueOnce({ ok: false, error: 'SMTP down' });

      await expect(
        invitationsService.sendEmployeeAppAccess(
          businessId,
          employeeId,
          ownerUserId,
          MemberRole.STAFF,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('defaults role to contributor when owner omits role', async () => {
      employeeRepo.findOne.mockResolvedValue(pendingEmployee);

      const invite = await invitationsService.sendEmployeeAppAccess(
        businessId,
        employeeId,
        ownerUserId,
      );

      expect(invite.role).toBe(MemberRole.CONTRIBUTOR);
    });

    it('rejects when employee is missing', async () => {
      employeeRepo.findOne.mockResolvedValue(null);

      await expect(
        invitationsService.sendEmployeeAppAccess(
          businessId,
          employeeId,
          ownerUserId,
          MemberRole.STAFF,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when employee has no email', async () => {
      employeeRepo.findOne.mockResolvedValue({
        ...pendingEmployee,
        email: '   ',
      });

      await expect(
        invitationsService.sendEmployeeAppAccess(
          businessId,
          employeeId,
          ownerUserId,
          MemberRole.STAFF,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when employee already has app access', async () => {
      employeeRepo.findOne.mockResolvedValue(linkedEmployee);

      await expect(
        invitationsService.sendEmployeeAppAccess(
          businessId,
          linkedEmployee.id,
          ownerUserId,
          MemberRole.STAFF,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('create invitation role policy', () => {
    it('allows owner to invite admin role', async () => {
      memberRepo.findOne.mockResolvedValue({ role: MemberRole.OWNER });

      await invitationsService.create(businessId, ownerUserId, {
        email: 'admin@test.com',
        role: MemberRole.ADMIN,
      });

      expect(inviteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: MemberRole.ADMIN }),
      );
    });

    it('rejects non-owner inviting admin role', async () => {
      memberRepo.findOne.mockResolvedValue({ role: MemberRole.MANAGER });

      await expect(
        invitationsService.create(businessId, 'user-manager', {
          email: 'admin@test.com',
          role: MemberRole.ADMIN,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects inviting as owner', async () => {
      await expect(
        invitationsService.create(businessId, ownerUserId, {
          email: 'owner2@test.com',
          role: MemberRole.OWNER,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('defaults generic invite role to contributor', async () => {
      await invitationsService.create(businessId, ownerUserId, {
        email: 'new@test.com',
      });

      expect(inviteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: MemberRole.CONTRIBUTOR }),
      );
    });

    it('delegates create with employeeId to sendEmployeeAppAccess', async () => {
      employeeRepo.findOne.mockResolvedValue(pendingEmployee);
      const spy = jest.spyOn(invitationsService, 'sendEmployeeAppAccess');

      await invitationsService.create(businessId, ownerUserId, {
        email: 'ignored@test.com',
        employeeId,
      });

      expect(spy).toHaveBeenCalledWith(
        businessId,
        employeeId,
        ownerUserId,
      );
      spy.mockRestore();
    });
  });

  describe('edit save then patch access role flow', () => {
    const staffMember = {
      id: 'member-mary',
      businessId,
      userId: linkedEmployee.userId,
      role: MemberRole.STAFF,
      user: {
        id: linkedEmployee.userId,
        email: linkedEmployee.email,
        firstName: 'Mary',
        lastName: 'Torgomyan',
      },
    };

    it('patches access role only after employee is linked to a member', async () => {
      employeeRepo.findOne
        .mockResolvedValueOnce(linkedEmployee)
        .mockResolvedValueOnce(linkedEmployee);
      memberRepo.findOne.mockResolvedValue({ ...staffMember });

      const result = await teamMembersService.updateRoleByEmployeeId(
        businessId,
        linkedEmployee.id,
        MemberRole.MANAGER,
        ownerUserId,
      );

      expect(result.role).toBe(MemberRole.MANAGER);
      expect(result.employeeId).toBe(linkedEmployee.id);
    });
  });
});
