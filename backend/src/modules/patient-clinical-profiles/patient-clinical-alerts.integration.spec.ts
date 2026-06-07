import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PatientClinicalAlertsService } from './patient-clinical-alerts.service.js';
import { CLINIC_PATIENT_ALERT_LIST_EXPECTED } from './clinic-patient-alert.fixtures.js';

describe('PatientClinicalAlertsService (integration)', () => {
  const businessId = 'biz-1';
  const customerId = 'cust-1';

  const dismissalRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ ...value, id: 'dismiss-1' })),
    find: jest.fn(async () => []),
    findOne: jest.fn(async () => null),
  };

  const resultRepo = {
    find: jest.fn(async () => [
      {
        id: 'result-1',
        bookingId: 'booking-1',
        patientVisibility: 'New',
        status: 'Released',
        releasedAt: new Date('2026-06-21T10:00:00.000Z'),
        testType: { title: 'CBC panel' },
        order: null,
      },
    ]),
    findOne: jest.fn(async () => ({
      id: 'result-1',
      businessId,
      customerId,
      status: 'Released',
    })),
  };

  const orderRepo = {
    find: jest.fn(async () => []),
    findOne: jest.fn(async () => null),
  };

  const serviceRepo = {
    find: jest.fn(async () => []),
  };

  const intakeRepo = {
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(async () => [
        {
          id: 'intake-1',
          bookingId: 'booking-1',
          status: 'in_progress',
          updatedAt: new Date('2026-06-21T09:00:00.000Z'),
          questionnaireTitle: 'Referral intake questionnaire',
        },
      ]),
    })),
    findOne: jest.fn(async () => ({
      id: 'intake-1',
      businessId,
      customerId,
      status: 'in_progress',
    })),
  };

  const businessService = {
    findOne: jest.fn(async () => ({
      id: businessId,
      settings: { businessType: 'polyclinic' },
    })),
  };

  const accessService = {
    assertCustomerClinicalProfileAccess: jest.fn(async () => ({
      ctx: { userId: 'user-1', membershipRole: 'manager', employeeId: 'emp-1' },
      phiAccess: { hasAssignedBooking: true },
    })),
  };

  const alertsService = new PatientClinicalAlertsService(
    dismissalRepo as never,
    resultRepo as never,
    intakeRepo as never,
    orderRepo as never,
    serviceRepo as never,
    businessService as never,
    accessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists active chart alerts for a patient', async () => {
    const list = await alertsService.listAlertsForCustomer(
      businessId,
      customerId,
      'user-1',
    );

    expect(list.totalCount).toBe(CLINIC_PATIENT_ALERT_LIST_EXPECTED.totalCount);
    expect(list.alerts.map((alert) => alert.type)).toEqual([
      'TestResultReleased',
      'IntakeIncomplete',
    ]);
  });

  it('dismisses an alert source', async () => {
    const dismissed = await alertsService.dismissAlert(
      businessId,
      customerId,
      'user-1',
      'TestResultReleased',
      'result-1',
    );

    expect(dismissed.dismissed).toBe(true);
    expect(dismissalRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        alertType: 'TestResultReleased',
        sourceId: 'result-1',
        dismissedByEmployeeId: 'emp-1',
      }),
    );
  });

  it('rejects alert access when chart access fails', async () => {
    accessService.assertCustomerClinicalProfileAccess.mockRejectedValueOnce(
      new ForbiddenException(),
    );

    await expect(
      alertsService.listAlertsForCustomer(businessId, customerId, 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects dismiss when source is missing', async () => {
    resultRepo.findOne.mockResolvedValueOnce(null);

    await expect(
      alertsService.dismissAlert(
        businessId,
        customerId,
        'user-1',
        'TestResultReleased',
        'missing',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns existing dismissal without creating a duplicate', async () => {
    dismissalRepo.findOne.mockResolvedValueOnce({
      id: 'existing-dismiss',
      alertType: 'TestResultReleased',
      sourceId: 'result-1',
    });

    const dismissed = await alertsService.dismissAlert(
      businessId,
      customerId,
      'user-1',
      'TestResultReleased',
      'result-1',
    );

    expect(dismissed).toEqual({ dismissed: true, id: 'existing-dismiss' });
    expect(dismissalRepo.save).not.toHaveBeenCalled();
  });

  it('dismisses intake incomplete alerts', async () => {
    const dismissed = await alertsService.dismissAlert(
      businessId,
      customerId,
      'user-1',
      'IntakeIncomplete',
      'intake-1',
    );

    expect(dismissed.dismissed).toBe(true);
    expect(dismissalRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        alertType: 'IntakeIncomplete',
        sourceId: 'intake-1',
      }),
    );
  });

  it('rejects intake dismiss when intake is completed', async () => {
    intakeRepo.findOne.mockResolvedValueOnce({
      id: 'intake-1',
      businessId,
      customerId,
      status: 'completed',
    });

    await expect(
      alertsService.dismissAlert(
        businessId,
        customerId,
        'user-1',
        'IntakeIncomplete',
        'intake-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('filters dismissed alerts from the list response', async () => {
    dismissalRepo.find.mockResolvedValueOnce([
      {
        alertType: 'TestResultReleased',
        sourceId: 'result-1',
      },
    ]);

    const list = await alertsService.listAlertsForCustomer(
      businessId,
      customerId,
      'user-1',
    );

    expect(list.totalCount).toBe(1);
    expect(list.alerts[0]?.type).toBe('IntakeIncomplete');
  });

  it('falls back to order display name when test type title is missing', async () => {
    resultRepo.find.mockResolvedValueOnce([
      {
        id: 'result-9',
        bookingId: null,
        patientVisibility: 'New',
        status: 'Released',
        releasedAt: new Date('2026-06-21T10:00:00.000Z'),
        testType: null,
        order: { displayNames: 'Custom order panel' },
      },
    ]);

    const list = await alertsService.listAlertsForCustomer(
      businessId,
      customerId,
      'user-1',
    );

    expect(
      list.alerts.some((alert) => alert.testName === 'Custom order panel'),
    ).toBe(true);
  });

  it('lists lab booking request pending alerts after staff push', async () => {
    orderRepo.find.mockResolvedValueOnce([
      {
        id: 'order-1',
        bookingId: 'visit-booking-1',
        displayNames: 'CBC, Lipid panel',
        status: 'NotCollected',
        bookingRequestPushedAt: new Date('2026-06-22T11:00:00.000Z'),
        collectionBookingId: null,
        collectionServiceId: 'svc-lab-draw',
      },
    ]);
    serviceRepo.find.mockResolvedValueOnce([
      { id: 'svc-lab-draw', name: 'Lab blood draw' },
    ]);

    const list = await alertsService.listAlertsForCustomer(
      businessId,
      customerId,
      'user-1',
    );

    expect(list.totalCount).toBe(3);
    expect(list.alerts[0]?.type).toBe('LabBookingRequestPending');
    expect(list.alerts[0]?.chartTab).toBe('orders');
    expect(list.alerts[0]?.collectionServiceName).toBe('Lab blood draw');
  });

  it('dismisses lab booking request pending alerts', async () => {
    orderRepo.findOne.mockResolvedValueOnce({
      id: 'order-1',
      businessId,
      customerId,
      status: 'NotCollected',
      bookingRequestPushedAt: new Date('2026-06-22T11:00:00.000Z'),
      collectionBookingId: null,
    });

    const dismissed = await alertsService.dismissAlert(
      businessId,
      customerId,
      'user-1',
      'LabBookingRequestPending',
      'order-1',
    );

    expect(dismissed.dismissed).toBe(true);
    expect(dismissalRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        alertType: 'LabBookingRequestPending',
        sourceId: 'order-1',
      }),
    );
  });

  it('falls back when collection service id is unknown in the registry', async () => {
    orderRepo.find.mockResolvedValueOnce([
      {
        id: 'order-3',
        bookingId: 'visit-booking-3',
        displayNames: 'Vitamin D',
        status: 'NotCollected',
        bookingRequestPushedAt: new Date('2026-06-22T09:00:00.000Z'),
        collectionBookingId: null,
        collectionServiceId: 'missing-service',
      },
    ]);
    serviceRepo.find.mockResolvedValueOnce([]);

    const list = await alertsService.listAlertsForCustomer(
      businessId,
      customerId,
      'user-1',
    );

    const labAlert = list.alerts.find(
      (alert) => alert.type === 'LabBookingRequestPending',
    );
    expect(labAlert?.collectionServiceName).toBeNull();
    expect(labAlert?.messages[0]?.title).toBe(
      'Vitamin D — patient has not booked collection yet.',
    );
  });

  it('lists lab booking request alerts without collection service name when service is missing', async () => {
    orderRepo.find.mockResolvedValueOnce([
      {
        id: 'order-2',
        bookingId: 'visit-booking-2',
        displayNames: null,
        status: 'NotCollected',
        bookingRequestPushedAt: new Date('2026-06-22T10:00:00.000Z'),
        collectionBookingId: null,
        collectionServiceId: null,
      },
    ]);

    const list = await alertsService.listAlertsForCustomer(
      businessId,
      customerId,
      'user-1',
    );

    const labAlert = list.alerts.find(
      (alert) => alert.type === 'LabBookingRequestPending',
    );
    expect(labAlert?.collectionServiceName).toBeNull();
    expect(labAlert?.messages[0]?.title).toBe(
      'Patient has not booked lab collection yet.',
    );
    expect(serviceRepo.find).not.toHaveBeenCalled();
  });

  it('rejects lab booking request dismiss when collection is already booked', async () => {
    orderRepo.findOne.mockResolvedValueOnce({
      id: 'order-1',
      businessId,
      customerId,
      status: 'NotCollected',
      bookingRequestPushedAt: new Date('2026-06-22T11:00:00.000Z'),
      collectionBookingId: 'collection-booking-1',
    });

    await expect(
      alertsService.dismissAlert(
        businessId,
        customerId,
        'user-1',
        'LabBookingRequestPending',
        'order-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists customer account alerts without staff chart access', async () => {
    const list = await alertsService.listAlertsForCustomerAccount(
      businessId,
      customerId,
    );

    expect(list.totalCount).toBe(CLINIC_PATIENT_ALERT_LIST_EXPECTED.totalCount);
    expect(accessService.assertCustomerClinicalProfileAccess).not.toHaveBeenCalled();
  });

  it('dismisses customer account alerts without employee id', async () => {
    const dismissed = await alertsService.dismissAlertForCustomerAccount(
      businessId,
      customerId,
      'TestResultReleased',
      'result-1',
    );

    expect(dismissed.dismissed).toBe(true);
    expect(dismissalRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        alertType: 'TestResultReleased',
        sourceId: 'result-1',
        dismissedByEmployeeId: null,
      }),
    );
    expect(accessService.assertCustomerClinicalProfileAccess).not.toHaveBeenCalled();
  });
});
