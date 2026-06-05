import { LessThan } from 'typeorm';
import { MIN_PHI_AUDIT_RETENTION_DAYS } from '../../common/utils/business-compliance.util.js';
import { PhiAccessAuditService } from './phi-access-audit.service.js';
import type { PhiAccessAuditLog } from './entities/phi-access-audit-log.entity.js';

describe('PhiAccessAuditService', () => {
  const auditRepo = {
    create: jest.fn((row: Partial<PhiAccessAuditLog>) => row),
    save: jest.fn(async (row: PhiAccessAuditLog) => ({ ...row, id: 'log-1' })),
    findAndCount: jest.fn(),
    delete: jest.fn(),
  };
  const service = new PhiAccessAuditService(auditRepo as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs access with explicit undefined field name and ip', async () => {
    await service.logAccess({
      context: {
        businessId: 'biz-1',
        userId: 'user-1',
        role: 'staff',
        ip: undefined,
      },
      action: 'read',
      resourceType: 'booking',
      resourceId: 'book-1',
      fieldName: undefined,
    });

    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ fieldName: null, ip: null }),
    );
  });

  it('logs access without field name or ip when omitted', async () => {
    await service.logAccess({
      context: {
        businessId: 'biz-1',
        userId: null,
        role: 'public',
      },
      action: 'write',
      resourceType: 'booking',
      resourceId: 'book-1',
    });

    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldName: null,
        ip: null,
        userId: null,
      }),
    );
  });

  it('logs a single PHI access event with optional ip', async () => {
    await service.logAccess({
      context: {
        businessId: 'biz-1',
        userId: 'user-1',
        role: 'manager',
        ip: '10.0.0.1',
      },
      action: 'read',
      resourceType: 'booking',
      resourceId: 'book-1',
      fieldName: 'notes',
    });

    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        userId: 'user-1',
        role: 'manager',
        action: 'read',
        fieldName: 'notes',
        ip: '10.0.0.1',
      }),
    );
    expect(auditRepo.save).toHaveBeenCalled();
  });

  it('logs batch writes for each touched PHI field', async () => {
    await service.logBatch(
      {
        businessId: 'biz-1',
        userId: 'user-1',
        role: 'staff',
      },
      'write',
      'booking',
      'book-1',
      ['notes', 'symptoms'],
    );

    expect(auditRepo.save).toHaveBeenCalledTimes(2);
  });

  it('skips batch logging when no fields are touched', async () => {
    await service.logBatch(
      { businessId: 'biz-1', userId: null, role: 'public' },
      'write',
      'booking',
      'book-1',
      [],
    );
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it('lists owner audit log with default pagination when options omitted', async () => {
    auditRepo.findAndCount.mockResolvedValue([[{ id: 'log-1' }], 1]);

    const result = await service.listForOwner('biz-1');

    expect(auditRepo.findAndCount).toHaveBeenCalledWith({
      where: { businessId: 'biz-1' },
      order: { createdAt: 'DESC' },
      take: 50,
      skip: 0,
    });
    expect(result.items).toHaveLength(1);
  });

  it.each([
    { limit: undefined, offset: undefined, expectedTake: 50, expectedSkip: 0 },
    { limit: '0', offset: '-3', expectedTake: 1, expectedSkip: 0 },
    { limit: '500', offset: '10', expectedTake: 200, expectedSkip: 10 },
  ])(
    'lists owner audit log with clamped pagination (limit=$limit offset=$offset)',
    async ({ limit, offset, expectedTake, expectedSkip }) => {
      auditRepo.findAndCount.mockResolvedValue([[{ id: 'log-1' }], 1]);

      const result = await service.listForOwner('biz-1', {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      expect(auditRepo.findAndCount).toHaveBeenCalledWith({
        where: { businessId: 'biz-1' },
        order: { createdAt: 'DESC' },
        take: expectedTake,
        skip: expectedSkip,
      });
      expect(result.total).toBe(1);
    },
  );

  it('purges audit rows older than the 6-year retention floor', async () => {
    const now = new Date('2026-06-05T12:00:00.000Z');
    auditRepo.delete.mockResolvedValue({ affected: 3 });

    const purged = await service.purgeExpired('biz-1', now);

    const expectedCutoff = new Date(
      now.getTime() - MIN_PHI_AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(auditRepo.delete).toHaveBeenCalledWith({
      businessId: 'biz-1',
      createdAt: LessThan(expectedCutoff),
    });
    expect(purged).toBe(3);
  });

  it('returns zero when purge delete reports no affected rows', async () => {
    auditRepo.delete.mockResolvedValue({ affected: undefined });
    await expect(service.purgeExpired('biz-1')).resolves.toBe(0);
  });
});
