import { ConfigService } from '@nestjs/config';
import { isPhiEncryptedValue } from '../../common/utils/phi-encryption.util.js';
import { MIN_PHI_AUDIT_RETENTION_DAYS } from '../../common/utils/business-compliance.util.js';
import {
  computeGdprNotificationDeadline,
  GDPR_BREACH_NOTIFICATION_HOURS,
} from '../../common/utils/breach-notification.util.js';
import { ComplianceBreachService } from './compliance-breach.service.js';
import { PhiAccessAuditService } from './phi-access-audit.service.js';
import { PhiFieldService } from './phi-field.service.js';
import { BusinessService } from '../business/business.service.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import type { Business } from '../business/entities/business.entity.js';

describe('Sprint 37 — compliance scenario matrix', () => {
  const auditRepo = {
    create: jest.fn((row: unknown) => row),
    save: jest.fn(async (row: unknown) => ({
      ...(row as object),
      id: 'log-1',
    })),
    findAndCount: jest.fn(async () => [[], 0]),
    delete: jest.fn(async () => ({ affected: 0 })),
  };
  const businessRepo = {
    save: jest.fn(async (b: Business) => b),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'PHI_ENCRYPTION_MASTER_KEY' ? 'phi-master' : undefined,
    ),
  } as unknown as ConfigService;
  const phiAudit = new PhiAccessAuditService(auditRepo as never);
  const phiFieldService = new PhiFieldService(
    config,
    businessRepo as never,
    phiAudit,
  );

  const clinic = (hipaaEnabled: boolean): Business =>
    ({
      id: 'biz-clinic',
      name: 'Clinic',
      settings: {
        businessType: 'clinic',
        hipaa: {
          enabled: hipaaEnabled,
          baaAcceptedAt: hipaaEnabled ? '2026-01-01' : null,
          sessionTimeoutMinutes: 15,
        },
      },
    }) as Business;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    'referralNotes',
    'symptoms',
    'notes',
    'patient_test_results',
  ] as const)(
    'encrypts PHI field %s at rest when HIPAA is on',
    async (field) => {
      const business = clinic(true);
      const payload =
        field === 'notes'
          ? { notes: 'Private note' }
          : field === 'patient_test_results'
            ? { metadata: { patient_test_results: [{ notes: 'Lab result' }] } }
            : { metadata: { [field]: 'Sensitive value' } };

      const encrypted = await phiFieldService.encryptBookingForStorage(
        business,
        payload,
      );

      if (field === 'notes') {
        expect(isPhiEncryptedValue(encrypted.notes!)).toBe(true);
      } else if (field === 'patient_test_results') {
        const rows = encrypted.metadata?.patient_test_results as Array<{
          notes: string;
        }>;
        expect(isPhiEncryptedValue(rows[0].notes)).toBe(true);
      } else {
        expect(isPhiEncryptedValue(encrypted.metadata?.[field] as string)).toBe(
          true,
        );
      }
    },
  );

  it('logs separate audit rows per PHI field on staff read', async () => {
    const business = clinic(true);
    const stored = await phiFieldService.encryptBookingForStorage(business, {
      notes: 'Note',
      metadata: {
        referralNotes: 'Dr B',
        symptoms: 'Pain',
        patient_test_results: [{ notes: 'WBC high' }],
      },
    });
    const savedBusiness = businessRepo.save.mock.calls.at(-1)?.[0] as Business;

    await phiFieldService.decryptBookingForStaff(
      savedBusiness,
      {
        id: 'book-1',
        businessId: 'biz-clinic',
        employeeId: 'emp-1',
        linkedEmployeeIds: [],
        notes: stored.notes,
        metadata: stored.metadata,
      },
      {
        userId: 'mgr-1',
        role: MemberRole.MANAGER,
        ip: '192.168.1.10',
        employeeId: 'emp-1',
      },
    );

    expect(auditRepo.save).toHaveBeenCalledTimes(4);
  });

  it('enforces 6-year PHI audit retention constant', () => {
    expect(MIN_PHI_AUDIT_RETENTION_DAYS).toBe(2190);
  });

  it('computes GDPR breach authority deadline at 72 hours', () => {
    const reportedAt = new Date('2026-06-01T09:00:00.000Z');
    const deadline = computeGdprNotificationDeadline(reportedAt);
    expect(GDPR_BREACH_NOTIFICATION_HOURS).toBe(72);
    expect(deadline.toISOString()).toBe('2026-06-04T09:00:00.000Z');
  });

  it('masks PHI for staff on unassigned bookings under minimum-necessary rules', async () => {
    const business = clinic(true);
    const stored = await phiFieldService.encryptBookingForStorage(business, {
      notes: 'Restricted',
      metadata: { symptoms: 'Fever' },
    });
    const savedBusiness = businessRepo.save.mock.calls.at(-1)?.[0] as Business;

    const masked = await phiFieldService.decryptBookingForStaff(
      savedBusiness,
      {
        id: 'book-mask',
        businessId: 'biz-clinic',
        employeeId: 'emp-other',
        linkedEmployeeIds: [],
        notes: stored.notes,
        metadata: stored.metadata,
      },
      {
        userId: 'staff-1',
        role: MemberRole.STAFF,
        employeeId: 'emp-self',
      },
    );

    expect(masked.notes).toBeNull();
    expect(masked.metadata?.symptoms).toBeUndefined();
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it('skips PHI encryption when HIPAA mode is disabled for clinic', async () => {
    const business = clinic(false);
    const booking = {
      notes: 'Plain text',
      metadata: { symptoms: 'cough' },
    };

    const result = await phiFieldService.encryptBookingForStorage(
      business,
      booking,
    );

    expect(result).toBe(booking);
    expect(businessRepo.save).not.toHaveBeenCalled();
  });

  it('breach report stores trimmed description and draft notification', async () => {
    const incidentRepo = {
      create: jest.fn((row: unknown) => row),
      save: jest.fn(async (row: unknown) => ({
        ...(row as object),
        id: 'inc-1',
      })),
    };
    const businessService = {
      ensureOwner: jest.fn(),
      findOne: jest.fn(async () => ({ name: 'Metro Clinic' })),
    } as unknown as BusinessService;
    const breachService = new ComplianceBreachService(
      incidentRepo as never,
      businessService,
    );

    const incident = await breachService.reportBreach('biz-1', 'owner-1', {
      description: '  Email list exposed via misconfigured S3 bucket.  ',
      affectedCustomerCount: 42,
    });

    expect(incident.description).toBe(
      'Email list exposed via misconfigured S3 bucket.',
    );
    expect(incident.draftEmailBody).toContain('S3 bucket');
    expect(incident.affectedCustomerCount).toBe(42);
  });
});
