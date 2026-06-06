import { ConfigService } from '@nestjs/config';
import { BookingStatus, PaymentStatus } from './entities/booking.entity.js';
import { BookingService } from './booking.service.js';
import { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../compliance/phi-field.service.js';
import { BusinessService } from '../business/business.service.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import type { Business } from '../business/entities/business.entity.js';

const hipaaBusiness = (): Business =>
  ({
    id: 'biz-clinic',
    timezone: 'UTC',
    settings: {
      businessType: 'clinic',
      hipaa: {
        enabled: true,
        baaAcceptedAt: '2026-01-01T00:00:00.000Z',
        sessionTimeoutMinutes: 15,
      },
    },
  }) as Business;

function createHarness(staffEmployeeId: string | null) {
  const auditRepo = {
    create: jest.fn((row: unknown) => row),
    save: jest.fn(async (row: unknown) => ({
      ...(row as object),
      id: 'audit-1',
    })),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'PHI_ENCRYPTION_MASTER_KEY' ? 'phi-test-master' : undefined,
    ),
  } as unknown as ConfigService;
  let savedBusiness = hipaaBusiness();
  const businessRepo = {
    findOne: jest.fn(async () => savedBusiness),
    save: jest.fn(async (b: Business) => {
      savedBusiness = b;
      return b;
    }),
  };
  const phiAudit = new PhiAccessAuditService(auditRepo as never);
  const phiFieldService = new PhiFieldService(
    config,
    businessRepo as never,
    phiAudit,
  );
  const businessService = {
    ensureMember: jest.fn(async () => ({ role: MemberRole.STAFF })),
  } as unknown as BusinessService;
  const employeeRepo = {
    findOne: jest.fn(async () =>
      staffEmployeeId ? { id: staffEmployeeId } : null,
    ),
  };
  const bookingRepo = { findOne: jest.fn() };

  const bookingService = new BookingService(
    bookingRepo as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    businessRepo as never,
    employeeRepo as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    phiFieldService,
    businessService,
  );

  return {
    bookingService,
    bookingRepo,
    phiFieldService,
    businessRepo,
    auditRepo,
  };
}

describe('Sprint 37 — booking PHI minimum necessary access', () => {
  it('masks PHI for staff viewing another provider booking', async () => {
    const { bookingService, bookingRepo, phiFieldService, businessRepo } =
      createHarness('emp-self');
    const business = hipaaBusiness();
    const encrypted = await phiFieldService.encryptBookingForStorage(business, {
      notes: 'Private intake',
      metadata: { symptoms: 'Nausea' },
    });

    bookingRepo.findOne.mockResolvedValue({
      id: 'book-1',
      businessId: 'biz-clinic',
      employeeId: 'emp-other',
      linkedEmployeeIds: [],
      notes: encrypted.notes,
      metadata: encrypted.metadata,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.NOT_APPLICABLE,
    });

    const result = await bookingService.findOne('book-1', {
      staffUserId: 'staff-1',
    });

    expect(result.notes).toBeNull();
    expect(result.metadata?.symptoms).toBeUndefined();
    expect(businessRepo.findOne).toHaveBeenCalled();
  });

  it('decrypts PHI for staff assigned to the booking', async () => {
    const { bookingService, bookingRepo, phiFieldService } =
      createHarness('emp-self');
    const business = hipaaBusiness();
    const encrypted = await phiFieldService.encryptBookingForStorage(business, {
      notes: 'Assigned note',
    });

    bookingRepo.findOne.mockResolvedValue({
      id: 'book-2',
      businessId: 'biz-clinic',
      employeeId: 'emp-self',
      linkedEmployeeIds: [],
      notes: encrypted.notes,
      metadata: {},
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.NOT_APPLICABLE,
    });

    const result = await bookingService.findOne('book-2', {
      staffUserId: 'staff-1',
    });

    expect(result.notes).toBe('Assigned note');
  });
});
