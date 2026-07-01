import { ForbiddenException } from '@nestjs/common';
import { CLINIC_PROVIDER_TASK_INBOX_PAGE_SIZE } from './provider-mobile-clinic-tasks.util.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService clinic task inbox', () => {
  const employeeRepo = { findOne: jest.fn(), find: jest.fn() };
  const memberRepo = { find: jest.fn() };
  const bookingRepo = { findOne: jest.fn(), find: jest.fn() };
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
  const customerRepo = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
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
    { find: jest.fn() } as any,
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
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'polyclinic' },
    });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      name: 'Dr Smith',
      userId: 'user-1',
      isActive: true,
    });
    customerRepo.find.mockResolvedValue([{ id: 'cust-1', name: 'Jane Doe' }]);
    employeeRepo.find.mockResolvedValue([{ id: 'emp-1', name: 'Dr Smith' }]);
  });

  it('returns open and in-progress tasks scoped to the provider inbox', async () => {
    clinicTasksService.listClinicTasks
      .mockResolvedValueOnce({
        items: [
          {
            id: 'task-open',
            taskType: 'ResultReview',
            status: 'open',
            title: 'Review CBC',
            notes: null,
            priority: 'high',
            dueAt: '2026-06-22T12:00:00.000Z',
            customerId: 'cust-1',
            bookingId: 'book-1',
            assigneeEmployeeId: 'emp-1',
            isAutoManaged: true,
            createdAt: '2026-06-22T09:00:00.000Z',
          },
        ],
        totalItems: 1,
        page: 1,
        pageSize: CLINIC_PROVIDER_TASK_INBOX_PAGE_SIZE,
      })
      .mockResolvedValueOnce({
        items: [],
        totalItems: 0,
        page: 1,
        pageSize: CLINIC_PROVIDER_TASK_INBOX_PAGE_SIZE,
      });

    const result = await service.getProviderClinicTaskInbox('biz-1', 'user-1');

    expect(result.labFeaturesEnabled).toBe(true);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.customerName).toBe('Jane Doe');
    expect(result.tasks[0]?.canComplete).toBe(true);
    expect(clinicTasksService.listClinicTasks).toHaveBeenCalledTimes(2);
    expect(clinicTasksService.listClinicTasks).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      expect.objectContaining({
        status: 'open',
        pageSize: CLINIC_PROVIDER_TASK_INBOX_PAGE_SIZE,
      }),
    );
    expect(clinicTasksService.listClinicTasks).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      expect.objectContaining({ status: 'in_progress' }),
    );
  });

  it('returns an empty inbox for non-clinic businesses without querying tasks', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });

    const result = await service.getProviderClinicTaskInbox('biz-1', 'user-1');

    expect(result.labFeaturesEnabled).toBe(false);
    expect(result.tasks).toEqual([]);
    expect(clinicTasksService.listClinicTasks).not.toHaveBeenCalled();
  });

  it('rejects users without provider or manager access', async () => {
    employeeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getProviderClinicTaskInbox('biz-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('delegates claim and complete actions to clinic tasks service', async () => {
    clinicTasksService.claimClinicTask.mockResolvedValue({ id: 'task-1' });
    clinicTasksService.completeClinicTask.mockResolvedValue({
      id: 'task-1',
      status: 'completed',
    });

    await service.claimProviderClinicTask('biz-1', 'user-1', 'task-1');
    await service.completeProviderClinicTask('biz-1', 'user-1', 'task-1', {
      notes: 'Done',
    });

    expect(clinicTasksService.claimClinicTask).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'task-1',
    );
    expect(clinicTasksService.completeClinicTask).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'task-1',
      { notes: 'Done' },
    );
  });
});
