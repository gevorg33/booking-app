import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '../../business/entities/business-member.entity.js';
import { ClinicLabAccessService } from './clinic-lab-access.service.js';

describe('ClinicLabAccessService', () => {
  const businessService = { ensureMember: jest.fn() };
  const employeeRepo = { findOne: jest.fn() };
  const bookingRepo = { findOne: jest.fn() };
  const specimenRepo = { findOne: jest.fn() };
  const resultRepo = { findOne: jest.fn() };
  const orderRepo = { findOne: jest.fn() };

  const service = new ClinicLabAccessService(
    businessService as any,
    employeeRepo as any,
    bookingRepo as any,
    specimenRepo as any,
    resultRepo as any,
    orderRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue(null);
    bookingRepo.findOne.mockResolvedValue({
      id: 'booking-1',
      employeeId: 'emp-primary',
      linkedEmployeeIds: ['emp-assist'],
    });
  });

  it('resolves receptionist context for staff without employee profile', async () => {
    const ctx = await service.resolveStaffContext('biz-1', 'user-1');
    expect(ctx).toEqual({
      userId: 'user-1',
      membershipRole: MemberRole.STAFF,
      employeeId: null,
    });
  });

  it('allows receptionist to access any booking lab records', async () => {
    await expect(
      service.assertBookingLabAccess('biz-1', 'user-1', 'booking-1'),
    ).resolves.toMatchObject({ employeeId: null });
  });

  it('denies provider access to unassigned bookings', async () => {
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-other', isActive: true });

    await expect(
      service.assertBookingLabAccess('biz-1', 'user-1', 'booking-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('scopes lab queue filters to assigned provider', async () => {
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-primary',
      isActive: true,
    });

    await expect(
      service.scopeLabQueueFilters('biz-1', 'user-1', {
        status: 'NotCollected',
      }),
    ).resolves.toEqual({
      status: 'NotCollected',
      employeeId: 'emp-primary',
    });
  });

  it('does not override manager lab queue scope', async () => {
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });

    await expect(
      service.scopeLabQueueFilters('biz-1', 'user-1', {
        department: 'Laboratory',
      }),
    ).resolves.toEqual({ department: 'Laboratory' });
  });

  it('throws when booking is missing', async () => {
    bookingRepo.findOne.mockResolvedValue(null);

    await expect(
      service.assertCanCreateManualLabOrder('biz-1', 'user-1', 'booking-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('asserts specimen access through booking assignment', async () => {
    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      bookingId: 'booking-1',
    });

    await expect(
      service.assertSpecimenLabAccess('biz-1', 'user-1', 'spec-1'),
    ).resolves.toMatchObject({ employeeId: null });
  });

  it('denies provider access to unassigned specimen bookings', async () => {
    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      bookingId: 'booking-1',
    });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-other', isActive: true });

    await expect(
      service.assertSpecimenLabAccess('biz-1', 'user-1', 'spec-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('scopes result list filters to assigned provider', async () => {
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-primary',
      isActive: true,
    });

    await expect(
      service.scopeResultListFilters('biz-1', 'user-1', { view: 'review' }),
    ).resolves.toEqual({
      view: 'review',
      employeeId: 'emp-primary',
    });
  });

  it('asserts result access through booking assignment', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      bookingId: 'booking-1',
    });

    await expect(
      service.assertResultLabAccess('biz-1', 'user-1', 'result-1'),
    ).resolves.toMatchObject({
      ctx: { employeeId: null },
      bookingAccess: {
        employeeId: 'emp-primary',
        linkedEmployeeIds: ['emp-assist'],
      },
    });
  });

  it('denies provider access to unassigned results', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      bookingId: 'booking-1',
    });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-other', isActive: true });

    await expect(
      service.assertResultLabAccess('biz-1', 'user-1', 'result-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies provider access to results without booking linkage', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      bookingId: null,
    });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-primary',
      isActive: true,
    });

    await expect(
      service.assertResultLabAccess('biz-1', 'user-1', 'result-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when result is missing', async () => {
    resultRepo.findOne.mockResolvedValue(null);

    await expect(
      service.assertResultLabAccess('biz-1', 'user-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('asserts order access through booking assignment', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      bookingId: 'booking-1',
    });

    await expect(
      service.assertOrderLabAccess('biz-1', 'user-1', 'order-1'),
    ).resolves.toMatchObject({
      ctx: { employeeId: null },
      bookingAccess: { employeeId: 'emp-primary' },
    });
  });

  it('returns booking change-history access context', async () => {
    await expect(
      service.assertBookingLabChangeHistoryAccess(
        'biz-1',
        'user-1',
        'booking-1',
      ),
    ).resolves.toMatchObject({
      ctx: { employeeId: null },
      bookingAccess: { employeeId: 'emp-primary' },
    });
  });
});
