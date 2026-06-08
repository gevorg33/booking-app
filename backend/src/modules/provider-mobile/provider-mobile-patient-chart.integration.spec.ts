import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProviderMobileService } from './provider-mobile.service.js';

function buildService(
  overrides: {
    employeeRepo?: Record<string, jest.Mock>;
    bookingRepo?: Record<string, jest.Mock>;
    businessService?: Record<string, jest.Mock>;
    customerRepo?: Record<string, jest.Mock>;
    clinicTestOrderService?: Record<string, jest.Mock>;
    clinicTestResultService?: Record<string, jest.Mock>;
    patientClinicalProfilesService?: Record<string, jest.Mock>;
    patientClinicalProfileAccessService?: Record<string, jest.Mock>;
  } = {},
) {
  const employeeRepo = {
    findOne: jest.fn(),
    ...overrides.employeeRepo,
  };
  const memberRepo = { find: jest.fn() };
  const bookingRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    ...overrides.bookingRepo,
  };
  const slotRepo = { find: jest.fn() };
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(),
    ...overrides.businessService,
  };
  const bookingService = { update: jest.fn(), cancel: jest.fn() };
  const retailPosService = { getBookingRetailSales: jest.fn() };
  const llm = { isAvailableForBusiness: jest.fn(), completeJson: jest.fn() };
  const clinicTestOrderService = {
    listLabQueue: jest.fn(),
    ...overrides.clinicTestOrderService,
  };
  const clinicTestResultService = {
    listResultQueue: jest.fn(),
    ...overrides.clinicTestResultService,
  };
  const customerRepo = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    ...overrides.customerRepo,
  };
  const reviewRepo = { find: jest.fn() };
  const patientClinicalProfilesService = {
    getProfileForCustomer: jest.fn(),
    ...overrides.patientClinicalProfilesService,
  };
  const patientClinicalProfileAccessService = {
    assertCustomerClinicalProfileAccess: jest.fn(),
    ...overrides.patientClinicalProfileAccessService,
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
    reviewRepo as any,
    patientClinicalProfilesService as any,
    patientClinicalProfileAccessService as any,
    clinicTasksService as any,
  );

  return {
    service,
    employeeRepo,
    bookingRepo,
    businessService,
    customerRepo,
    clinicTestOrderService,
    clinicTestResultService,
    patientClinicalProfilesService,
    patientClinicalProfileAccessService,
  };
}

describe('ProviderMobileService patient chart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty patient search for non-clinic businesses', async () => {
    const { service, businessService, customerRepo, employeeRepo } =
      buildService();
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      name: 'Dr Smith',
      userId: 'user-1',
      isActive: true,
    });

    const result = await service.searchProviderPatients(
      'biz-1',
      'user-1',
      'Jane',
    );

    expect(result.labFeaturesEnabled).toBe(false);
    expect(result.patients).toEqual([]);
    expect(customerRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('scopes provider patient search to assigned customers', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'cust-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '555',
        },
      ]),
    };
    const {
      service,
      businessService,
      employeeRepo,
      bookingRepo,
      customerRepo,
    } = buildService({
      customerRepo: { createQueryBuilder: jest.fn(() => qb) },
    });

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
    bookingRepo.find.mockResolvedValue([
      {
        customerId: 'cust-1',
        employeeId: 'emp-1',
        linkedEmployeeIds: [],
      },
      {
        customerId: 'cust-2',
        employeeId: 'emp-2',
        linkedEmployeeIds: [],
      },
    ]);

    const result = await service.searchProviderPatients(
      'biz-1',
      'user-1',
      'Jane',
    );

    expect(result.patients).toHaveLength(1);
    expect(qb.andWhere).toHaveBeenCalledWith(
      'customer.id IN (:...scopedCustomerIds)',
      { scopedCustomerIds: ['cust-1'] },
    );
  });

  it('returns chart summary with clinical profile and today lab activity', async () => {
    const {
      service,
      businessService,
      employeeRepo,
      customerRepo,
      clinicTestOrderService,
      clinicTestResultService,
      patientClinicalProfilesService,
      patientClinicalProfileAccessService,
    } = buildService();

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
    patientClinicalProfileAccessService.assertCustomerClinicalProfileAccess.mockResolvedValue(
      {
        ctx: { userId: 'user-1', membershipRole: 'staff', employeeId: 'emp-1' },
        phiAccess: { hasAssignedBooking: true },
      },
    );
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555',
    });
    patientClinicalProfilesService.getProfileForCustomer.mockResolvedValue({
      id: 'profile-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      allergies: 'Penicillin',
      chronicProblems: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      emergencyContactRelationship: null,
      bloodType: 'O+',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    });
    clinicTestOrderService.listLabQueue.mockResolvedValue([
      {
        id: 'order-1',
        status: 'NotCollected',
        displayNames: 'CBC',
        department: 'Hematology',
        bookingId: 'booking-1',
        customerName: 'Jane Doe',
        bookingStartTime: '2026-06-07T10:00:00.000Z',
        employeeName: 'Dr Smith',
        createdAt: new Date('2026-06-07T09:00:00.000Z'),
      },
    ]);
    clinicTestResultService.listResultQueue.mockResolvedValue([
      {
        id: 'result-1',
        status: 'Pending',
        testName: 'CBC',
        orderId: 'order-1',
        orderStatus: 'Collected',
        bookingId: 'booking-1',
        customerName: 'Jane Doe',
        bookingStartTime: '2026-06-07T10:00:00.000Z',
        employeeName: 'Dr Smith',
        department: 'Hematology',
        measurementFlag: 'Normal',
        completedAt: null,
        reviewedAt: null,
        releasedAt: null,
        createdAt: new Date('2026-06-07T11:00:00.000Z'),
      },
    ]);

    const result = await service.getProviderPatientChartSummary(
      'biz-1',
      'user-1',
      'cust-1',
    );

    expect(result.canAccessChart).toBe(true);
    expect(result.customer?.name).toBe('Jane Doe');
    expect(result.clinicalProfile?.allergies).toBe('Penicillin');
    expect(result.todaysOrders).toHaveLength(1);
    expect(result.todaysResults).toHaveLength(1);
    expect(clinicTestOrderService.listLabQueue).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        customerId: 'cust-1',
        sort: 'bookingTimeAsc',
      }),
    );
    expect(clinicTestResultService.listResultQueue).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        customerId: 'cust-1',
      }),
    );
  });

  it('rejects chart summary when clinical profile access is denied', async () => {
    const {
      service,
      businessService,
      employeeRepo,
      patientClinicalProfileAccessService,
    } = buildService();

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
    patientClinicalProfileAccessService.assertCustomerClinicalProfileAccess.mockRejectedValue(
      new ForbiddenException(
        'You do not have access to this patient clinical profile',
      ),
    );

    await expect(
      service.getProviderPatientChartSummary('biz-1', 'user-1', 'cust-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns disabled chart summary payload for non-clinic businesses', async () => {
    const {
      service,
      businessService,
      employeeRepo,
      patientClinicalProfileAccessService,
    } = buildService();

    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      name: 'Dr Smith',
      userId: 'user-1',
      isActive: true,
    });

    const result = await service.getProviderPatientChartSummary(
      'biz-1',
      'user-1',
      'cust-1',
    );

    expect(result.labFeaturesEnabled).toBe(false);
    expect(result.canAccessChart).toBe(false);
    expect(
      patientClinicalProfileAccessService.assertCustomerClinicalProfileAccess,
    ).not.toHaveBeenCalled();
  });

  it('throws when chart summary customer is missing', async () => {
    const {
      service,
      businessService,
      employeeRepo,
      customerRepo,
      patientClinicalProfileAccessService,
    } = buildService();

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
    patientClinicalProfileAccessService.assertCustomerClinicalProfileAccess.mockResolvedValue(
      {
        ctx: { userId: 'user-1', membershipRole: 'staff', employeeId: 'emp-1' },
        phiAccess: { hasAssignedBooking: true },
      },
    );
    customerRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getProviderPatientChartSummary('biz-1', 'user-1', 'cust-missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
