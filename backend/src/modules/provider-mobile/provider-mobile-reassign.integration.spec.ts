import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService booking reassign (prov-exp-4.2)', () => {
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

  const bookingRecord = {
    id: 'bk-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    serviceId: 'svc-1',
    status: BookingStatus.CONFIRMED,
    checkedInAt: null,
    metadata: {},
    notes: null,
    updatedAt: new Date('2026-06-09T09:00:00.000Z'),
    startTime: new Date('2026-06-09T10:00:00.000Z'),
    endTime: new Date('2026-06-09T11:00:00.000Z'),
    multiServiceGroupId: null,
    customer: { id: 'cust-1', name: 'Jane Doe', phone: null, email: null },
    service: { id: 'svc-1', name: 'Haircut', price: 50, currency: 'USD' },
    employee: { id: 'emp-1', name: 'Alex Provider' },
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
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      timezone: 'UTC',
      settings: {},
    });
    employeeRepo.findOne.mockImplementation(async ({ where }: any) => {
      if (where.id === 'emp-1') {
        return { id: 'emp-1', name: 'Alex Provider', isActive: true };
      }
      if (where.id === 'emp-2') {
        return { id: 'emp-2', name: 'Zara Kim', isActive: true };
      }
      return null;
    });
    employeeRepo.find.mockResolvedValue([
      { id: 'emp-1', name: 'Alex Provider', isActive: true },
      { id: 'emp-2', name: 'Zara Kim', isActive: true },
    ]);
    bookingRepo.findOne.mockResolvedValue({ ...bookingRecord });
    reviewRepo.exists.mockResolvedValue(false);
    retailPosService.getBookingRetailSales.mockResolvedValue({ lines: [] });
    retailPosService.hasConfiguredRetailProducts.mockResolvedValue(false);
    bookingSlotResolver.checkSlotAvailability.mockResolvedValue({
      available: true,
      employeeId: 'emp-2',
      employeeName: 'Zara Kim',
      hasSchedule: true,
      openSlots: [{ start: '10:00', end: '12:00' }],
    });
    bookingService.update.mockImplementation(async (_id, _dto) => ({
      ...bookingRecord,
      employeeId: 'emp-2',
      employee: { id: 'emp-2', name: 'Zara Kim' },
    }));
  });

  it('lists same-day reassignment options using slot resolver', async () => {
    const options = await service.getBookingReassignOptions(
      'biz-1',
      'mgr-1',
      'bk-1',
    );

    expect(options.allowed).toBe(true);
    expect(options.options).toEqual([{ id: 'emp-2', name: 'Zara Kim' }]);
    expect(bookingSlotResolver.checkSlotAvailability).toHaveBeenCalledWith(
      'biz-1',
      'emp-2',
      'Zara Kim',
      'svc-1',
      '2026-06-09',
      '10:00',
      'UTC',
    );
  });

  it('reassigns booking to another provider at the same time', async () => {
    const result = await service.reassignBooking('biz-1', 'mgr-1', 'bk-1', {
      employeeId: 'emp-2',
    });

    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-1',
      expect.objectContaining({ employeeId: 'emp-2' }),
      'mgr-1',
    );
    expect(result.employee?.id).toBe('emp-2');
  });

  it('blocks provider from reassigning another providers booking', async () => {
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    employeeRepo.findOne.mockImplementation(async ({ where }: any) => {
      if (where.userId === 'user-1') {
        return {
          id: 'emp-1',
          name: 'Alex Provider',
          businessId: 'biz-1',
          isActive: true,
          userId: 'user-1',
        };
      }
      if (where.id === 'emp-2') {
        return { id: 'emp-2', name: 'Zara Kim', isActive: true };
      }
      return null;
    });
    bookingRepo.findOne.mockResolvedValue({
      ...bookingRecord,
      employeeId: 'emp-2',
      employee: { id: 'emp-2', name: 'Zara Kim' },
    });

    await expect(
      service.reassignBooking('biz-1', 'user-1', 'bk-1', { employeeId: 'emp-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns conflict when target provider is unavailable', async () => {
    bookingSlotResolver.checkSlotAvailability.mockResolvedValue({
      available: false,
      employeeId: 'emp-2',
      employeeName: 'Zara Kim',
      hasSchedule: true,
      openSlots: [],
      reason: 'slot_unavailable',
    });
    bookingSlotResolver.describeUnavailable.mockReturnValue(
      'Zara Kim is not free at 10:00 on 2026-06-09 for Haircut.',
    );

    await expect(
      service.reassignBooking('biz-1', 'mgr-1', 'bk-1', { employeeId: 'emp-2' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks generic update from changing employee without reassign endpoint', async () => {
    await expect(
      service.updateBooking('biz-1', 'mgr-1', 'bk-1', { employeeId: 'emp-2' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
