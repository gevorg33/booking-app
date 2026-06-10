import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService retail POS (prov-exp-5.1)', () => {
  const employeeRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
  const memberRepo = { find: jest.fn() };
  const bookingRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
  const slotRepo = { find: jest.fn() };
  const schedulingPeriodRepo = { find: jest.fn() };
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(),
  };
  const bookingService = { update: jest.fn(), cancel: jest.fn() };
  const bookingSlotResolver = {
    checkSlotAvailability: jest.fn(),
    describeUnavailable: jest.fn(),
  };
  const retailPosService = {
    getBookingRetailSales: jest.fn(),
    hasConfiguredRetailProducts: jest.fn(),
    listSellableProducts: jest.fn(),
    setBookingRetailSales: jest.fn(),
  };
  const llm = { isAvailableForBusiness: jest.fn(), completeJson: jest.fn() };
  const clinicTestOrderService = { listLabQueue: jest.fn() };
  const clinicTestResultService = { listResultQueue: jest.fn() };
  const customerRepo = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
  const reviewRepo = { find: jest.fn(), exists: jest.fn() };
  const patientClinicalProfilesService = { getProfileForCustomer: jest.fn() };
  const patientClinicalProfileAccessService = {
    assertCustomerClinicalProfileAccess: jest.fn(),
  };
  const clinicTasksService = {
    listClinicTasks: jest.fn(),
    claimClinicTask: jest.fn(),
    completeClinicTask: jest.fn(),
  };
  const loyaltyService = {
    getOrCreate: jest.fn(),
    getPublicSummary: jest.fn(),
  };
  const staffNotesService = {
    listNotesForCustomer: jest.fn(),
    createNoteForCustomer: jest.fn(),
  };
  const staffNoteAccessService = {
    resolveStaffContext: jest.fn(),
  };
  const multiServiceGroupRepo = { findOne: jest.fn() };
  const customerSubscriptionRepo = { findOne: jest.fn() };
  const intakeRepo = { find: jest.fn() };
  const clinicPreVisitIntakeService = {
    hasPublishedIntakeQuestionnaire: jest.fn(),
  };
  const questionnairesService = {
    getPublishedQuestionnaireOrThrow: jest.fn(),
    loadFlowContext: jest.fn(),
  };
  const questionnaireEngineService = {
    getResponseFlow: jest.fn(),
  };
  const notificationsService = {
    sendReviewRequest: jest.fn(),
    sendProviderVisitStatusToCustomer: jest.fn(),
    getProviderStatus: jest.fn().mockReturnValue({
      emailConfigured: true,
      smsConfigured: false,
      whatsappConfigured: false,
      whatsappSource: null,
      whatsappUsingPlatformDefault: false,
    }),
  };
  const reviewsService = { ensureReviewToken: jest.fn() };
  const pushService = {
    isConfigured: true,
    sendToUser: jest.fn().mockResolvedValue(1),
  };

  const bookingRecord = {
    id: 'bk-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    serviceId: 'svc-1',
    status: BookingStatus.CONFIRMED,
    checkedInAt: null,
    metadata: {},
    startTime: new Date('2026-06-09T14:00:00.000Z'),
    endTime: new Date('2026-06-09T15:00:00.000Z'),
    service: { id: 'svc-1', name: 'Cut', price: 50, currency: 'USD' },
    customer: { id: 'cust-1', name: 'Jane', phone: null, email: null },
    employee: { id: 'emp-1', name: 'Alex' },
    updatedAt: new Date('2026-06-09T12:00:00.000Z'),
  };

  let service: ProviderMobileService;

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      userId: 'user-1',
      businessId: 'biz-1',
      isActive: true,
      name: 'Alex',
    });
    bookingRepo.findOne.mockResolvedValue(bookingRecord);
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'USD' },
    });
    retailPosService.hasConfiguredRetailProducts.mockResolvedValue(true);
    retailPosService.listSellableProducts.mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Shampoo',
        sku: 'SH-1',
        retailPrice: 18,
        quantityOnHand: 5,
      },
    ]);
    retailPosService.getBookingRetailSales.mockResolvedValue({
      lines: [],
      retailTotal: 0,
      currency: 'USD',
    });
    retailPosService.setBookingRetailSales.mockResolvedValue({
      lines: [
        {
          id: 'sale-1',
          productId: 'prod-1',
          productName: 'Shampoo',
          quantity: 1,
          unitPrice: 18,
          lineTotal: 18,
        },
      ],
      retailTotal: 18,
      currency: 'USD',
    });
    reviewRepo.exists.mockResolvedValue(false);

    service = new ProviderMobileService(
      employeeRepo as any,
      memberRepo as any,
      bookingRepo as any,
      slotRepo as any,
      schedulingPeriodRepo as any,
      businessService as any,
      bookingService as any,
      bookingSlotResolver as any,
      retailPosService as any,
      { create: jest.fn() } as any,
      { createRequest: jest.fn(), listForEmployee: jest.fn() } as any,
      llm as any,
      clinicTestOrderService as any,
      clinicTestResultService as any,
      customerRepo as any,
      reviewRepo as any,
      patientClinicalProfilesService as any,
      patientClinicalProfileAccessService as any,
      clinicTasksService as any,
      loyaltyService as any,
      staffNotesService as any,
      staffNoteAccessService as any,
      multiServiceGroupRepo as any,
      customerSubscriptionRepo as any,
      intakeRepo as any,
      clinicPreVisitIntakeService as any,
      questionnairesService as any,
      questionnaireEngineService as any,
      notificationsService as any,
      reviewsService as any,
      pushService as any,
    );
  });

  it('includes retailPosEnabled in provider context when catalog exists', async () => {
    const context = await service.getContext('biz-1', 'user-1');
    expect(context.retailPosEnabled).toBe(true);
    expect(retailPosService.hasConfiguredRetailProducts).toHaveBeenCalledWith(
      'biz-1',
    );
  });

  it('lists in-stock retail products for provider', async () => {
    const result = await service.listProviderRetailProducts('biz-1', 'user-1');
    expect(result.products).toHaveLength(1);
    expect(retailPosService.listSellableProducts).toHaveBeenCalledWith('biz-1');
  });

  it('denies retail products when catalog is not configured', async () => {
    retailPosService.hasConfiguredRetailProducts.mockResolvedValue(false);
    await expect(
      service.listProviderRetailProducts('biz-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns booking retail sales for accessible booking', async () => {
    const checkout = await service.getProviderBookingRetailSales(
      'biz-1',
      'user-1',
      'bk-1',
    );
    expect(checkout.retailTotal).toBe(0);
    expect(retailPosService.getBookingRetailSales).toHaveBeenCalledWith(
      'biz-1',
      'bk-1',
    );
  });

  it('saves retail cart lines on accessible booking', async () => {
    const checkout = await service.setProviderBookingRetailSales(
      'biz-1',
      'user-1',
      'bk-1',
      { lines: [{ productId: 'prod-1', quantity: 1 }] },
    );
    expect(checkout.retailTotal).toBe(18);
    expect(retailPosService.setBookingRetailSales).toHaveBeenCalledWith(
      'biz-1',
      'bk-1',
      'user-1',
      { lines: [{ productId: 'prod-1', quantity: 1 }] },
    );
  });

  it('blocks retail cart save on cancelled booking', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...bookingRecord,
      status: BookingStatus.CANCELLED,
    });
    await expect(
      service.setProviderBookingRetailSales('biz-1', 'user-1', 'bk-1', {
        lines: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('includes retailPosEnabled on booking detail', async () => {
    const detail = await service.getBookingDetail('biz-1', 'user-1', 'bk-1');
    expect(detail.retailPosEnabled).toBe(true);
    expect(detail.paymentSummary).toBeDefined();
  });

  it('denies retail sales for inaccessible booking', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await expect(
      service.getProviderBookingRetailSales('biz-1', 'user-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
