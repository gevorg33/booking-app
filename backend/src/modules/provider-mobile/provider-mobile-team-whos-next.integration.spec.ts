import { ForbiddenException } from '@nestjs/common';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService team whos next (prov-exp-4.3)', () => {
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
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue(null);
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-09T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns ordered provider queues for the next 2 hours', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'bk-1',
        startTime: new Date('2026-06-09T10:30:00.000Z'),
        endTime: new Date('2026-06-09T11:30:00.000Z'),
        status: BookingStatus.CONFIRMED,
        checkedInAt: null,
        metadata: {},
        notes: null,
        updatedAt: new Date(),
        service: { id: 'svc-1', name: 'Cut', price: 50, currency: 'USD' },
        customer: { id: 'cust-1', name: 'Jane', phone: null, email: null },
        employee: { id: 'emp-1', name: 'Alex' },
      },
      {
        id: 'bk-2',
        startTime: new Date('2026-06-09T11:00:00.000Z'),
        endTime: new Date('2026-06-09T12:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
        checkedInAt: null,
        metadata: {},
        notes: null,
        updatedAt: new Date(),
        service: { id: 'svc-2', name: 'Color', price: 80, currency: 'USD' },
        customer: { id: 'cust-2', name: 'Sam', phone: null, email: null },
        employee: { id: 'emp-2', name: 'Zara' },
      },
      {
        id: 'bk-3',
        startTime: new Date('2026-06-09T13:30:00.000Z'),
        endTime: new Date('2026-06-09T14:30:00.000Z'),
        status: BookingStatus.CONFIRMED,
        checkedInAt: null,
        metadata: {},
        notes: null,
        updatedAt: new Date(),
        service: { id: 'svc-3', name: 'Trim', price: 40, currency: 'USD' },
        customer: { id: 'cust-3', name: 'Lee', phone: null, email: null },
        employee: { id: 'emp-1', name: 'Alex' },
      },
    ]);

    const queue = await service.getTeamWhosNext('biz-1', 'mgr-1');

    expect(queue.windowHours).toBe(2);
    expect(queue.totalQueued).toBe(2);
    expect(queue.columns).toHaveLength(2);
    expect(queue.columns[0]?.nextBookingId).toBe('bk-1');
    expect(queue.columns[1]?.nextBookingId).toBe('bk-2');
    expect(queue.columns[0]?.queue.map((item) => item.id)).toEqual(['bk-1']);
  });

  it('rejects team queue for provider-only access', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      name: 'Alex',
      businessId: 'biz-1',
      isActive: true,
      userId: 'user-1',
    });

    await expect(
      service.getTeamWhosNext('biz-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
