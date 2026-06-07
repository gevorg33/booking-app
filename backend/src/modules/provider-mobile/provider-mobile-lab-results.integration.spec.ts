import { ForbiddenException } from '@nestjs/common';
import {
  CLINIC_PROVIDER_RESULTS_LOOKBACK_DAYS,
  CLINIC_PROVIDER_RESULTS_QUEUE_STATUSES,
} from '../../common/utils/clinic-lab-state.util.js';
import * as clinicLabStateUtil from '../../common/utils/clinic-lab-state.util.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService lab results queue', () => {
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

  it('returns assigned-patient results scoped to the provider', async () => {
    clinicTestResultService.listResultQueue.mockResolvedValue([
      {
        id: 'result-1',
        status: 'Pending',
        testName: 'CBC',
        bookingId: 'booking-1',
      },
    ]);

    const result = await service.getProviderLabResultsQueue('biz-1', 'user-1');

    expect(result.labFeaturesEnabled).toBe(true);
    expect(result.lookbackDays).toBe(CLINIC_PROVIDER_RESULTS_LOOKBACK_DAYS);
    expect(result.results).toHaveLength(1);
    expect(clinicTestResultService.listResultQueue).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        employeeId: 'emp-1',
        statuses: [...CLINIC_PROVIDER_RESULTS_QUEUE_STATUSES],
        from: expect.any(String),
        to: expect.any(String),
      }),
    );
  });

  it('passes the rolling booking window to listResultQueue', async () => {
    const window = {
      from: '2026-05-08T00:00:00.000Z',
      to: '2026-06-07T23:59:59.999Z',
    };
    jest
      .spyOn(clinicLabStateUtil, 'buildClinicProviderResultsQueueWindow')
      .mockReturnValue(window);
    clinicTestResultService.listResultQueue.mockResolvedValue([]);

    await service.getProviderLabResultsQueue('biz-1', 'user-1');

    expect(clinicTestResultService.listResultQueue).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining(window),
    );
    jest.restoreAllMocks();
  });

  it('returns an empty queue for non-clinic businesses without querying results', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });

    const result = await service.getProviderLabResultsQueue('biz-1', 'user-1');

    expect(result.labFeaturesEnabled).toBe(false);
    expect(result.results).toEqual([]);
    expect(clinicTestResultService.listResultQueue).not.toHaveBeenCalled();
  });

  it('rejects users without provider or manager access', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    employeeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getProviderLabResultsQueue('biz-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns team-wide results for manager view mode', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-manager',
      name: 'Manager',
      userId: 'user-1',
      isActive: true,
    });
    clinicTestResultService.listResultQueue.mockResolvedValue([]);

    await service.getProviderLabResultsQueue('biz-1', 'user-1');

    expect(clinicTestResultService.listResultQueue).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        employeeId: undefined,
      }),
    );
  });
});
