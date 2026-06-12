import { ForbiddenException } from '@nestjs/common';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService self block (prov-exp-7.1)', () => {
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
  const blockScheduleService = { create: jest.fn() };
  const providerTimeOffService = { listForEmployee: jest.fn() };
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
      settings: { providerSelfBlock: { enabled: true } },
    });
    blockScheduleService.create.mockResolvedValue({
      id: 'block-1',
      placeholderLabel: 'Lunch',
      singleStartTime: '2026-06-20T12:00:00.000Z',
      singleEndTime: '2026-06-20T13:00:00.000Z',
    });
    retailPosService.hasConfiguredRetailProducts.mockResolvedValue(false);

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
      blockScheduleService as any,
      providerTimeOffService as any,
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

  it('includes selfBlockEnabled in provider context when admin enabled', async () => {
    const context = await service.getContext('biz-1', 'user-1');
    expect(context.selfBlockEnabled).toBe(true);
  });

  it('hides selfBlockEnabled when admin disabled feature', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { providerSelfBlock: { enabled: false } },
    });
    const context = await service.getContext('biz-1', 'user-1');
    expect(context.selfBlockEnabled).toBe(false);
  });

  it('creates a one-off lunch block on own calendar', async () => {
    const result = await service.createProviderSelfBlock('biz-1', 'user-1', {
      date: '2026-06-20',
      startTime: '12:00',
      endTime: '13:00',
      placeholder: 'Lunch',
    });

    expect(blockScheduleService.create).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        employeeId: 'emp-1',
        placeholder: 'Lunch',
        isRepetitive: false,
        singleBlock: {
          startTime: '2026-06-20T12:00:00.000Z',
          endTime: '2026-06-20T13:00:00.000Z',
        },
      }),
      'user-1',
    );
    expect(result).toEqual({
      id: 'block-1',
      placeholder: 'Lunch',
      startTime: '2026-06-20T12:00:00.000Z',
      endTime: '2026-06-20T13:00:00.000Z',
      employeeId: 'emp-1',
    });
  });

  it('rejects when feature disabled', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {},
    });

    await expect(
      service.createProviderSelfBlock('biz-1', 'user-1', {
        date: '2026-06-09',
        startTime: '12:00',
        endTime: '13:00',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects team manager view without own employee scope', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.createProviderSelfBlock('biz-1', 'user-1', {
        date: '2026-06-09',
        startTime: '12:00',
        endTime: '13:00',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
