import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService check-in (prov-exp-3.1)', () => {
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

  const bookingRecord = {
    id: 'bk-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    status: BookingStatus.CONFIRMED,
    checkedInAt: null,
    startTime: new Date('2026-06-09T10:00:00.000Z'),
    endTime: new Date('2026-06-09T11:00:00.000Z'),
    customer: { id: 'cust-1', name: 'Jane Doe' },
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
    memberRepo.find.mockResolvedValue([{ userId: 'mgr-1' }]);
  });

  it('sets checkedInAt and returns floor status', async () => {
    const result = await service.checkInBooking('biz-1', 'user-1', 'bk-1');

    expect(result.bookingId).toBe('bk-1');
    expect(result.checkedInAt).toEqual(expect.any(String));
    expect(result.floorStatus).toBe('checked_in');
    expect(bookingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        checkedInAt: expect.any(Date),
      }),
    );
  });

  it('includes floor status on today bookings', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        ...bookingRecord,
        checkedInAt: new Date('2026-06-09T09:55:00.000Z'),
        notes: null,
        updatedAt: new Date(),
        service: { id: 'svc-1', name: 'Haircut', price: 50, currency: 'USD' },
      },
      {
        ...bookingRecord,
        id: 'bk-2',
        checkedInAt: null,
        status: BookingStatus.COMPLETED,
        notes: null,
        updatedAt: new Date(),
        service: { id: 'svc-2', name: 'Color', price: 80, currency: 'USD' },
      },
    ]);

    const today = await service.getTodayBookings('biz-1', 'user-1');

    expect(today.bookings[0]?.floorStatus).toBe('checked_in');
    expect(today.bookings[1]?.floorStatus).toBe('completed');
  });

  it('rejects check-in when already checked in', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...bookingRecord,
      checkedInAt: new Date('2026-06-09T09:50:00.000Z'),
    });

    await expect(
      service.checkInBooking('biz-1', 'user-1', 'bk-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('notifies reception managers when setting enabled', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { providerMobile: { notifyReceptionOnCheckIn: true } },
    });

    await service.checkInBooking('biz-1', 'user-1', 'bk-1');

    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'mgr-1',
      'biz-1',
      expect.objectContaining({
        title: 'Client checked in',
        bookingId: 'bk-1',
      }),
    );
  });

  it('skips reception push when setting disabled', async () => {
    await service.checkInBooking('biz-1', 'user-1', 'bk-1');
    expect(pushService.sendToUser).not.toHaveBeenCalled();
  });
});
