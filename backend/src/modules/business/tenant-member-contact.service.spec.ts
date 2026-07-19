import { ConflictException } from '@nestjs/common';
import { TenantMemberContactService } from './tenant-member-contact.service.js';

describe('TenantMemberContactService (e2e-bug.62 / api-bug.8)', () => {
  const memberRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const employeeRepo = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const userRepo = {
    findOne: jest.fn(),
  };

  const service = new TenantMemberContactService(
    memberRepo as never,
    employeeRepo as never,
    userRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    userRepo.findOne.mockResolvedValue(null);
    memberRepo.findOne.mockResolvedValue(null);
    employeeRepo.find.mockResolvedValue([]);
  });

  it('assertEmailAvailableForInvite uses find({ isActive }) — not raw is_active QB', async () => {
    await expect(
      service.assertEmailAvailableForInvite(
        'biz-1',
        '  New.Hire@Example.com ',
      ),
    ).resolves.toBeUndefined();

    expect(employeeRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(employeeRepo.find).toHaveBeenCalledWith({
      where: { businessId: 'biz-1', isActive: true },
    });
  });

  it('assertEmailAvailableForInvite allows unused email (case/whitespace normalized)', async () => {
    employeeRepo.find.mockResolvedValue([
      {
        id: 'emp-1',
        email: 'other@example.com',
        userId: null,
        isActive: true,
      },
    ]);

    await expect(
      service.assertEmailAvailableForInvite('biz-1', 'new.hire@example.com'),
    ).resolves.toBeUndefined();
  });

  it('assertEmailAvailableForInvite rejects email already on a linked team member', async () => {
    employeeRepo.find.mockResolvedValue([
      {
        id: 'emp-1',
        email: '  Taken@Example.com ',
        userId: 'user-1',
        isActive: true,
      },
    ]);
    memberRepo.findOne.mockResolvedValue({
      businessId: 'biz-1',
      userId: 'user-1',
    });

    await expect(
      service.assertEmailAvailableForInvite('biz-1', 'taken@example.com'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('assertEmailAvailableForInvite rejects email already on a BusinessMember user', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'user-2', email: 'member@x.com' });
    memberRepo.findOne.mockResolvedValue({
      businessId: 'biz-1',
      userId: 'user-2',
    });

    await expect(
      service.assertEmailAvailableForInvite('biz-1', 'member@x.com'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(employeeRepo.find).not.toHaveBeenCalled();
  });
});
