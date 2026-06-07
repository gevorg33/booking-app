import { ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { PatientChartService } from './patient-chart.service.js';

describe('PatientChartService', () => {
  const businessService = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    })),
  };
  const accessService = {
    assertCustomerClinicalProfileAccess: jest.fn(async () => ({
      ctx: {
        userId: 'user-1',
        membershipRole: MemberRole.MANAGER,
        employeeId: 'emp-1',
      },
      phiAccess: { hasAssignedBooking: false },
    })),
  };
  const profilesService = {
    getProfileForCustomer: jest.fn(async () => ({
      allergies: 'Penicillin',
      chronicProblems: null,
      bloodType: 'O+',
      phiMasked: false,
    })),
  };
  const orderService = {
    listOrdersForCustomer: jest.fn(async () => [
      {
        id: 'order-1',
        bookingId: 'booking-1',
        status: 'AwaitingResults',
        displayNames: 'CBC',
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
        testName: 'CBC',
        measurementFlag: null,
        completedAt: '2026-06-02T10:00:00.000Z',
        reviewedAt: null,
        releasedAt: null,
        createdAt: '2026-06-01T10:00:00.000Z',
      },
    ]),
  };
  const customerRepo = {
    findOne: jest.fn(async () => ({
      id: 'cust-1',
      name: 'Maria Lopez',
      businessId: 'biz-1',
      isActive: true,
    })),
  };
  const bookingRepo = {
    find: jest.fn(async () => [
      {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-01T10:00:00.000Z'),
        service: { name: 'Annual checkup' },
        employee: { name: 'Dr. Smith' },
      },
    ]),
  };

  const service = new PatientChartService(
    businessService as any,
    accessService as any,
    profilesService as any,
    orderService as any,
    resultService as any,
    customerRepo as any,
    bookingRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists chart orders after access check', async () => {
    const orders = await service.listOrdersForCustomer(
      'biz-1',
      'cust-1',
      'user-1',
    );
    expect(
      accessService.assertCustomerClinicalProfileAccess,
    ).toHaveBeenCalledWith('biz-1', 'user-1', 'cust-1');
    expect(orders).toHaveLength(1);
  });

  it('lists chart results after access check', async () => {
    const results = await service.listResultsForCustomer(
      'biz-1',
      'cust-1',
      'user-1',
    );
    expect(results[0]?.testName).toBe('CBC');
  });

  it('builds chart summary after access check', async () => {
    const summary = await service.getChartSummaryForCustomer(
      'biz-1',
      'cust-1',
      'user-1',
    );
    expect(summary.customerName).toBe('Maria Lopez');
    expect(summary.allergies).toBe('Penicillin');
    expect(summary.recentVisits).toHaveLength(1);
    expect(summary.pendingResults).toHaveLength(1);
    expect(summary.pendingOrders).toHaveLength(1);
  });

  it('blocks non-clinic tenants', async () => {
    businessService.findOne.mockResolvedValueOnce({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    await expect(
      service.listOrdersForCustomer('biz-1', 'cust-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
