import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService calendar month (prov-exp-10.2)', () => {
  const employeeRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
  const memberRepo = { find: jest.fn() };
  const bookingRepo = { findOne: jest.fn(), find: jest.fn(), count: jest.fn() };
  const slotRepo = { find: jest.fn() };
  const schedulingPeriodRepo = { find: jest.fn() };
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(),
  };
  const bookingService = { update: jest.fn(), cancel: jest.fn() };
  const bookingSlotResolver = { checkSlotAvailability: jest.fn(), describeUnavailable: jest.fn() };
  const retailPosService = { getBookingRetailSales: jest.fn() };
  const blockScheduleService = { createBlock: jest.fn() };
  const providerTimeOffService = { createRequest: jest.fn() };
  const llm = { isAvailableForBusiness: jest.fn(), completeJson: jest.fn() };
  const clinicTestOrderService = { listLabQueue: jest.fn() };
  const clinicTestResultService = { listResultQueue: jest.fn() };
  const customerRepo = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
  const reviewRepo = { find: jest.fn(), exists: jest.fn().mockResolvedValue(false) };
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
    getLastEarnRedeemTransactions: jest.fn(),
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
    employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.CONFIRMED,
        paymentStatus: 'unpaid',
        startTime: new Date('2026-06-09T10:00:00.000Z'),
        endTime: new Date('2026-06-09T11:00:00.000Z'),
      },
      {
        status: BookingStatus.CANCELLED,
        paymentStatus: 'unpaid',
        startTime: new Date('2026-06-09T12:00:00.000Z'),
        endTime: new Date('2026-06-09T13:00:00.000Z'),
      },
    ]);
    schedulingPeriodRepo.find.mockResolvedValue([
      {
        startTime: new Date('2026-06-09T09:00:00.000Z'),
        endTime: new Date('2026-06-09T17:00:00.000Z'),
        type: TemplatePeriodType.SERVICE_BLOCK,
      },
    ]);
  });

  it('returns month day summaries scoped to linked provider', async () => {
    const result = await service.getCalendarMonthSummary(
      'biz-1',
      'user-1',
      '2026-06',
    );

    expect(result.month).toBe('2026-06');
    expect(result.from).toBe('2026-06-01');
    expect(result.to).toBe('2026-06-30');
    expect(result.viewMode).toBe('provider');
    expect(result.days).toHaveLength(30);
    expect(result.days.find((day) => day.date === '2026-06-09')).toEqual(
      expect.objectContaining({
        bookingCount: 1,
        utilizationBand: expect.any(String),
      }),
    );
    expect(bookingRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ employeeId: expect.anything() }),
      }),
    );
  });

  it('returns team rollup month summaries for managers', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue(null);
    employeeRepo.find.mockResolvedValue([{ id: 'emp-1' }, { id: 'emp-2' }]);

    const result = await service.getCalendarMonthSummary(
      'biz-1',
      'user-mgr',
      '2026-06',
    );

    expect(result.viewMode).toBe('team');
    expect(bookingRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employeeId: expect.anything(),
        }),
      }),
    );
  });

  it('rejects invalid month keys', async () => {
    await expect(
      service.getCalendarMonthSummary('biz-1', 'user-1', 'June 2026'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
