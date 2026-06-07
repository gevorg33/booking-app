import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '../../business/entities/business-member.entity.js';
import { PatientClinicalProfileAccessService } from './patient-clinical-profile-access.service.js';

describe('PatientClinicalProfileAccessService', () => {
  const businessService = {
    ensureMember: jest.fn(),
  };
  const employeeRepo = { findOne: jest.fn() };
  const customerRepo = { findOne: jest.fn() };
  const bookingRepo = { find: jest.fn() };

  const service = new PatientClinicalProfileAccessService(
    businessService as any,
    employeeRepo as any,
    customerRepo as any,
    bookingRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepo.findOne.mockResolvedValue({ id: 'cust-1' });
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-1', isActive: true });
    bookingRepo.find.mockResolvedValue([
      { employeeId: 'emp-1', linkedEmployeeIds: ['emp-2'] },
    ]);
  });

  it('throws when customer is missing', async () => {
    customerRepo.findOne.mockResolvedValue(null);
    await expect(
      service.assertCustomerClinicalProfileAccess('biz-1', 'user-1', 'cust-x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows provider with linked booking assignment', async () => {
    bookingRepo.find.mockResolvedValue([
      { employeeId: 'emp-other', linkedEmployeeIds: ['emp-1'] },
    ]);

    const access = await service.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );
    expect(access.phiAccess.hasAssignedBooking).toBe(true);
  });

  it('allows receptionist without employee record', async () => {
    employeeRepo.findOne.mockResolvedValue(null);
    bookingRepo.find.mockResolvedValue([]);

    const access = await service.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );
    expect(access.ctx.employeeId).toBeNull();
    expect(access.phiAccess.hasAssignedBooking).toBe(false);
  });

  it('blocks provider without assigned booking', async () => {
    bookingRepo.find.mockResolvedValue([]);
    await expect(
      service.assertCustomerClinicalProfileAccess('biz-1', 'user-1', 'cust-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('maps staff context for PHI writes', () => {
    expect(
      service.toPhiStaffContext({
        userId: 'user-1',
        membershipRole: MemberRole.MANAGER,
        employeeId: 'emp-1',
      }),
    ).toEqual({
      userId: 'user-1',
      role: String(MemberRole.MANAGER),
      employeeId: 'emp-1',
    });
  });
});
