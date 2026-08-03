import { BookingStatus } from '../booking/entities/booking.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService today timeline (prov-exp-3.3)', () => {
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
  const retailPosService = { getBookingRetailSales: jest.fn() };
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

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      name: 'Maria',
      businessId: 'biz-1',
      isActive: true,
      userId: 'user-1',
    });
    memberRepo.find.mockResolvedValue([
      { userId: 'user-1', role: 'provider', businessId: 'biz-1' },
    ]);
    slotRepo.find.mockResolvedValue([]);
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { providerMobile: { showTodayTimeline: true } },
    });
  });

  it('returns todayTimeline on schedule summary', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-09T10:30:00.000Z'));

    bookingRepo.find.mockResolvedValue([
      {
        id: 'bk-1',
        startTime: new Date('2026-06-09T10:00:00.000Z'),
        endTime: new Date('2026-06-09T11:00:00.000Z'),
        status: BookingStatus.IN_PROGRESS,
        customer: { name: 'Jane Doe' },
      },
      {
        id: 'bk-2',
        startTime: new Date('2026-06-09T12:00:00.000Z'),
        endTime: new Date('2026-06-09T13:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Alex Kim' },
      },
    ]);

    const summary = await service.getScheduleSummary('biz-1', 'user-1', 14);

    expect(summary.todayTimeline?.enabled).toBe(true);
    expect(
      summary.todayTimeline?.segments.some((segment) => segment.kind === 'gap'),
    ).toBe(true);
    expect(summary.todayTimeline?.activeBookingId).toBe('bk-1');
    expect(summary.todayTimeline?.nextClient?.bookingId).toBe('bk-2');
    expect(summary.todayTimeline?.nextClient?.minutesUntilStart).toBe(90);

    jest.useRealTimers();
  });

  it('hides timeline segments when business setting is off', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { providerMobile: { showTodayTimeline: false } },
    });
    bookingRepo.find.mockResolvedValue([
      {
        id: 'bk-1',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3_600_000),
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Jane Doe' },
      },
    ]);

    const summary = await service.getScheduleSummary('biz-1', 'user-1', 14);

    expect(summary.todayTimeline?.enabled).toBe(false);
    expect(summary.todayTimeline?.segments).toEqual([]);
  });

  it('sums actual slot duration into availableMinutes, separate from the available count', async () => {
    bookingRepo.find.mockResolvedValue([]);
    slotRepo.find.mockResolvedValue([
      {
        startTime: new Date('2026-06-09T09:00:00.000Z'),
        endTime: new Date('2026-06-09T09:15:00.000Z'),
        status: 'available',
      },
      {
        startTime: new Date('2026-06-09T09:15:00.000Z'),
        endTime: new Date('2026-06-09T10:30:00.000Z'),
        status: 'available',
      },
      {
        startTime: new Date('2026-06-09T10:30:00.000Z'),
        endTime: new Date('2026-06-09T11:00:00.000Z'),
        status: 'booked',
      },
    ]);

    const summary = await service.getScheduleSummary('biz-1', 'user-1', 14);

    const day = summary.days.find((d) => d.date === '2026-06-09');
    expect(day?.available).toBe(2);
    expect(day?.availableMinutes).toBe(90);
    expect(day?.booked).toBe(1);
  });
});
