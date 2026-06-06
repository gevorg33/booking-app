import { ConfigService } from '@nestjs/config';
import { ComplianceBreachService } from './compliance-breach.service.js';
import { PhiAccessAuditService } from './phi-access-audit.service.js';
import { PhiFieldService } from './phi-field.service.js';
import { BusinessService } from '../business/business.service.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { DataBreachIncident } from './entities/data-breach-incident.entity.js';
import type { PhiAccessAuditLog } from './entities/phi-access-audit-log.entity.js';

const clinicBusiness = (settings: Record<string, unknown> = {}): Business =>
  ({
    id: 'biz-clinic',
    name: 'City Clinic',
    settings: {
      businessType: 'clinic',
      hipaa: {
        enabled: true,
        baaAcceptedAt: '2026-01-01T00:00:00.000Z',
        baaAcceptedByUserId: 'owner-1',
        baaVersion: '1.0',
        sessionTimeoutMinutes: 15,
      },
      ...settings,
    },
  }) as Business;

describe('Sprint 37 — compliance breach + PHI', () => {
  const incidentRepo = {
    create: jest.fn((row: Partial<DataBreachIncident>) => row),
    save: jest.fn(async (row: DataBreachIncident) => ({
      ...row,
      id: 'incident-1',
    })),
    find: jest.fn(async () => []),
  };
  const auditRepo = {
    create: jest.fn((row: Partial<PhiAccessAuditLog>) => row),
    save: jest.fn(async (row: PhiAccessAuditLog) => ({ ...row, id: 'log-1' })),
    findAndCount: jest.fn(async () => [[], 0]),
    delete: jest.fn(async () => ({ affected: 0 })),
  };
  const businessRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (b: Business) => b),
  };
  const businessService = {
    ensureOwner: jest.fn(),
    findOne: jest.fn(async () => ({ id: 'biz-clinic', name: 'City Clinic' })),
    ensureMember: jest.fn(async () => ({ role: MemberRole.OWNER })),
  } as unknown as BusinessService;

  const config = {
    get: jest.fn((key: string) =>
      key === 'PHI_ENCRYPTION_MASTER_KEY' ? 'phi-master-test' : undefined,
    ),
  } as unknown as ConfigService;

  const customerRepo = {
    find: jest.fn(async () => []),
  };
  const emailService = {
    send: jest.fn(async () => ({ ok: true })),
  };
  const breachService = new ComplianceBreachService(
    incidentRepo as never,
    customerRepo as never,
    businessService,
    emailService as never,
  );
  const phiAudit = new PhiAccessAuditService(auditRepo as never);
  const phiFieldService = new PhiFieldService(
    config,
    businessRepo as never,
    phiAudit,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports breach incident with GDPR draft email and deadline', async () => {
    const incident = await breachService.reportBreach('biz-clinic', 'owner-1', {
      description: 'Unauthorized database export containing customer emails.',
      affectedCustomerCount: 5,
    });
    expect(businessService.ensureOwner).toHaveBeenCalledWith(
      'biz-clinic',
      'owner-1',
    );
    expect(incident.draftEmailSubject).toContain('City Clinic');
    expect(incident.draftEmailBody).toContain('Unauthorized database export');
    expect(incident.gdprNotificationDeadlineAt).toBeInstanceOf(Date);
    expect(incident.affectedCustomerCount).toBe(5);
  });

  it('encrypts PHI at rest when HIPAA mode is active', async () => {
    const business = clinicBusiness();
    businessRepo.findOne.mockResolvedValue(business);
    const encrypted = await phiFieldService.encryptBookingForStorage(business, {
      notes: 'Patient complaint',
      metadata: { symptoms: 'Headache' },
    });
    expect(encrypted.notes).toContain('phi:v1:');
    expect(encrypted.metadata?.symptoms).toContain('phi:v1:');
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('decrypts PHI for authorized staff and writes audit log', async () => {
    const business = clinicBusiness();
    businessRepo.findOne.mockResolvedValue(business);
    const stored = await phiFieldService.encryptBookingForStorage(business, {
      notes: 'Sensitive',
      metadata: { referralNotes: 'Dr A' },
    });
    const savedBusiness = businessRepo.save.mock.calls.at(-1)?.[0] as Business;
    const decrypted = await phiFieldService.decryptBookingForStaff(
      savedBusiness,
      {
        id: 'booking-1',
        businessId: 'biz-clinic',
        employeeId: 'emp-1',
        linkedEmployeeIds: [],
        notes: stored.notes,
        metadata: stored.metadata,
      },
      { userId: 'staff-1', role: MemberRole.MANAGER, employeeId: 'emp-1' },
    );
    expect(decrypted.notes).toBe('Sensitive');
    expect(decrypted.metadata?.referralNotes).toBe('Dr A');
    expect(auditRepo.save).toHaveBeenCalled();
  });
});
