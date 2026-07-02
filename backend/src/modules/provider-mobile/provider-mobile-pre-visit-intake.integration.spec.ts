import { BookingStatus } from '../booking/entities/booking.entity.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { CLINIC_QUESTIONNAIRE_FLOW_FIXTURES } from '../clinic-questionnaires/clinic-questionnaire.fixtures.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService pre-visit intake summary (prov-exp-1.5)', () => {
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
  const retailPosService = { getBookingRetailSales: jest.fn() };
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
  const notificationsService = { sendReviewRequest: jest.fn() };
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

  const labBooking = {
    id: 'bk-lab',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    customerId: 'cust-1',
    status: BookingStatus.CONFIRMED,
    paymentStatus: 'pending',
    startTime: new Date('2026-06-21T10:00:00.000Z'),
    endTime: new Date('2026-06-21T10:30:00.000Z'),
    updatedAt: new Date('2026-06-21T09:00:00.000Z'),
    customer: { id: 'cust-1', name: 'Jane Doe' },
    service: {
      id: 'svc-lab',
      name: 'CBC Panel',
      metadata: { serviceType: 'lab_test' },
    },
    employee: linkedEmployee,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'polyclinic' },
    });
    employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    bookingRepo.findOne.mockResolvedValue(labBooking);
    retailPosService.getBookingRetailSales.mockResolvedValue({
      lines: [],
      subtotal: 0,
      total: 0,
    });
    clinicPreVisitIntakeService.hasPublishedIntakeQuestionnaire.mockResolvedValue(
      true,
    );
  });

  it('returns hidden when intake is not enabled for the service', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...labBooking,
      service: {
        id: 'svc-cut',
        name: 'Haircut',
        metadata: {},
      },
    });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    clinicPreVisitIntakeService.hasPublishedIntakeQuestionnaire.mockResolvedValue(
      false,
    );
    intakeRepo.find.mockResolvedValue([]);

    const summary = await service.getBookingPreVisitIntakeSummary(
      'biz-1',
      'user-1',
      'bk-lab',
    );

    expect(summary.visible).toBe(false);
    expect(summary.dashboardFullAnswers).toBeNull();
  });

  it('returns pending summary when lab service offers intake but none assigned', async () => {
    intakeRepo.find.mockResolvedValue([]);

    const summary = await service.getBookingPreVisitIntakeSummary(
      'biz-1',
      'user-1',
      'bk-lab',
    );

    expect(summary).toMatchObject({
      visible: true,
      status: 'none',
      intakeId: null,
      answers: [],
    });
    expect(summary.dashboardFullAnswers?.canOpen).toBe(true);
  });

  it('returns answer rows for a completed booking intake', async () => {
    intakeRepo.find.mockResolvedValue([
      {
        id: 'intake-1',
        businessId: 'biz-1',
        bookingId: 'bk-lab',
        questionnaireId: 'quest-1',
        responseId: 'resp-1',
        status: 'completed',
        completedAt: new Date('2026-06-20T18:00:00.000Z'),
      },
    ]);
    questionnairesService.getPublishedQuestionnaireOrThrow.mockResolvedValue({
      id: 'quest-1',
      title: 'Pre-visit intake',
      code: 'pre-visit-intake',
      revision: 1,
    });
    questionnairesService.loadFlowContext.mockResolvedValue(
      CLINIC_QUESTIONNAIRE_FLOW_FIXTURES.referralIntake,
    );
    questionnaireEngineService.getResponseFlow.mockResolvedValue({
      answers: {
        'q-referral': ['yes'],
        'q-referrer-name': ['Dr Smith'],
      },
      status: 'completed',
    });

    const summary = await service.getBookingPreVisitIntakeSummary(
      'biz-1',
      'user-1',
      'bk-lab',
    );

    expect(summary.visible).toBe(true);
    expect(summary.questionnaireTitle).toBe('Pre-visit intake');
    expect(summary.answers.length).toBeGreaterThan(0);
    expect(summary.answers[0]?.answerText).toBe('Yes');
    expect(summary.dashboardFullAnswers).toMatchObject({
      path: '/dashboard/bookings?bookingId=bk-lab',
      intakeId: 'intake-1',
      canOpen: true,
    });
  });

  it('hides dashboard link for staff without manager role', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    intakeRepo.find.mockResolvedValue([]);

    const summary = await service.getBookingPreVisitIntakeSummary(
      'biz-1',
      'user-1',
      'bk-lab',
    );

    expect(summary.dashboardFullAnswers?.canOpen).toBe(false);
  });
});
