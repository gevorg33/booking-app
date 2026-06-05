import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from './entities/business-member.entity.js';
import { TeamMembersService } from './team-members.service.js';

describe('TeamMembersService integration', () => {
  const businessId = 'biz-1';
  const ownerUserId = 'user-owner';
  const staffUserId = 'user-staff';
  const staffMemberId = 'member-staff';

  const staffUser = {
    id: staffUserId,
    email: 'staff@test.com',
    firstName: 'Mary',
    lastName: 'Torgomyan',
  };

  const staffMember = {
    id: staffMemberId,
    businessId,
    userId: staffUserId,
    role: MemberRole.STAFF,
    user: staffUser,
    createdAt: new Date('2026-01-01'),
  };

  const ownerMember = {
    id: 'member-owner',
    businessId,
    userId: ownerUserId,
    role: MemberRole.OWNER,
    user: {
      id: ownerUserId,
      email: 'owner@test.com',
      firstName: 'Owner',
      lastName: 'User',
    },
    createdAt: new Date('2026-01-01'),
  };

  const linkedEmployee = {
    id: 'emp-staff',
    businessId,
    userId: staffUserId,
    name: 'Mary Torgomyan',
    isActive: true,
  };

  const memberRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (member: Record<string, unknown>) => member),
  };

  const employeeRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const businessService = {
    ensureMember: jest.fn(async () => ownerMember),
    ensureOwner: jest.fn(async () => ownerMember),
  };

  const service = new TeamMembersService(
    memberRepo as any,
    employeeRepo as any,
    businessService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue(ownerMember);
    businessService.ensureOwner.mockResolvedValue(ownerMember);
  });

  describe('list', () => {
    it('returns members linked to active employees by userId', async () => {
      memberRepo.find.mockResolvedValue([ownerMember, staffMember]);
      employeeRepo.find.mockResolvedValue([linkedEmployee]);

      const result = await service.list(businessId, ownerUserId);

      expect(businessService.ensureMember).toHaveBeenCalledWith(
        businessId,
        ownerUserId,
      );
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        id: staffMemberId,
        userId: staffUserId,
        email: 'staff@test.com',
        name: 'Mary Torgomyan',
        role: MemberRole.STAFF,
        employeeId: 'emp-staff',
        employeeName: 'Mary Torgomyan',
      });
      expect(result[0].employeeId).toBeNull();
    });

    it('ignores inactive employees without userId when building linkage map', async () => {
      memberRepo.find.mockResolvedValue([staffMember]);
      employeeRepo.find.mockResolvedValue([
        { ...linkedEmployee, userId: null },
        linkedEmployee,
      ]);

      const [row] = await service.list(businessId, ownerUserId);

      expect(row.employeeId).toBe('emp-staff');
    });

    it('falls back to email when user has no name parts', async () => {
      const emailOnlyMember = {
        ...staffMember,
        user: { id: staffUserId, email: 'emailonly@test.com' },
      };
      memberRepo.find.mockResolvedValue([emailOnlyMember]);
      employeeRepo.find.mockResolvedValue([]);

      const [row] = await service.list(businessId, ownerUserId);

      expect(row.name).toBe('emailonly@test.com');
      expect(row.employeeId).toBeNull();
    });
  });

  describe('updateRole', () => {
    beforeEach(() => {
      memberRepo.findOne.mockResolvedValue({ ...staffMember });
      employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    });

    it('updates assignable role for another member', async () => {
      const result = await service.updateRole(
        businessId,
        staffMemberId,
        MemberRole.MANAGER,
        ownerUserId,
      );

      expect(businessService.ensureOwner).toHaveBeenCalledWith(
        businessId,
        ownerUserId,
      );
      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: MemberRole.MANAGER }),
      );
      expect(result.role).toBe(MemberRole.MANAGER);
      expect(result.employeeId).toBe('emp-staff');
    });

    it('rejects changing owner role', async () => {
      memberRepo.findOne.mockResolvedValue({ ...ownerMember });

      await expect(
        service.updateRole(
          businessId,
          ownerMember.id,
          MemberRole.ADMIN,
          ownerUserId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects self role change', async () => {
      await expect(
        service.updateRole(
          businessId,
          staffMemberId,
          MemberRole.ADMIN,
          staffUserId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-owner requester', async () => {
      businessService.ensureOwner.mockRejectedValue(
        new ForbiddenException('Only the business owner can manage team roles'),
      );

      await expect(
        service.updateRole(
          businessId,
          staffMemberId,
          MemberRole.ADMIN,
          staffUserId,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws when member is missing', async () => {
      memberRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateRole(
          businessId,
          'missing-member',
          MemberRole.ADMIN,
          ownerUserId,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns member without employee linkage when user has no linked employee', async () => {
      employeeRepo.findOne.mockResolvedValue(null);

      const result = await service.updateRole(
        businessId,
        staffMemberId,
        MemberRole.CONTRIBUTOR,
        ownerUserId,
      );

      expect(result.employeeId).toBeNull();
      expect(result.employeeName).toBeNull();
    });

    it('skips employee lookup when member has no userId', async () => {
      memberRepo.findOne.mockResolvedValue({
        ...staffMember,
        userId: null,
        user: { id: null, email: 'orphan@test.com' },
      });

      const result = await service.updateRole(
        businessId,
        staffMemberId,
        MemberRole.CONTRIBUTOR,
        ownerUserId,
      );

      expect(employeeRepo.findOne).not.toHaveBeenCalled();
      expect(result.employeeId).toBeNull();
    });

    it('uses first name only when last name is missing', async () => {
      memberRepo.findOne.mockResolvedValue({
        ...staffMember,
        user: { id: staffUserId, email: 'staff@test.com', firstName: 'Mary' },
      });
      employeeRepo.findOne.mockResolvedValue(linkedEmployee);

      const result = await service.updateRole(
        businessId,
        staffMemberId,
        MemberRole.MANAGER,
        ownerUserId,
      );

      expect(result.name).toBe('Mary');
    });
  });

  describe('updateRoleByEmployeeId', () => {
    beforeEach(() => {
      memberRepo.findOne.mockResolvedValue({ ...staffMember });
      employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    });

    it('delegates to updateRole when employee has dashboard access', async () => {
      const result = await service.updateRoleByEmployeeId(
        businessId,
        linkedEmployee.id,
        MemberRole.ADMIN,
        ownerUserId,
      );

      expect(result.role).toBe(MemberRole.ADMIN);
      expect(memberRepo.save).toHaveBeenCalled();
    });

    it('throws when employee is missing', async () => {
      employeeRepo.findOne.mockReset();
      employeeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateRoleByEmployeeId(
          businessId,
          'missing-emp',
          MemberRole.STAFF,
          ownerUserId,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when employee has no userId yet', async () => {
      employeeRepo.findOne.mockReset();
      employeeRepo.findOne.mockResolvedValue({
        ...linkedEmployee,
        userId: null,
      });

      await expect(
        service.updateRoleByEmployeeId(
          businessId,
          linkedEmployee.id,
          MemberRole.STAFF,
          ownerUserId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when team member is missing for employee user', async () => {
      employeeRepo.findOne.mockReset();
      employeeRepo.findOne.mockResolvedValue(linkedEmployee);
      memberRepo.findOne.mockReset();
      memberRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateRoleByEmployeeId(
          businessId,
          linkedEmployee.id,
          MemberRole.STAFF,
          ownerUserId,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
