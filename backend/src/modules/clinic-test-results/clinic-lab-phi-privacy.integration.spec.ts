import { MemberRole } from '../business/entities/business-member.entity.js';
import { encryptLegacyPatientTestResultRows } from '../../common/utils/legacy-booking-patient-test-results-phi.util.js';
import {
  encryptClinicTestResultMeasurementPhi,
  encryptClinicTestResultPhi,
} from '../../common/utils/clinic-lab-phi.util.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
  isPhiEncryptedValue,
} from '../../common/utils/phi-encryption.util.js';
import { ClinicLabAccessService } from './shared/clinic-lab-access.service.js';
import { ClinicLabPhiService } from './shared/clinic-lab-phi.service.js';
import { ClinicTestResultService } from './test-result/clinic-test-result.service.js';
import { ClinicTestResultStatusService } from './test-result/clinic-test-result-status.service.js';
import { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../compliance/phi-field.service.js';

describe('Clinic lab PHI privacy (integration)', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );

  const hipaaBusiness = {
    id: 'biz-1',
    settings: {
      businessType: 'clinic',
      hipaa: { enabled: true, baaSigned: true, phiEncryptionKeyId: 'key-1' },
      phiEncryptionKeyMaterial: material,
    },
  };

  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(),
  };
  const employeeRepo = { findOne: jest.fn() };
  const bookingRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'booking-1',
      employeeId: 'emp-primary',
      linkedEmployeeIds: [],
    }),
  };
  const resultRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
    createQueryBuilder: jest.fn(),
  };
  const measurementRepo = { find: jest.fn() };
  const orderRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
  const resultHistoryRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const businessRepo = { findOne: jest.fn() };
  const auditRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ ...v, id: 'log-1' })),
  };
  const eventStore = { publish: jest.fn(async () => ({ id: 'evt-1' })) };

  const phiFieldService = {
    isHipaaActiveForBusiness: jest.fn(() => true),
    resolveBusinessEncryptionKey: jest.fn(async () => businessKey),
  };
  const phiAccessAudit = new PhiAccessAuditService(auditRepo as never);
  const clinicLabPhiService = new ClinicLabPhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit,
  );

  const accessService = new ClinicLabAccessService(
    businessService as any,
    employeeRepo as any,
    bookingRepo as any,
    {} as any,
    resultRepo as any,
    orderRepo as any,
  );

  const testTypeRepo = { findOne: jest.fn() };

  const statusService = new ClinicTestResultStatusService(
    resultRepo as any,
    resultHistoryRepo as any,
    businessService as any,
    clinicLabPhiService,
    eventStore as any,
  );

  const resultService = new ClinicTestResultService(
    resultRepo as any,
    resultHistoryRepo as any,
    measurementRepo as any,
    orderRepo as any,
    businessRepo as any,
    testTypeRepo as any,
    clinicLabPhiService,
    statusService,
  );

  const managerAccess = {
    ctx: {
      userId: 'user-manager',
      membershipRole: MemberRole.MANAGER,
      employeeId: 'emp-manager',
    },
    bookingAccess: {
      employeeId: 'emp-primary',
      linkedEmployeeIds: [],
    },
  };

  const staffAccess = {
    ctx: {
      userId: 'user-staff',
      membershipRole: MemberRole.STAFF,
      employeeId: 'emp-other',
    },
    bookingAccess: {
      employeeId: 'emp-primary',
      linkedEmployeeIds: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue(hipaaBusiness);
    businessService.findOne.mockResolvedValue(hipaaBusiness);
    orderRepo.createQueryBuilder.mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
  });

  it('decrypts result PHI for authorized staff and masks for unassigned staff', async () => {
    const encrypted = encryptClinicTestResultPhi(
      {
        comment: 'Elevated glucose',
        reviewComment: 'Confirmed abnormal',
        releaseComment: null,
      },
      businessKey,
    );

    resultRepo.find.mockResolvedValue([
      {
        id: 'result-1',
        businessId: 'biz-1',
        bookingId: 'booking-1',
        orderId: 'order-1',
        customerId: 'cust-1',
        status: 'Completed',
        testTypeId: 'type-1',
        measurementFlag: 'Abnormal',
        completedAt: new Date('2026-06-02T10:00:00.000Z'),
        reviewedAt: null,
        releasedAt: null,
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        ...encrypted,
        testType: { title: 'Glucose' },
        order: { displayNames: 'Glucose' },
      },
    ]);

    const authorized = await resultService.listResultsForBooking(
      'biz-1',
      'booking-1',
      managerAccess,
    );
    expect(authorized[0]?.comment).toBe('Elevated glucose');
    expect(authorized[0]?.phiMasked).toBeUndefined();
    expect(auditRepo.save).toHaveBeenCalled();

    jest.clearAllMocks();

    const masked = await resultService.listResultsForBooking(
      'biz-1',
      'booking-1',
      staffAccess,
    );
    expect(masked[0]?.comment).toBeNull();
    expect(masked[0]?.reviewComment).toBeNull();
    expect(masked[0]?.phiMasked).toBe(true);
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it('returns measurement PHI on result detail with read audit', async () => {
    const encryptedMeasurement = encryptClinicTestResultMeasurementPhi(
      { value: '142', labComment: 'Repeat draw advised' },
      businessKey,
    );

    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      bookingId: 'booking-1',
      orderId: 'order-1',
      customerId: 'cust-1',
      status: 'Completed',
      testTypeId: 'type-1',
      measurementFlag: 'Abnormal',
      completedAt: new Date('2026-06-02T10:00:00.000Z'),
      reviewedAt: null,
      releasedAt: null,
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      comment: null,
      reviewComment: null,
      releaseComment: null,
      testType: { title: 'Glucose' },
      order: { displayNames: 'Glucose' },
      measurements: [
        {
          id: 'measurement-1',
          testTypeId: 'type-1',
          measurementFlag: 'Abnormal',
          receivedAt: new Date('2026-06-02T09:00:00.000Z'),
          ...encryptedMeasurement,
        },
      ],
    });

    const detail = await resultService.getResultDetail(
      'biz-1',
      'result-1',
      managerAccess,
    );

    expect(detail.measurements).toEqual([
      expect.objectContaining({
        id: 'measurement-1',
        value: '142',
        labComment: 'Repeat draw advised',
      }),
    ]);
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'clinic_test_result_measurement',
        fieldName: 'value',
      }),
    );
  });

  it('audits PHI writes on result status transitions', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      businessId: 'biz-1',
      status: 'Completed',
      comment: null,
      reviewComment: null,
      releaseComment: null,
    });

    await statusService.transitionResultStatus({
      businessId: 'biz-1',
      resultId: 'result-1',
      toStatus: 'Reviewed',
      note: 'Within normal limits',
      staff: {
        userId: 'user-manager',
        role: MemberRole.MANAGER,
        employeeId: 'emp-manager',
      },
    });

    expect(
      isPhiEncryptedValue(
        String(resultRepo.save.mock.calls[0]?.[0]?.reviewComment),
      ),
    ).toBe(true);
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'write',
        resourceType: 'clinic_test_result',
        fieldName: 'reviewComment',
      }),
    );
  });

  it('blocks provider from booking lab summaries on unassigned bookings', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-other', isActive: true });

    await expect(
      accessService.assertBookingLabAccessContext(
        'biz-1',
        'user-1',
        'booking-1',
      ),
    ).rejects.toThrow('You do not have access to lab records for this booking');
  });

  it('merges legacy booking metadata results into structured list', async () => {
    const legacyNotes = encryptLegacyPatientTestResultRows(
      [{ notes: 'Legacy WBC note', testName: 'Legacy CBC' }],
      businessKey,
    ) as Array<{ notes: string; testName: string }>;

    resultRepo.find.mockResolvedValue([]);
    businessRepo.findOne.mockResolvedValue(hipaaBusiness);
    businessService.findOne.mockResolvedValue(hipaaBusiness);
    bookingRepo.findOne.mockResolvedValue({
      id: 'booking-1',
      employeeId: 'emp-primary',
      linkedEmployeeIds: [],
      customerId: 'cust-1',
      metadata: { patient_test_results: legacyNotes },
    });
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-manager',
      isActive: true,
    });

    const accessServiceWithBooking = new ClinicLabAccessService(
      businessService as any,
      employeeRepo as any,
      bookingRepo as any,
      {} as any,
      resultRepo as any,
      orderRepo as any,
    );

    const access = await accessServiceWithBooking.assertBookingLabAccessContext(
      'biz-1',
      'user-manager',
      'booking-1',
    );

    const rows = await resultService.listResultsForBooking(
      'biz-1',
      'booking-1',
      {
        ctx: access.ctx,
        bookingAccess: access.bookingAccess,
        bookingMetadata: access.bookingMetadata,
        customerId: access.customerId,
      },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.legacySource).toBe('booking_metadata');
    expect(rows[0]?.comment).toBe('Legacy WBC note');
    expect(rows[0]?.testName).toBe('Legacy CBC');
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'booking',
        fieldName: 'patient_test_results',
      }),
    );
  });
});
