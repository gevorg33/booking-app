import { ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { PatientChartService } from './patient-chart.service.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';

describe('Patient chart (integration)', () => {
  const businessService = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    })),
    ensureMember: jest.fn(async () => ({ role: MemberRole.STAFF })),
  };
  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-provider', isActive: true })),
  };
  const customerRepo = {
    findOne: jest.fn(async () => ({ id: 'cust-1' })),
  };
  const bookingRepo = {
    find: jest.fn(async () => [
      { employeeId: 'emp-provider', linkedEmployeeIds: [] },
    ]),
  };
  const orderService = {
    listOrdersForCustomer: jest.fn(async () => [
      {
        id: 'order-1',
        bookingId: 'booking-1',
        status: 'AwaitingResults',
        displayNames: 'CBC panel',
        createdAt: '2026-06-01T10:00:00.000Z',
      },
    ]),
  };
  const resultService = {
    listResultsForCustomer: jest.fn(async () => [
      {
        id: 'result-1',
        bookingId: 'booking-1',
        orderId: 'order-1',
        status: 'Completed',
        testName: 'CBC panel',
        measurementFlag: 'Normal',
        completedAt: '2026-06-02T10:00:00.000Z',
        reviewedAt: null,
        releasedAt: null,
        createdAt: '2026-06-01T10:00:00.000Z',
      },
    ]),
  };
  const profilesService = {
    getProfileForCustomer: jest.fn(async () => ({
      allergies: 'Penicillin',
      chronicProblems: null,
      bloodType: null,
      phiMasked: false,
    })),
  };

  const accessService = new PatientClinicalProfileAccessService(
    businessService as any,
    employeeRepo as any,
    customerRepo as any,
    bookingRepo as any,
  );
  const chartService = new PatientChartService(
    businessService as any,
    accessService,
    profilesService as any,
    orderService as any,
    resultService as any,
    customerRepo as any,
    bookingRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
  });

  it('returns linked orders and results for assigned provider', async () => {
    const orders = await chartService.listOrdersForCustomer(
      'biz-1',
      'cust-1',
      'user-1',
    );
    const results = await chartService.listResultsForCustomer(
      'biz-1',
      'cust-1',
      'user-1',
    );

    expect(orders[0]?.displayNames).toBe('CBC panel');
    expect(results[0]?.status).toBe('Completed');
  });

  it('blocks unassigned provider from chart lab lists', async () => {
    bookingRepo.find.mockResolvedValueOnce([]);
    await expect(
      chartService.listOrdersForCustomer('biz-1', 'cust-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
