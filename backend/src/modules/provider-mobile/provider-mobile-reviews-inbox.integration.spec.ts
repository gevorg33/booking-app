import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService reviews inbox (prov-exp-2.2)', () => {
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
  const retailPosService = {
    getBookingRetailSales: jest.fn(),
    hasConfiguredRetailProducts: jest.fn(),
  };
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
    getProviderStatus: jest.fn().mockReturnValue({
      emailConfigured: true,
      smsConfigured: true,
      whatsappConfigured: true,
      whatsappSource: 'platform',
      whatsappUsingPlatformDefault: true,
    }),
  };
  const reviewsService = {
    ensureReviewToken: jest.fn(),
  };
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
      settings: { marketingAutomation: { postVisitReviewEnabled: true } },
    });
    employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    reviewRepo.find.mockResolvedValue([
      {
        id: 'rev-1',
        rating: 5,
        comment: 'Great',
        customerName: 'Sam',
        createdAt: new Date('2026-06-10T10:00:00.000Z'),
        bookingId: 'bk-1',
      },
      {
        id: 'rev-2',
        rating: 2,
        comment: 'Late',
        customerName: 'Jo',
        createdAt: new Date('2026-06-12T10:00:00.000Z'),
        bookingId: 'bk-2',
      },
    ]);
    reviewRepo.exists.mockResolvedValue(false);
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-1',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      startTime: new Date('2026-06-09T10:00:00.000Z'),
      endTime: new Date('2026-06-09T11:00:00.000Z'),
      metadata: {},
      customer: { email: 'sam@test.com', phone: null, name: 'Sam' },
      service: { id: 'svc-1', name: 'Cut', price: 50 },
      employee: linkedEmployee,
      notes: null,
      customerId: 'cust-1',
      updatedAt: new Date('2026-06-09T11:00:00.000Z'),
    });
    retailPosService.getBookingRetailSales.mockResolvedValue({ lines: [] });
    retailPosService.hasConfiguredRetailProducts.mockResolvedValue(false);
    reviewsService.ensureReviewToken.mockResolvedValue('token-1');
    notificationsService.sendReviewRequest.mockResolvedValue(undefined);
  });

  it('returns filtered reviews inbox with booking links', async () => {
    const result = await service.getProviderReviewsInbox('biz-1', 'user-1', {
      lowRating: 'true',
    });

    expect(result.filteredCount).toBe(1);
    expect(result.reviews[0]?.bookingId).toBe('bk-2');
    expect(result.postVisitReviewEnabled).toBe(true);
  });

  it('sends manual review request when policy allows', async () => {
    const result = await service.requestBookingReview(
      'biz-1',
      'user-1',
      'bk-1',
    );

    expect(result).toEqual({ sent: true, bookingId: 'bk-1' });
    expect(reviewsService.ensureReviewToken).toHaveBeenCalledWith('bk-1');
    expect(notificationsService.sendReviewRequest).toHaveBeenCalledWith('bk-1');
  });

  it('rejects review request when dashboard policy is disabled', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { marketingAutomation: { postVisitReviewEnabled: false } },
    });

    await expect(
      service.requestBookingReview('biz-1', 'user-1', 'bk-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('includes reviewRequest eligibility on booking detail', async () => {
    const detail = await service.getBookingDetail('biz-1', 'user-1', 'bk-1');

    expect(detail.reviewRequest).toEqual({ allowed: true, reason: null });
  });

  it('returns empty inbox when manager has no linked employee', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'manager' });
    employeeRepo.findOne.mockResolvedValue(null);

    const result = await service.getProviderReviewsInbox(
      'biz-1',
      'user-mgr',
      {},
    );

    expect(result.reviewCount).toBe(0);
    expect(reviewRepo.find).not.toHaveBeenCalled();
  });
});
