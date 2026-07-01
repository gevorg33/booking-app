import { ForbiddenException } from '@nestjs/common';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService my stats (prov-exp-2.1)', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'USD' },
    });
    employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2026-06-09T10:00:00.000Z'),
        endTime: new Date('2026-06-09T11:00:00.000Z'),
        service: { price: 100 },
        metadata: null,
      },
    ]);
    schedulingPeriodRepo.find.mockResolvedValue([
      {
        startTime: new Date('2026-06-09T09:00:00.000Z'),
        endTime: new Date('2026-06-09T17:00:00.000Z'),
        type: TemplatePeriodType.SERVICE_BLOCK,
      },
    ]);
    reviewRepo.find.mockResolvedValue([
      { rating: 5, createdAt: new Date('2026-06-09T18:00:00.000Z') },
    ]);
  });

  it('returns personal week stats for linked provider', async () => {
    const result = await service.getMyStats('biz-1', 'user-1', {
      period: 'week',
      scope: 'mine',
    });

    expect(result.scope).toBe('mine');
    expect(result.period).toBe('week');
    expect(result.completedBookings).toBe(1);
    expect(result.paidRevenue).toBe(100);
    expect(result.newReviewsCount).toBe(1);
    expect(result.canTeamRollup).toBe(false);
    expect(result.tipsEnabled).toBe(false);
    expect(result.tipTotal).toBeUndefined();
    expect(bookingRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ employeeId: expect.anything() }),
      }),
    );
  });

  it('returns team rollup stats for managers', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue(null);
    employeeRepo.find.mockResolvedValue([{ id: 'emp-1' }, { id: 'emp-2' }]);

    const result = await service.getMyStats('biz-1', 'user-mgr', {
      period: 'month',
      scope: 'team',
    });

    expect(result.scope).toBe('team');
    expect(result.period).toBe('month');
    expect(result.canTeamRollup).toBe(true);
    expect(result.employeeCount).toBe(2);
  });

  it('rejects team stats for staff providers', async () => {
    await expect(
      service.getMyStats('biz-1', 'user-1', { scope: 'team' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns tip totals when payment.tipsEnabled is on (prov-exp-2.3)', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'USD', payment: { tipsEnabled: true } },
    });
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2026-06-09T10:00:00.000Z'),
        endTime: new Date('2026-06-09T11:00:00.000Z'),
        service: { price: 100 },
        metadata: { payment: { tipAmount: 15 } },
      },
      {
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2026-06-10T10:00:00.000Z'),
        endTime: new Date('2026-06-10T11:00:00.000Z'),
        service: { price: 80 },
        metadata: { pricing: { tipAmount: 5 } },
      },
    ]);

    const result = await service.getMyStats('biz-1', 'user-1', {
      period: 'week',
      scope: 'mine',
    });

    expect(result.tipsEnabled).toBe(true);
    expect(result.tipTotal).toBe(20);
    expect(result.tippedVisitCount).toBe(2);
  });

  it('hides tip totals when payment.tipsEnabled is off (prov-exp-2.3)', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        startTime: new Date('2026-06-09T10:00:00.000Z'),
        endTime: new Date('2026-06-09T11:00:00.000Z'),
        service: { price: 100 },
        metadata: { payment: { tipAmount: 15 } },
      },
    ]);

    const result = await service.getMyStats('biz-1', 'user-1', {
      period: 'week',
      scope: 'mine',
    });

    expect(result.tipsEnabled).toBe(false);
    expect(result.tipTotal).toBeUndefined();
    expect(result.tippedVisitCount).toBeUndefined();
  });
});
