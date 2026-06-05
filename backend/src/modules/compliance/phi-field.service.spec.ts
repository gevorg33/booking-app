import { ConfigService } from '@nestjs/config';
import { encryptSecret } from '../../common/utils/secret.util.js';
import { PhiAccessAuditService } from './phi-access-audit.service.js';
import { PhiFieldService } from './phi-field.service.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import type { Business } from '../business/entities/business.entity.js';

const clinicBusiness = (overrides: Record<string, unknown> = {}): Business =>
  ({
    id: 'biz-clinic',
    settings: {
      businessType: 'clinic',
      hipaa: {
        enabled: true,
        baaAcceptedAt: '2026-01-01T00:00:00.000Z',
        baaAcceptedByUserId: 'owner-1',
        baaVersion: '1.0',
        sessionTimeoutMinutes: 15,
      },
      ...overrides,
    },
  }) as Business;

describe('PhiFieldService', () => {
  const auditRepo = {
    create: jest.fn((row: unknown) => row),
    save: jest.fn(async (row: unknown) => ({
      ...(row as object),
      id: 'log-1',
    })),
  };
  const businessRepo = {
    save: jest.fn(async (b: Business) => b),
  };
  const phiAudit = new PhiAccessAuditService(auditRepo as never);

  const buildService = (configValues: Record<string, string | undefined>) => {
    const config = {
      get: jest.fn((key: string) => configValues[key]),
    } as unknown as ConfigService;
    return new PhiFieldService(config, businessRepo as never, phiAudit);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes through booking fields when HIPAA mode is off', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const salon = {
      id: 'biz-salon',
      settings: { businessType: 'hair_salon', hipaa: { enabled: true } },
    } as Business;
    const booking = { notes: 'plain', metadata: { symptoms: 'cough' } };

    await expect(
      service.encryptBookingForStorage(salon, booking),
    ).resolves.toBe(booking);
    await expect(
      service.decryptBookingForStaff(
        salon,
        { id: 'b-1', businessId: 'biz-salon', ...booking },
        { userId: 'u-1', role: MemberRole.STAFF },
      ),
    ).resolves.toMatchObject(booking);
    await service.auditBookingPhiWrite(
      salon,
      { id: 'b-1', businessId: 'biz-salon', notes: 'plain' },
      null,
      { role: 'public', userId: null },
    );
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it('uses fallback master keys in priority order', async () => {
    const service = buildService({
      PHI_ENCRYPTION_MASTER_KEY: undefined,
      INTEGRATIONS_ENCRYPTION_KEY: 'integrations-key',
      JWT_SECRET: 'jwt-key',
    });
    const business = clinicBusiness();
    const encrypted = await service.encryptBookingForStorage(business, {
      notes: 'secret',
    });
    expect(encrypted.notes).toContain('phi:v1:');
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('reuses existing per-business key material without saving again', async () => {
    const master = 'master-key';
    const material = {
      keyId: 'kid-1',
      keyEnc: encryptSecret('raw-business-key', master),
    };
    const business = clinicBusiness({
      hipaa: {
        enabled: true,
        baaAcceptedAt: '2026-01-01T00:00:00.000Z',
        phiEncryptionKeyId: material.keyId,
        phiEncryptionKeyEnc: material.keyEnc,
      },
    });
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: master });

    const first = await service.encryptBookingForStorage(business, {
      notes: 'one',
    });
    const second = await service.encryptBookingForStorage(business, {
      notes: 'two',
    });

    expect(businessRepo.save).not.toHaveBeenCalled();
    expect(first.notes).not.toBe('one');
    expect(second.notes).not.toBe('two');
  });

  it('audits PHI writes for staff and public actors', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness();

    await service.auditBookingPhiWrite(
      business,
      {
        id: 'book-1',
        businessId: 'biz-clinic',
        notes: 'new note',
      },
      { notes: 'old note' },
      { userId: 'staff-1', role: MemberRole.STAFF, ip: '127.0.0.1' },
    );
    expect(auditRepo.save).toHaveBeenCalled();

    jest.clearAllMocks();
    await service.auditBookingPhiWrite(
      business,
      { id: 'book-1', businessId: 'biz-clinic', notes: 'same' },
      { notes: 'same' },
      { role: 'public', userId: null },
    );
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it('returns ciphertext unchanged when decrypt key is missing', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness();
    const encrypted = await service.encryptBookingForStorage(business, {
      notes: 'hidden',
    });
    const withoutKey = clinicBusiness();
    delete (withoutKey.settings as Record<string, unknown>).hipaa;
    (withoutKey.settings as Record<string, unknown>).hipaa = { enabled: true };

    const result = await service.decryptBookingForStaff(
      withoutKey,
      {
        id: 'book-1',
        businessId: 'biz-clinic',
        employeeId: 'emp-1',
        linkedEmployeeIds: [],
        notes: encrypted.notes,
      },
      { userId: 'staff-1', role: MemberRole.MANAGER, employeeId: 'emp-1' },
    );

    expect(result.notes).toBe(encrypted.notes);
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it('falls back to JWT_SECRET and dev key when platform secrets are unset', async () => {
    const jwtService = buildService({
      PHI_ENCRYPTION_MASTER_KEY: undefined,
      INTEGRATIONS_ENCRYPTION_KEY: undefined,
      JWT_SECRET: 'jwt-only',
    });
    const devService = buildService({
      PHI_ENCRYPTION_MASTER_KEY: undefined,
      INTEGRATIONS_ENCRYPTION_KEY: undefined,
      JWT_SECRET: undefined,
    });
    const business = clinicBusiness();

    const fromJwt = await jwtService.encryptBookingForStorage(business, {
      notes: 'jwt',
    });
    const fromDev = await devService.encryptBookingForStorage(
      clinicBusiness(),
      {
        notes: 'dev',
      },
    );

    expect(fromJwt.notes).toContain('phi:v1:');
    expect(fromDev.notes).toContain('phi:v1:');
  });

  it('skips write audit when HIPAA is inactive or no fields changed', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const salon = {
      id: 'biz-salon',
      settings: { businessType: 'hair_salon' },
    } as Business;

    await service.auditBookingPhiWrite(
      salon,
      { id: 'book-1', businessId: 'biz-salon', notes: 'x' },
      null,
      { userId: 'staff-1', role: MemberRole.STAFF },
    );
    expect(auditRepo.save).not.toHaveBeenCalled();

    const business = clinicBusiness();
    await service.auditBookingPhiWrite(
      business,
      { id: 'book-1', businessId: 'biz-clinic', notes: 'same' },
      { notes: 'same' },
      { role: 'system' },
    );
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it('audits writes with default staff role when actor role is omitted', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness();

    await service.auditBookingPhiWrite(
      business,
      { id: 'book-1', businessId: 'biz-clinic', notes: 'changed' },
      { notes: 'before' },
      { userId: 'staff-1', role: MemberRole.STAFF },
    );

    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: MemberRole.STAFF }),
    );
  });

  it('masks PHI when staff lacks minimum-necessary access to the booking', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness();
    const stored = await service.encryptBookingForStorage(business, {
      notes: 'Secret intake',
      metadata: { symptoms: 'Pain', referralNotes: 'Dr B' },
    });
    const savedBusiness = businessRepo.save.mock.calls.at(-1)?.[0] as Business;

    const result = await service.decryptBookingForStaff(
      savedBusiness,
      {
        id: 'book-masked',
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

    expect(result.notes).toBeNull();
    expect(result.metadata?.symptoms).toBeUndefined();
    expect(result.metadata?.referralNotes).toBeUndefined();
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it('regenerates PHI key material when stored key fields are malformed', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness({
      hipaa: {
        enabled: true,
        baaAcceptedAt: '2026-01-01T00:00:00.000Z',
        phiEncryptionKeyId: 'kid-bad',
        phiEncryptionKeyEnc: undefined,
      },
    });

    const encrypted = await service.encryptBookingForStorage(business, {
      notes: 'regenerated',
    });

    expect(businessRepo.save).toHaveBeenCalled();
    expect(encrypted.notes).toContain('phi:v1:');
  });

  it('audits writes with null userId when actor omits user id', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness();

    await service.auditBookingPhiWrite(
      business,
      { id: 'book-1', businessId: 'biz-clinic', notes: 'changed' },
      { notes: 'before' },
      { userId: undefined, role: MemberRole.STAFF } as {
        userId: string;
        role: MemberRole;
      },
    );

    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null }),
    );
  });

  it('audits writes with null actor using staff defaults', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness();

    await service.auditBookingPhiWrite(
      business,
      { id: 'book-1', businessId: 'biz-clinic', notes: 'changed' },
      { notes: 'before' },
      null as never,
    );

    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        role: MemberRole.STAFF,
        ip: null,
      }),
    );
  });

  it('defaults audit role to staff when actor role is omitted', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness();

    await service.auditBookingPhiWrite(
      business,
      { id: 'book-1', businessId: 'biz-clinic', notes: 'changed' },
      { notes: 'before' },
      { userId: 'staff-1' } as { userId: string; role: MemberRole },
    );

    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: MemberRole.STAFF }),
    );
  });

  it('provisions PHI key when business settings object is null', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = {
      id: 'biz-clinic',
      settings: null,
    } as unknown as Business;

    const material = await (
      service as unknown as {
        ensureBusinessPhiKey: (b: Business) => Promise<{ keyId: string }>;
      }
    ).ensureBusinessPhiKey(business);

    expect(material.keyId).toBeTruthy();
    expect(business.settings).toMatchObject({
      hipaa: expect.objectContaining({
        phiEncryptionKeyId: expect.any(String),
        phiEncryptionKeyEnc: expect.any(String),
      }),
    });
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('resolves decrypt key from null settings without throwing', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    jest.spyOn(service, 'isHipaaActiveForBusiness').mockReturnValue(true);
    const business = {
      id: 'biz-clinic',
      settings: null,
    } as unknown as Business;

    const result = await service.decryptBookingForStaff(
      business,
      {
        id: 'book-1',
        businessId: 'biz-clinic',
        employeeId: 'emp-1',
        linkedEmployeeIds: [],
        notes: 'plain',
      },
      { userId: 'mgr-1', role: MemberRole.MANAGER, employeeId: 'emp-1' },
    );

    expect(result.notes).toBe('plain');
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it('skips write audit when before snapshot is undefined', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness();

    await service.auditBookingPhiWrite(
      business,
      { id: 'book-1', businessId: 'biz-clinic', notes: 'new' },
      undefined,
      { userId: 'staff-1', role: MemberRole.STAFF },
    );

    expect(auditRepo.save).toHaveBeenCalled();
  });

  it('reports HIPAA inactive for non-eligible business types', () => {
    const service = buildService({});
    expect(
      service.isHipaaActiveForBusiness({
        settings: {
          businessType: 'hair_salon',
          hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
        },
      }),
    ).toBe(false);
  });

  it('decrypts multiple bookings for staff and skips audit when no PHI present', async () => {
    const service = buildService({ PHI_ENCRYPTION_MASTER_KEY: 'master' });
    const business = clinicBusiness();
    const stored = await service.encryptBookingForStorage(business, {
      notes: 'alpha',
      metadata: { symptoms: 'fever' },
    });
    const savedBusiness = businessRepo.save.mock.calls.at(-1)?.[0] as Business;

    const decrypted = await service.decryptBookingsForStaff(
      savedBusiness ?? business,
      [
        {
          id: 'book-1',
          businessId: 'biz-clinic',
          employeeId: 'emp-1',
          linkedEmployeeIds: [],
          notes: stored.notes,
          metadata: stored.metadata,
        },
        {
          id: 'book-2',
          businessId: 'biz-clinic',
          notes: '',
          metadata: {},
        },
      ],
      { userId: 'staff-1', role: MemberRole.OWNER, ip: '10.1.1.1' },
    );

    expect(decrypted[0].notes).toBe('alpha');
    expect(decrypted[0].metadata?.symptoms).toBe('fever');
    expect(auditRepo.save).toHaveBeenCalled();
  });
});
