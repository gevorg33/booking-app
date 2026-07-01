import { BookingStatus } from '../booking/entities/booking.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService booking checkout context (prov-exp-1.4)', () => {
  const employeeRepo = { findOne: jest.fn(), save: jest.fn() };
  const memberRepo = { find: jest.fn() };
  const bookingRepo = { findOne: jest.fn(), find: jest.fn(), count: jest.fn() };
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
  };
  const llm = { isAvailableForBusiness: jest.fn(), completeJson: jest.fn() };
  const clinicTestOrderService = { listLabQueue: jest.fn() };
  const clinicTestResultService = { listResultQueue: jest.fn() };
  const customerRepo = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
  const reviewRepo = {
    find: jest.fn(),
    exists: jest.fn().mockResolvedValue(false),
  };
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
    getProviderStatus: jest.fn().mockReturnValue({
      emailConfigured: true,
      smsConfigured: true,
      whatsappConfigured: true,
      whatsappSource: 'platform',
      whatsappUsingPlatformDefault: true,
    }),
  };
  const reviewsService = { ensureReviewToken: jest.fn() };
  const pushService = {
    isConfigured: true,
    sendToUser: jest.fn().mockResolvedValue(1),
  };

  const service = new ProviderMobileService(
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

  const linkedEmployee = {
    id: 'emp-1',
    name: 'Alex Provider',
    userId: 'user-1',
    businessId: 'biz-1',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    businessService.findOne.mockResolvedValue({ id: 'biz-1', settings: {} });
    employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    retailPosService.getBookingRetailSales.mockResolvedValue({
      lines: [],
      subtotal: 0,
      total: 0,
    });
    retailPosService.hasConfiguredRetailProducts.mockResolvedValue(false);
    bookingRepo.find.mockResolvedValue([]);
    customerSubscriptionRepo.findOne.mockResolvedValue(null);
    multiServiceGroupRepo.findOne.mockResolvedValue(null);
  });

  it('includes package, subscription, and multi-service badges on booking detail', async () => {
    const bookingRecord = {
      id: 'bk-1',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      packagePurchaseId: 'purchase-1',
      multiServiceGroupId: 'group-1',
      status: BookingStatus.CONFIRMED,
      paymentStatus: 'not_applicable',
      startTime: new Date('2026-06-01T10:00:00.000Z'),
      endTime: new Date('2026-06-01T11:00:00.000Z'),
      updatedAt: new Date('2026-06-01T09:00:00.000Z'),
      metadata: {
        packageId: 'pkg-1',
        packageName: 'Glow package',
        subscriptionId: 'sub-1',
      },
      customer: { id: 'cust-1', name: 'Jane Doe' },
      service: { id: 'svc-1', name: 'Facial', price: 80, currency: 'USD' },
      employee: linkedEmployee,
    };

    bookingRepo.findOne.mockResolvedValue(bookingRecord);
    bookingRepo.find.mockImplementation(async ({ where }: any) => {
      if (where.packagePurchaseId) {
        return [
          bookingRecord,
          {
            ...bookingRecord,
            id: 'bk-2',
            startTime: new Date('2026-06-01T11:00:00.000Z'),
            service: { name: 'Massage' },
          },
        ];
      }
      if (where.multiServiceGroupId) {
        return [
          bookingRecord,
          {
            ...bookingRecord,
            id: 'bk-2',
            startTime: new Date('2026-06-01T11:00:00.000Z'),
            service: { name: 'Massage' },
          },
        ];
      }
      return [];
    });
    customerSubscriptionRepo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'active',
      appointmentsRemaining: 4,
      appointmentsIncluded: 6,
      plan: { name: 'Monthly glow' },
    });
    multiServiceGroupRepo.findOne.mockResolvedValue({
      id: 'group-1',
      schedulingMode: 'same_visit',
      totalDurationMinutes: 90,
      totalPrice: 120,
      currency: 'USD',
    });

    const detail = await service.getBookingDetail('biz-1', 'user-1', 'bk-1');

    expect(detail.checkoutContext?.package).toMatchObject({
      packageName: 'Glow package',
      serviceIndex: 1,
      serviceTotal: 2,
    });
    expect(detail.checkoutContext?.subscription).toMatchObject({
      planName: 'Monthly glow',
      appointmentsRemaining: 4,
      isActive: true,
    });
    expect(detail.checkoutContext?.multiService?.serviceCount).toBe(2);
  });
});
