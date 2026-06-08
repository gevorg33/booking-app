import { ForbiddenException } from '@nestjs/common';
import { CLINIC_PROVIDER_COLLECTION_QUEUE_STATUSES } from '../../common/utils/clinic-lab-state.util.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService lab collection queue', () => {
  const employeeRepo = { findOne: jest.fn() };
  const memberRepo = { find: jest.fn() };
  const bookingRepo = { findOne: jest.fn(), find: jest.fn() };
  const slotRepo = { find: jest.fn() };
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(),
  };
  const bookingService = { update: jest.fn(), cancel: jest.fn() };
  const retailPosService = { getBookingRetailSales: jest.fn() };
  const llm = { isAvailableForBusiness: jest.fn(), completeJson: jest.fn() };
  const clinicTestOrderService = { listLabQueue: jest.fn() };
  const clinicTestResultService = { listResultQueue: jest.fn() };
  const customerRepo = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
  const patientClinicalProfilesService = { getProfileForCustomer: jest.fn() };
  const patientClinicalProfileAccessService = {
    assertCustomerClinicalProfileAccess: jest.fn(),
  };
  const clinicTasksService = {
    listClinicTasks: jest.fn(),
    claimClinicTask: jest.fn(),
    completeClinicTask: jest.fn(),
  };

  const service = new ProviderMobileService(
    employeeRepo as any,
    memberRepo as any,
    bookingRepo as any,
    slotRepo as any,
    businessService as any,
    bookingService as any,
    retailPosService as any,
    llm as any,
    clinicTestOrderService as any,
    clinicTestResultService as any,
    customerRepo as any,
    { find: jest.fn() } as any,
    patientClinicalProfilesService as any,
    patientClinicalProfileAccessService as any,
    clinicTasksService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'polyclinic' },
    });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      name: 'Dr Smith',
      userId: 'user-1',
      isActive: true,
    });
  });

  it('returns today collection orders scoped to the assigned provider', async () => {
    clinicTestOrderService.listLabQueue.mockResolvedValue([
      {
        id: 'order-1',
        status: 'NotCollected',
        displayNames: 'CBC',
        bookingId: 'booking-1',
      },
    ]);

    const result = await service.getTodayLabCollectionQueue('biz-1', 'user-1');

    expect(result.labFeaturesEnabled).toBe(true);
    expect(result.orders).toHaveLength(1);
    expect(clinicTestOrderService.listLabQueue).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        employeeId: 'emp-1',
        statuses: [...CLINIC_PROVIDER_COLLECTION_QUEUE_STATUSES],
        sort: 'bookingTimeAsc',
      }),
    );
  });

  it('returns an empty queue for non-clinic businesses without querying orders', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });

    const result = await service.getTodayLabCollectionQueue('biz-1', 'user-1');

    expect(result.labFeaturesEnabled).toBe(false);
    expect(result.orders).toEqual([]);
    expect(clinicTestOrderService.listLabQueue).not.toHaveBeenCalled();
  });

  it('exposes labFeaturesEnabled on provider context', async () => {
    const context = await service.getContext('biz-1', 'user-1');
    expect(context.labFeaturesEnabled).toBe(true);
  });

  it('rejects users without provider or manager access', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    employeeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getTodayLabCollectionQueue('biz-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns team-wide collection orders for manager view mode', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-manager',
      name: 'Manager',
      userId: 'user-1',
      isActive: true,
    });
    clinicTestOrderService.listLabQueue.mockResolvedValue([]);

    await service.getTodayLabCollectionQueue('biz-1', 'user-1');

    expect(clinicTestOrderService.listLabQueue).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        employeeId: undefined,
        sort: 'bookingTimeAsc',
      }),
    );
  });
});
