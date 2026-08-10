import { NotFoundException } from '@nestjs/common';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

/**
 * e2e-bug.422 — the clock is frozen because these fixtures name real dates.
 *
 * `isWinBackCustomer` measures days since `lastCompletedVisitAt` against a
 * reference date that defaults to `new Date()`, with a 90-day inactivity
 * threshold. The fixture's customer last visited `2026-05-01`, which was recent
 * when written and is now over three months ago — so a `win_back` badge appeared
 * that the expected snapshot does not list, and the suite began failing on a
 * calendar date rather than on a code change.
 */
const FROZEN_NOW = new Date('2026-05-20T09:00:00.000Z');

beforeAll(() => {
  jest.useFakeTimers({ now: FROZEN_NOW, doNotFake: ['nextTick'] });
});

afterAll(() => {
  jest.useRealTimers();
});

describe('ProviderMobileService booking customer context (prov-exp-1.1)', () => {
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
  const blockScheduleService = { createBlock: jest.fn() };
  const providerTimeOffService = { createRequest: jest.fn() };

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
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        loyalty: { earnPercentCashback: 10 },
        marketingAutomation: { inactiveDaysThreshold: 90 },
      },
    });
    employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    loyaltyService.getOrCreate.mockResolvedValue({
      id: 'loyalty-1',
      pointsBalance: 50,
      lifetimeEarned: 80,
    });
    loyaltyService.getPublicSummary.mockReturnValue({
      pointsBalance: 50,
      pointsValue: 5,
      lifetimeEarned: 80,
    });
    loyaltyService.getLastEarnRedeemTransactions.mockResolvedValue({
      lastEarn: {
        points: 8,
        createdAt: new Date('2026-05-20T12:00:00.000Z'),
        note: 'Earned from paid booking',
      },
      lastRedeem: {
        points: -3,
        createdAt: new Date('2026-04-10T15:00:00.000Z'),
        note: 'Redeemed on booking',
      },
    });
    bookingRepo.count.mockImplementation(async ({ where }: any) => {
      if (where.status === BookingStatus.COMPLETED) return 3;
      if (where.status === BookingStatus.NO_SHOW) return 1;
      return 0;
    });
    bookingRepo.find.mockResolvedValue([
      {
        id: 'bk-past-1',
        endTime: new Date('2026-03-15T11:00:00.000Z'),
        service: { name: 'Blowout' },
        employee: { name: 'Sam Stylist' },
      },
      {
        id: 'bk-past-2',
        endTime: new Date('2026-02-10T09:30:00.000Z'),
        service: { name: 'Trim' },
        employee: { name: 'Alex Provider' },
      },
    ]);
  });

  it('returns customer snapshot for an accessible booking', async () => {
    const bookingRecord = {
      id: 'bk-1',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      customerId: 'cust-1',
      customer: {
        id: 'cust-1',
        name: 'Jane Doe',
        phone: '+15551234567',
        email: 'jane@example.com',
        metadata: {
          gdpr: { marketingOptIn: false },
          referredByCustomerId: 'cust-ref',
          referralCodeUsed: 'FRIEND10',
        },
      },
      service: { id: 'svc-1', name: 'Haircut' },
      employee: linkedEmployee,
    };
    bookingRepo.findOne.mockImplementation(async (opts: any) => {
      if (opts?.select?.endTime) {
        return { endTime: new Date('2026-04-01T10:00:00.000Z') };
      }
      return bookingRecord;
    });
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-ref',
      name: 'Alice Friend',
    });

    const context = await service.getBookingCustomerContext(
      'biz-1',
      'user-1',
      'bk-1',
    );

    expect(context).toMatchObject({
      customerId: 'cust-1',
      name: 'Jane Doe',
      phone: '+15551234567',
      email: 'jane@example.com',
      loyaltyPointsBalance: 50,
      loyaltyPointsValue: 5,
      loyaltyQuickView: {
        pointsBalance: 50,
        pointsValue: 5,
        lifetimeEarned: 80,
        lastEarn: {
          points: 8,
          occurredAt: '2026-05-20T12:00:00.000Z',
          note: 'Earned from paid booking',
        },
        lastRedeem: {
          points: 3,
          occurredAt: '2026-04-10T15:00:00.000Z',
          note: 'Redeemed on booking',
        },
        staffCanAdjust: false,
      },
      completedVisitCount: 3,
      noShowCount: 1,
      marketingOptIn: false,
      referral: {
        referredByCustomerId: 'cust-ref',
        referredByCustomerName: 'Alice Friend',
        referralCodeUsed: 'FRIEND10',
      },
      badges: [
        {
          id: 'referred_by',
          tone: 'secondary',
          referredByCustomerName: 'Alice Friend',
        },
      ],
    });
    expect(context.lastCompletedVisitAt).toBe('2026-04-01T10:00:00.000Z');
    expect(context.recentCompletedVisits).toEqual([
      {
        bookingId: 'bk-past-1',
        serviceName: 'Blowout',
        providerName: 'Sam Stylist',
        completedAt: '2026-03-15T11:00:00.000Z',
      },
      {
        bookingId: 'bk-past-2',
        serviceName: 'Trim',
        providerName: 'Alex Provider',
        completedAt: '2026-02-10T09:30:00.000Z',
      },
    ]);
  });

  it('includes win-back badge when last visit exceeds marketing inactive threshold', async () => {
    const bookingRecord = {
      id: 'bk-winback',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      customerId: 'cust-lapsed',
      customer: {
        id: 'cust-lapsed',
        name: 'Lapsed Client',
        phone: null,
        email: null,
        metadata: {},
      },
      service: { id: 'svc-1', name: 'Haircut' },
      employee: linkedEmployee,
    };
    bookingRepo.findOne.mockImplementation(async (opts: any) => {
      if (opts?.select?.endTime) {
        return { endTime: new Date('2025-12-01T10:00:00.000Z') };
      }
      return bookingRecord;
    });
    bookingRepo.count.mockImplementation(async ({ where }: any) => {
      if (where.status === BookingStatus.COMPLETED) return 2;
      if (where.status === BookingStatus.NO_SHOW) return 0;
      return 0;
    });
    bookingRepo.find.mockResolvedValue([]);

    const context = await service.getBookingCustomerContext(
      'biz-1',
      'user-1',
      'bk-winback',
    );

    expect(context.badges).toEqual([{ id: 'win_back', tone: 'tertiary' }]);
  });

  it('rejects walk-in bookings without a customer', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-walkin',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      customerId: null,
      customer: null,
      service: { id: 'svc-1', name: 'Haircut' },
      employee: linkedEmployee,
    });

    await expect(
      service.getBookingCustomerContext('biz-1', 'user-1', 'bk-walkin'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
