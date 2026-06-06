import { ConfigService } from '@nestjs/config';
import { BookingStatus, PaymentStatus } from './entities/booking.entity.js';
import { BookingService } from './booking.service.js';
import { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../compliance/phi-field.service.js';
import { BusinessService } from '../business/business.service.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Booking } from './entities/booking.entity.js';

const hipaaBusiness = (): Business =>
  ({
    id: 'biz-clinic',
    name: 'City Clinic',
    timezone: 'UTC',
    settings: {
      businessType: 'clinic',
      hipaa: {
        enabled: true,
        baaAcceptedAt: '2026-01-01T00:00:00.000Z',
        baaAcceptedByUserId: 'owner-1',
        baaVersion: '1.0',
        sessionTimeoutMinutes: 15,
      },
    },
  }) as Business;

function createBookingPhiHarness() {
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
    ensureMember: jest.fn(async () => ({ role: MemberRole.MANAGER })),
  } as unknown as BusinessService;
  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-1' })),
  };

  const bookingRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

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
    businessRepo,
    auditRepo,
    phiFieldService,
  };
}

describe('Sprint 37 — booking PHI compliance integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findOne decrypts PHI for authenticated staff and logs read audit', async () => {
    const {
      bookingService,
      bookingRepo,
      businessRepo,
      auditRepo,
      phiFieldService,
    } = createBookingPhiHarness();
    const business = hipaaBusiness();
    businessRepo.findOne.mockResolvedValue(business);

    const encrypted = await phiFieldService.encryptBookingForStorage(business, {
      notes: 'Confidential intake',
      metadata: { referralNotes: 'Dr Lee', symptoms: 'Nausea' },
    });
    const savedBusiness = businessRepo.save.mock.calls.at(-1)?.[0] as Business;

    const storedBooking = {
      id: 'book-phi-1',
      businessId: 'biz-clinic',
      employeeId: 'emp-1',
      linkedEmployeeIds: [],
      notes: encrypted.notes,
      metadata: encrypted.metadata,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.NOT_APPLICABLE,
      employee: { id: 'emp-1', name: 'Dr A' },
      service: { id: 'svc-1', name: 'Consult' },
      customer: { id: 'cust-1', name: 'Pat' },
    } as Booking;
    bookingRepo.findOne.mockResolvedValue(storedBooking);

    const result = await bookingService.findOne('book-phi-1', {
      staffUserId: 'staff-1',
    });

    expect(result.notes).toBe('Confidential intake');
    expect(result.metadata?.referralNotes).toBe('Dr Lee');
    expect(result.metadata?.symptoms).toBe('Nausea');
    expect(auditRepo.save).toHaveBeenCalled();
    expect(savedBusiness.settings.hipaa).toMatchObject(
      expect.objectContaining({
        phiEncryptionKeyId: expect.any(String),
        phiEncryptionKeyEnc: expect.any(String),
      }),
    );
  });

  it('findOne returns encrypted PHI when no staff context is provided', async () => {
    const { bookingService, bookingRepo, businessRepo, phiFieldService } =
      createBookingPhiHarness();
    const business = hipaaBusiness();
    businessRepo.findOne.mockResolvedValue(business);
    const encrypted = await phiFieldService.encryptBookingForStorage(business, {
      notes: 'Hidden',
    });

    bookingRepo.findOne.mockResolvedValue({
      id: 'book-phi-2',
      businessId: 'biz-clinic',
      notes: encrypted.notes,
      metadata: {},
    });

    const result = await bookingService.findOne('book-phi-2');
    expect(result.notes).toContain('phi:v1:');
  });

  it('searchDashboard decrypts notes for staff search results', async () => {
    const { bookingService, bookingRepo, businessRepo, phiFieldService } =
      createBookingPhiHarness();
    const business = hipaaBusiness();
    businessRepo.findOne.mockResolvedValue(business);
    const encrypted = await phiFieldService.encryptBookingForStorage(business, {
      notes: 'Dashboard note',
    });

    const qb = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
      getManyAndCount: jest.fn(),
    };
    qb.leftJoinAndSelect.mockReturnValue(qb);
    qb.where.mockReturnValue(qb);
    qb.andWhere.mockReturnValue(qb);
    qb.orderBy.mockReturnValue(qb);
    qb.skip.mockReturnValue(qb);
    qb.take.mockReturnValue(qb);
    qb.getManyAndCount.mockResolvedValue([
      [
        {
          id: 'book-phi-3',
          businessId: 'biz-clinic',
          notes: encrypted.notes,
          metadata: {},
          startTime: new Date('2026-06-10T10:00:00.000Z'),
          endTime: new Date('2026-06-10T10:30:00.000Z'),
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.NOT_APPLICABLE,
          hiddenFromCalendar: false,
          createdAt: new Date('2026-06-01T00:00:00.000Z'),
          updatedAt: new Date('2026-06-01T00:00:00.000Z'),
          customer: null,
          employee: null,
          service: null,
        },
      ],
      1,
    ]);
    bookingRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await bookingService.searchDashboard(
      'biz-clinic',
      {},
      'staff-1',
    );

    expect(result.appointments[0].notes).toBe('Dashboard note');
    expect(result.totalItems).toBe(1);
  });

  it.each([
    { businessType: 'hair_salon', hipaaEnabled: true, expectEncrypted: false },
    { businessType: 'clinic', hipaaEnabled: false, expectEncrypted: false },
    { businessType: 'clinic', hipaaEnabled: true, expectEncrypted: true },
  ])(
    'HIPAA encryption matrix: type=$businessType enabled=$hipaaEnabled',
    async ({ businessType, hipaaEnabled, expectEncrypted }) => {
      const { phiFieldService } = createBookingPhiHarness();
      const business = {
        id: 'biz-matrix',
        settings: {
          businessType,
          hipaa: {
            enabled: hipaaEnabled,
            baaAcceptedAt: hipaaEnabled ? '2026-01-01' : null,
          },
        },
      } as Business;

      const result = await phiFieldService.encryptBookingForStorage(business, {
        notes: 'Matrix note',
        metadata: { symptoms: 'test' },
      });

      if (expectEncrypted) {
        expect(result.notes).toContain('phi:v1:');
      } else {
        expect(result.notes).toBe('Matrix note');
        expect(result.metadata?.symptoms).toBe('test');
      }
    },
  );
});
