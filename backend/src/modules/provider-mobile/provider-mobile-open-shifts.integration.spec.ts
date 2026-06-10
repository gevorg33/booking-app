import { ForbiddenException } from '@nestjs/common';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService open shifts (prov-exp-7.3)', () => {
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
      settings: { providerOpenShifts: { enabled: true } },
    });
    schedulingPeriodRepo.find.mockResolvedValue([
      {
        startTime: new Date('2026-06-09T10:00:00.000Z'),
        endTime: new Date('2026-06-09T11:00:00.000Z'),
      },
    ]);
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

  it('includes openShiftsEnabled in provider context when admin enabled', async () => {
    const context = await service.getContext('biz-1', 'user-1');
    expect(context.openShiftsEnabled).toBe(true);
  });

  it('lists schedule gaps over 30 minutes for provider view', async () => {
    const result = await service.listScheduleGaps(
      'biz-1',
      'user-1',
      '2026-06-09',
    );

    expect(result.date).toBe('2026-06-09');
    expect(result.minGapMinutes).toBe(30);
    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.gaps.every((gap) => gap.durationMinutes > 30)).toBe(true);
  });

  it('rejects when feature disabled', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {},
    });

    await expect(
      service.listScheduleGaps('biz-1', 'user-1', '2026-06-09'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects manager team view without own employee scope', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.listScheduleGaps('biz-1', 'user-1', '2026-06-09'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
