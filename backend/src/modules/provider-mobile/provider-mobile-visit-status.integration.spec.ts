import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService visit status (prov-exp-3.2)', () => {
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
    sendProviderVisitStatusToCustomer: jest.fn().mockResolvedValue({
      smsSent: false,
      pushSent: false,
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

  const bookingRecord = {
    id: 'bk-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    status: BookingStatus.CONFIRMED,
    checkedInAt: null,
    metadata: {},
    startTime: new Date('2026-06-09T10:00:00.000Z'),
    endTime: new Date('2026-06-09T11:00:00.000Z'),
    customer: { id: 'cust-1', name: 'Jane Doe', phone: '+15551234567' },
    service: { id: 'svc-1', name: 'Haircut' },
    employee: linkedEmployee,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {},
    });
    employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    bookingRepo.findOne.mockResolvedValue({ ...bookingRecord });
    bookingRepo.save.mockImplementation(async (row) => row);
  });

  it('stores running late on booking metadata', async () => {
    const result = await service.markBookingRunningLate(
      'biz-1',
      'user-1',
      'bk-1',
      10,
    );

    expect(result.visitStatus.kind).toBe('running_late');
    expect(result.visitStatus.minutesLate).toBe(10);
    expect(bookingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          providerVisitStatus: expect.objectContaining({
            kind: 'running_late',
            minutesLate: 10,
          }),
        }),
      }),
    );
  });

  it('stores ready now on booking metadata', async () => {
    const result = await service.markBookingReadyNow('biz-1', 'user-1', 'bk-1');

    expect(result.visitStatus.kind).toBe('ready_now');
    expect(result.visitStatus.minutesLate).toBeUndefined();
  });

  it('exposes visit status on today bookings', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        ...bookingRecord,
        metadata: {
          providerVisitStatus: {
            kind: 'running_late',
            minutesLate: 10,
            markedAt: '2026-06-09T09:50:00.000Z',
          },
        },
        notes: null,
        updatedAt: new Date(),
        service: { id: 'svc-1', name: 'Haircut', price: 50, currency: 'USD' },
      },
    ]);

    const today = await service.getTodayBookings('biz-1', 'user-1');
    expect(today.bookings[0]?.visitStatus?.kind).toBe('running_late');
  });

  it('notifies customer when business setting enabled', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { providerMobile: { notifyCustomerOnVisitStatus: true } },
    });

    await service.markBookingReadyNow('biz-1', 'user-1', 'bk-1');

    expect(
      notificationsService.sendProviderVisitStatusToCustomer,
    ).toHaveBeenCalledWith(
      'bk-1',
      expect.objectContaining({
        kind: 'ready_now',
        providerName: 'Alex Provider',
      }),
    );
  });

  it('skips customer notify when setting disabled', async () => {
    await service.markBookingReadyNow('biz-1', 'user-1', 'bk-1');
    expect(
      notificationsService.sendProviderVisitStatusToCustomer,
    ).not.toHaveBeenCalled();
  });

  it('rejects visit status on completed bookings', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...bookingRecord,
      status: BookingStatus.COMPLETED,
    });

    await expect(
      service.markBookingRunningLate('biz-1', 'user-1', 'bk-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
