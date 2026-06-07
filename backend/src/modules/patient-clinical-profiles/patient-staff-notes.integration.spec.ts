import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
} from '../../common/utils/phi-encryption.util.js';
import { PatientStaffNoteAccessService } from './shared/patient-staff-note-access.service.js';
import { PatientStaffNotePhiService } from './shared/patient-staff-note-phi.service.js';
import { PatientStaffNotesService } from './patient-staff-notes.service.js';
import { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../compliance/phi-field.service.js';

describe('Patient staff notes (integration)', () => {
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
  const storedNotes: Array<Record<string, unknown>> = [];
  const noteRepo = {
    find: jest.fn(async () =>
      storedNotes.map((note) => ({
        ...note,
        author: { name: 'Dr. Lee' },
      })),
    ),
    findOne: jest.fn(async (query: { where: { id: string } }) => {
      const note = storedNotes.find((row) => row.id === query.where.id);
      return note ? { ...note, author: { name: 'Dr. Lee' } } : null;
    }),
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const saved = {
        ...value,
        id: value.id ?? `note-${storedNotes.length + 1}`,
        createdAt: value.createdAt ?? new Date('2026-06-04T10:00:00.000Z'),
      };
      const index = storedNotes.findIndex((row) => row.id === saved.id);
      if (index >= 0) storedNotes[index] = saved;
      else storedNotes.push(saved);
      return saved;
    }),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => ({
      id: 'booking-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
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
  const phiService = new PatientStaffNotePhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit,
  );
  const accessService = new PatientStaffNoteAccessService(
    businessService as any,
    employeeRepo as any,
    customerRepo as any,
    bookingRepoAccess as any,
  );
  const staffNotesService = new PatientStaffNotesService(
    noteRepo as any,
    bookingRepo as any,
    businessService as any,
    accessService,
    phiService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    storedNotes.length = 0;
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-provider',
      isActive: true,
    });
    bookingRepoAccess.find.mockResolvedValue([
      { employeeId: 'emp-provider', linkedEmployeeIds: [] },
    ]);
  });

  it('creates and lists internal staff notes with PHI audit', async () => {
    const access = await accessService.assertCustomerStaffNoteAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    const created = await staffNotesService.createNoteForCustomer(
      'biz-1',
      'cust-1',
      access,
      { body: 'Coordinate follow-up labs before next visit.' },
    );
    expect(created.body).toBe('Coordinate follow-up labs before next visit.');
    expect(created.authorName).toBe('Dr. Lee');

    const list = await staffNotesService.listNotesForCustomer(
      'biz-1',
      'cust-1',
      access,
    );
    expect(list.notes).toHaveLength(1);
    expect(list.canCreate).toBe(true);
  });

  it('blocks receptionist-tier staff from staff notes', async () => {
    employeeRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      accessService.assertCustomerStaffNoteAccess('biz-1', 'user-1', 'cust-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks unassigned provider from staff notes', async () => {
    bookingRepoAccess.find.mockResolvedValueOnce([]);
    await expect(
      accessService.assertCustomerStaffNoteAccess('biz-1', 'user-1', 'cust-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects create when staff note write is not allowed', async () => {
    const access = await accessService.assertCustomerStaffNoteAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );
    await expect(
      staffNotesService.createNoteForCustomer(
        'biz-1',
        'cust-1',
        {
          ...access,
          canWrite: false,
        },
        { body: 'Should not save.' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('validates optional booking linkage on create', async () => {
    const access = await accessService.assertCustomerStaffNoteAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );
    bookingRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      staffNotesService.createNoteForCustomer('biz-1', 'cust-1', access, {
        body: 'Linked note',
        bookingId: 'missing-booking',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    bookingRepo.findOne.mockResolvedValueOnce({ id: 'booking-1' });
    const created = await staffNotesService.createNoteForCustomer(
      'biz-1',
      'cust-1',
      access,
      { body: 'Linked note', bookingId: 'booking-1' },
    );
    expect(created.bookingId).toBe('booking-1');
  });
});
