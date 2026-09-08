import { ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { ClinicLabAccessService } from './shared/clinic-lab-access.service.js';
import { ClinicTestResultsService } from './clinic-test-results.service.js';

describe('Clinic lab API privacy (integration)', () => {
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(),
  };
  const employeeRepo = { findOne: jest.fn() };
  const bookingRepo = { findOne: jest.fn() };
  const orderRepo = { find: jest.fn() };
  const resultRepo = { find: jest.fn(), findOne: jest.fn() };
  const observationRepo = { find: jest.fn() };
  const specimenRepo = { find: jest.fn(), findOne: jest.fn() };

  const accessService = new ClinicLabAccessService(
    businessService as any,
    employeeRepo as any,
    bookingRepo as any,
    specimenRepo as any,
    resultRepo as any,
  
    undefined as never);
  const resultsService = new ClinicTestResultsService(
    businessService as any,
    orderRepo as any,
    resultRepo as any,
    observationRepo as any,
    specimenRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    });
    bookingRepo.findOne.mockResolvedValue({
      id: 'booking-1',
      employeeId: 'emp-primary',
      linkedEmployeeIds: [],
    });
  });

  it('blocks provider from booking lab summaries on unassigned bookings', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-other', isActive: true });

    await expect(
      accessService.assertBookingLabAccess('biz-1', 'user-1', 'booking-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(orderRepo.find).not.toHaveBeenCalled();
  });

  it('returns only released results for the authenticated patient', async () => {
    resultRepo.find.mockResolvedValue([
      {
        id: 'result-1',
        orderId: 'order-1',
        bookingId: 'booking-1',
        status: 'Released',
        measurementFlag: 'Normal',
        releasedAt: new Date('2026-06-01T12:00:00.000Z'),
        order: { displayNames: 'CBC' },
        testType: null,
        measurements: [],
      },
    ]);

    await expect(
      resultsService.listReleasedResultsForCustomer('biz-1', 'cust-1'),
    ).resolves.toEqual([
      {
        id: 'result-1',
        orderId: 'order-1',
        bookingId: 'booking-1',
        status: 'Released',
        testName: 'CBC',
        measurementFlag: 'Normal',
        releasedAt: '2026-06-01T12:00:00.000Z',
        measurements: [],
      },
    ]);

    expect(resultRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          businessId: 'biz-1',
          customerId: 'cust-1',
          status: 'Released',
        },
      }),
    );
  });

  it('allows manager to list lab queue without employee filter', async () => {
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-manager',
      isActive: true,
    });

    await expect(
      accessService.scopeLabQueueFilters('biz-1', 'user-1', {
        status: 'NotCollected',
      }),
    ).resolves.toEqual({ status: 'NotCollected' });
  });
});
