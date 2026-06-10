import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService customer contact (prov-exp-6.1)', () => {
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

  const bookingRecord = {
    id: 'bk-1',
    businessId: 'biz-1',
    status: 'confirmed',
    paymentStatus: 'pending',
    startTime: new Date('2026-06-09T14:00:00.000Z'),
    endTime: new Date('2026-06-09T15:00:00.000Z'),
    metadata: {},
    customer: {
      id: 'cust-1',
      name: 'Alex',
      phone: '+15551234567',
      email: 'alex@example.com',
    },
    service: { id: 'svc-1', name: 'Cut', price: 40 },
    employee: { id: 'emp-1', name: 'Sam' },
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
      name: 'Sam',
    });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        notifications: { whatsappEnabled: true },
      },
    });
    bookingRepo.findOne.mockResolvedValue({
      ...bookingRecord,
      employeeId: 'emp-1',
      metadata: {},
      updatedAt: new Date('2026-06-09T12:00:00.000Z'),
    });
    retailPosService.hasConfiguredRetailProducts.mockResolvedValue(false);
    retailPosService.getBookingRetailSales.mockResolvedValue({
      lines: [],
      retailTotal: 0,
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

  it('includes whatsappContactEnabled in provider context when configured', async () => {
    const context = await service.getContext('biz-1', 'user-1');
    expect(context.whatsappContactEnabled).toBe(true);
    expect(notificationsService.getProviderStatus).toHaveBeenCalled();
  });

  it('includes customerContact on booking detail when customer has phone', async () => {
    const detail = await service.getBookingDetail('biz-1', 'user-1', 'bk-1');
    expect(detail.customerContact).toEqual({
      phone: '+15551234567',
      callEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
    });
  });

  it('hides whatsapp on booking detail when admin disabled WhatsApp', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {
        notifications: { whatsappEnabled: false },
      },
    });
    const detail = await service.getBookingDetail('biz-1', 'user-1', 'bk-1');
    expect(detail.customerContact?.whatsappEnabled).toBe(false);
    expect(detail.customerContact?.callEnabled).toBe(true);
  });

  it('includes resolved staff message templates when feature enabled', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {
        notifications: { whatsappEnabled: true },
        staffMessageTemplates: { enabled: true, templates: [] },
      },
    });
    const detail = await service.getBookingDetail('biz-1', 'user-1', 'bk-1');
    expect(detail.staffMessageTemplates).toHaveLength(2);
    expect(detail.staffMessageTemplates?.[0]?.body).toContain('Alex');
    expect(detail.staffMessageTemplates?.[0]?.label).toBe('Running late');
  });

  it('exposes staffMessageTemplatesEnabled on provider context', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        staffMessageTemplates: { enabled: true, templates: [] },
      },
    });
    const context = await service.getContext('biz-1', 'user-1');
    expect(context.staffMessageTemplatesEnabled).toBe(true);
  });
});
