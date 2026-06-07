import { ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
} from '../../common/utils/phi-encryption.util.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import { PatientEncounterPhiService } from './shared/patient-encounter-phi.service.js';
import { PatientEncountersService } from './patient-encounters.service.js';
import { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../compliance/phi-field.service.js';

describe('Patient encounters (integration)', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );
  const businessService = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic', hipaa: { enabled: true } },
    })),
    ensureMember: jest.fn(async () => ({ role: MemberRole.STAFF })),
  };
  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-provider', isActive: true })),
  };
  const customerRepo = {
    findOne: jest.fn(async () => ({ id: 'cust-1' })),
  };
  const bookingRepoAccess = {
    find: jest.fn(async () => [
      { employeeId: 'emp-provider', linkedEmployeeIds: [] },
    ]),
  };
  const encounterRepo = {
    find: jest.fn(async () => []),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...value,
      id: 'encounter-1',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    })),
  };
  const addendumRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(),
  };
  const storedAddenda: Array<Record<string, unknown>> = [];
  addendumRepo.save.mockImplementation(
    async (value: Record<string, unknown>) => {
      const saved = {
        ...value,
        id: value.id ?? `addendum-${storedAddenda.length + 1}`,
        createdAt: new Date('2026-06-03T10:00:00.000Z'),
        author: { name: 'Dr. Lee' },
      };
      const index = storedAddenda.findIndex((row) => row.id === saved.id);
      if (index >= 0) storedAddenda[index] = saved;
      else storedAddenda.push(saved);
      return saved;
    },
  );
  const bookingRepo = {
    find: jest.fn(async () => [
      {
        id: 'booking-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        employeeId: 'emp-provider',
        linkedEmployeeIds: [],
        status: BookingStatus.COMPLETED,
        startTime: new Date('2026-06-01T09:00:00.000Z'),
        endTime: new Date('2026-06-01T09:30:00.000Z'),
        service: {
          name: 'Consultation',
          metadata: { serviceType: 'consultation' },
        },
        employee: { name: 'Dr. Lee' },
      },
    ]),
    findOne: jest.fn(async () => ({
      id: 'booking-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      employeeId: 'emp-provider',
      linkedEmployeeIds: [],
      status: BookingStatus.COMPLETED,
      startTime: new Date('2026-06-01T09:00:00.000Z'),
      endTime: new Date('2026-06-01T09:30:00.000Z'),
      service: {
        name: 'Consultation',
        metadata: { serviceType: 'consultation' },
      },
      employee: { name: 'Dr. Lee' },
    })),
  };
  const phiFieldService = {
    isHipaaActiveForBusiness: jest.fn(() => true),
    resolveBusinessEncryptionKey: jest.fn(async () => businessKey),
  };
  const phiAccessAudit = new PhiAccessAuditService({
    create: jest.fn(),
    save: jest.fn(),
  } as never);
  const phiService = new PatientEncounterPhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit,
  );
  const accessService = new PatientClinicalProfileAccessService(
    businessService as any,
    employeeRepo as any,
    customerRepo as any,
    bookingRepoAccess as any,
  );
  const encountersService = new PatientEncountersService(
    encounterRepo as any,
    addendumRepo as any,
    bookingRepo as any,
    businessService as any,
    accessService,
    phiService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    encounterRepo.findOne.mockImplementation(
      async (query: { where: Record<string, string> }) => {
        if (query.where.bookingId) return null;
        if (query.where.id) {
          return {
            id: 'encounter-1',
            businessId: 'biz-1',
            customerId: 'cust-1',
            bookingId: 'booking-1',
            authorEmployeeId: 'emp-provider',
            visitNote:
              encounterRepo.save.mock.calls.at(-1)?.[0]?.visitNote ??
              'encrypted',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            updatedAt: new Date('2026-06-02T10:00:00.000Z'),
            booking: {
              id: 'booking-1',
              status: BookingStatus.COMPLETED,
              employeeId: 'emp-provider',
              linkedEmployeeIds: [],
              startTime: new Date('2026-06-01T09:00:00.000Z'),
              endTime: new Date('2026-06-01T09:30:00.000Z'),
              service: {
                name: 'Consultation',
                metadata: { serviceType: 'consultation' },
              },
              employee: { name: 'Dr. Lee' },
            },
            author: { name: 'Dr. Lee' },
            addenda: storedAddenda,
          };
        }
        return null;
      },
    );
  });

  it('creates visit note and appends addendum with PHI audit', async () => {
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    const detail = await encountersService.upsertEncounterForBooking(
      'biz-1',
      'cust-1',
      'booking-1',
      access,
      { visitNote: 'Subjective: cough. Plan: rest.' },
    );
    expect(detail.visitNote).toBe('Subjective: cough. Plan: rest.');

    const withAddendum = await encountersService.appendAddendum(
      'biz-1',
      'cust-1',
      detail.encounterId,
      access,
      { body: 'Addendum: patient called back with improvement.' },
    );
    expect(withAddendum.addenda).toHaveLength(1);
    expect(withAddendum.addenda[0]?.body).toBe(
      'Addendum: patient called back with improvement.',
    );
  });

  it('blocks unassigned provider from chart encounters', async () => {
    bookingRepoAccess.find.mockResolvedValueOnce([]);
    await expect(
      accessService.assertCustomerClinicalProfileAccess(
        'biz-1',
        'user-1',
        'cust-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
