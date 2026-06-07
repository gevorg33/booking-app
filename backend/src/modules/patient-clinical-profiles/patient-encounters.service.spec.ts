import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { PatientEncountersService } from './patient-encounters.service.js';

describe('PatientEncountersService', () => {
  const encounterRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...value,
      id: value.id ?? 'encounter-1',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    })),
  };
  const addendumRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...value,
      id: value.id ?? 'addendum-1',
      createdAt: new Date('2026-06-03T10:00:00.000Z'),
    })),
  };
  const bookingRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const businessService = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic', hipaa: { enabled: true } },
    })),
  };
  const accessService = {
    toPhiStaffContext: jest.fn((ctx) => ({
      userId: ctx.userId,
      role: String(ctx.membershipRole),
      employeeId: ctx.employeeId,
    })),
  };
  const phiService = {
    encryptEncounterForStorage: jest.fn(async (_b, encounter) => encounter),
    decryptEncounterForStaff: jest.fn(async (_b, encounter) => encounter),
    auditEncounterPhiWrite: jest.fn(async () => undefined),
    encryptAddendumForStorage: jest.fn(async (_b, addendum) => addendum),
    decryptAddendumForStaff: jest.fn(async (_b, addendum) => addendum),
    auditAddendumPhiWrite: jest.fn(async () => undefined),
  };

  const service = new PatientEncountersService(
    encounterRepo as any,
    addendumRepo as any,
    bookingRepo as any,
    businessService as any,
    accessService as any,
    phiService as any,
  );

  const providerAccess = {
    ctx: {
      userId: 'user-1',
      membershipRole: MemberRole.STAFF,
      employeeId: 'emp-1',
    },
    phiAccess: { hasAssignedBooking: true },
  };

  const completedBooking = {
    id: 'booking-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    employeeId: 'emp-1',
    linkedEmployeeIds: [],
    status: BookingStatus.COMPLETED,
    startTime: new Date('2026-06-01T09:00:00.000Z'),
    endTime: new Date('2026-06-01T09:30:00.000Z'),
    service: {
      name: 'Consultation',
      metadata: { serviceType: 'consultation' },
    },
    employee: { name: 'Dr. Lee' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.find.mockResolvedValue([completedBooking]);
    bookingRepo.findOne.mockResolvedValue(completedBooking);
    encounterRepo.find.mockResolvedValue([]);
    encounterRepo.findOne.mockResolvedValue(null);
    phiService.decryptEncounterForStaff.mockImplementation(
      async (_b, encounter) => encounter,
    );
    phiService.decryptAddendumForStaff.mockImplementation(
      async (_b, addendum) => addendum,
    );
  });

  it('lists encounters with stored visit notes', async () => {
    encounterRepo.find.mockResolvedValue([
      {
        id: 'encounter-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        bookingId: 'booking-1',
        authorEmployeeId: 'emp-1',
        visitNote: 'Stored note',
        author: { name: 'Dr. Lee' },
        addenda: [{ id: 'addendum-1' }],
      },
    ]);
    phiService.decryptEncounterForStaff.mockResolvedValue({
      visitNote: 'Stored note',
    });

    const rows = await service.listEncountersForCustomer(
      'biz-1',
      'cust-1',
      providerAccess,
    );
    expect(rows[0]?.visitNote).toBe('Stored note');
    expect(rows[0]?.addendaCount).toBe(1);
    expect(rows[0]?.canAddAddendum).toBe(true);
  });

  it('rejects upsert for non-consultation bookings', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...completedBooking,
      service: { name: 'Lab test', metadata: { serviceType: 'lab_test' } },
    });
    await expect(
      service.upsertEncounterForBooking(
        'biz-1',
        'cust-1',
        'booking-1',
        providerAccess,
        { visitNote: 'Nope' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists completed consultation encounters', async () => {
    const rows = await service.listEncountersForCustomer(
      'biz-1',
      'cust-1',
      providerAccess,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.canAuthorVisitNote).toBe(true);
  });

  it('marks visit notes as masked when PHI is withheld', async () => {
    encounterRepo.find.mockResolvedValue([
      {
        id: 'encounter-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        bookingId: 'booking-1',
        authorEmployeeId: 'emp-1',
        visitNote: 'encrypted-note',
        author: { name: 'Dr. Lee' },
        addenda: [],
      },
    ]);
    phiService.decryptEncounterForStaff.mockResolvedValue({ visitNote: null });

    const rows = await service.listEncountersForCustomer(
      'biz-1',
      'cust-1',
      providerAccess,
    );
    expect(rows[0]?.phiMasked).toBe(true);
  });

  it('loads encounter detail by id', async () => {
    const savedEncounter = {
      id: 'encounter-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'booking-1',
      authorEmployeeId: 'emp-1',
      visitNote: 'Initial note',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
      booking: completedBooking,
      author: { name: 'Dr. Lee' },
      addenda: [],
    };
    encounterRepo.findOne.mockResolvedValue(savedEncounter);

    const detail = await service.getEncounterDetail(
      'biz-1',
      'cust-1',
      'encounter-1',
      providerAccess,
    );
    expect(detail.encounterId).toBe('encounter-1');
    expect(detail.visitNote).toBe('Initial note');
  });

  it('creates a visit note for a completed consultation', async () => {
    encounterRepo.findOne.mockImplementation(
      async (query: { where: Record<string, string> }) => {
        if (query.where.bookingId) return null;
        if (query.where.id === 'encounter-1') {
          return {
            id: 'encounter-1',
            businessId: 'biz-1',
            customerId: 'cust-1',
            bookingId: 'booking-1',
            authorEmployeeId: 'emp-1',
            visitNote: 'Initial note',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            updatedAt: new Date('2026-06-02T10:00:00.000Z'),
            booking: completedBooking,
            author: { name: 'Dr. Lee' },
            addenda: [],
          };
        }
        return null;
      },
    );

    const detail = await service.upsertEncounterForBooking(
      'biz-1',
      'cust-1',
      'booking-1',
      providerAccess,
      { visitNote: 'Initial note' },
    );

    expect(encounterRepo.save).toHaveBeenCalled();
    expect(phiService.auditEncounterPhiWrite).toHaveBeenCalled();
    expect(detail.visitNote).toBe('Initial note');
  });

  it('blocks unassigned provider from authoring visit notes', async () => {
    await expect(
      service.upsertEncounterForBooking(
        'biz-1',
        'cust-1',
        'booking-1',
        {
          ctx: {
            userId: 'user-2',
            membershipRole: MemberRole.STAFF,
            employeeId: 'emp-other',
          },
          phiAccess: { hasAssignedBooking: false },
        },
        { visitNote: 'Should fail' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires an initial visit note before addenda', async () => {
    encounterRepo.findOne.mockResolvedValue({
      id: 'encounter-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'booking-1',
      authorEmployeeId: 'emp-1',
      visitNote: '',
      booking: completedBooking,
    });

    await expect(
      service.appendAddendum('biz-1', 'cust-1', 'encounter-1', providerAccess, {
        body: 'Too early',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('appends addendum to an existing encounter', async () => {
    const savedEncounter = {
      id: 'encounter-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'booking-1',
      authorEmployeeId: 'emp-1',
      visitNote: 'Initial note',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
      booking: completedBooking,
      author: { name: 'Dr. Lee' },
      addenda: [],
    };

    encounterRepo.findOne.mockImplementation(
      async (query: { where: Record<string, string> }) => {
        if (query.where.id === 'encounter-1') {
          return {
            ...savedEncounter,
            addenda: [
              {
                id: 'addendum-1',
                encounterId: 'encounter-1',
                authorEmployeeId: 'emp-1',
                body: 'Follow-up documented.',
                author: { name: 'Dr. Lee' },
                createdAt: new Date('2026-06-03T10:00:00.000Z'),
              },
            ],
          };
        }
        if (query.where.bookingId) return savedEncounter;
        return null;
      },
    );

    const detail = await service.appendAddendum(
      'biz-1',
      'cust-1',
      'encounter-1',
      providerAccess,
      { body: 'Follow-up documented.' },
    );

    expect(addendumRepo.save).toHaveBeenCalled();
    expect(phiService.auditAddendumPhiWrite).toHaveBeenCalled();
    expect(detail.addenda).toHaveLength(1);
  });
});
