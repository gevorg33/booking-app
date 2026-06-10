import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { PatientStaffNotesService } from '../patient-clinical-profiles/patient-staff-notes.service.js';
import { PatientStaffNoteAccessService } from '../patient-clinical-profiles/shared/patient-staff-note-access.service.js';
import { PatientStaffNotePhiService } from '../patient-clinical-profiles/shared/patient-staff-note-phi.service.js';
import { ProviderMobileService } from './provider-mobile.service.js';

describe('ProviderMobileService customer staff notes (prov-exp-1.3)', () => {
  const employeeRepo = { findOne: jest.fn(), save: jest.fn() };
  const memberRepo = { find: jest.fn() };
  const bookingRepo = { findOne: jest.fn(), find: jest.fn(), count: jest.fn() };
  const slotRepo = { find: jest.fn() };
  const schedulingPeriodRepo = { find: jest.fn() };
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(),
  };
  const bookingService = { update: jest.fn(), cancel: jest.fn() };
  const bookingSlotResolver = { checkSlotAvailability: jest.fn(), describeUnavailable: jest.fn() };
  const retailPosService = { getBookingRetailSales: jest.fn() };
  const llm = { isAvailableForBusiness: jest.fn(), completeJson: jest.fn() };
  const clinicTestOrderService = { listLabQueue: jest.fn() };
  const clinicTestResultService = { listResultQueue: jest.fn() };
  const customerRepo = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
  const reviewRepo = { find: jest.fn(), exists: jest.fn().mockResolvedValue(false) };
  const patientClinicalProfilesService = { getProfileForCustomer: jest.fn() };
  const patientClinicalProfileAccessService = {
    assertCustomerClinicalProfileAccess: jest.fn(),
  };
  const clinicTasksService = {
    listClinicTasks: jest.fn(),
    claimClinicTask: jest.fn(),
    completeClinicTask: jest.fn(),
  };
  const loyaltyService = {
    getOrCreate: jest.fn(),
    getPublicSummary: jest.fn(),
  };

  const storedNotes: Array<Record<string, unknown>> = [];
  const noteRepo = {
    find: jest.fn(async () =>
      storedNotes.map((note) => ({
        ...note,
        author: { name: 'Alex Provider' },
      })),
    ),
    findOne: jest.fn(async (query: { where: { id: string } }) => {
      const note = storedNotes.find((row) => row.id === query.where.id);
      return note ? { ...note, author: { name: 'Alex Provider' } } : null;
    }),
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const saved = {
        ...value,
        id: value.id ?? `note-${storedNotes.length + 1}`,
        createdAt: value.createdAt ?? new Date('2026-06-04T10:00:00.000Z'),
      };
      storedNotes.push(saved);
      return saved;
    }),
  };
  const staffNoteAccessService = new PatientStaffNoteAccessService(
    businessService as any,
    employeeRepo as any,
    customerRepo as any,
    bookingRepo as any,
  );
  const phiService = {
    encryptNoteForStorage: jest.fn(async (_business, note) => note),
    decryptNoteForStaff: jest.fn(async (_business, note) => note),
    auditNotePhiWrite: jest.fn(async () => undefined),
  };
  const staffNotesService = new PatientStaffNotesService(
    noteRepo as any,
    bookingRepo as any,
    businessService as any,
    staffNoteAccessService,
    phiService as any,
  );

  const service = new ProviderMobileService(
    employeeRepo as any,
    memberRepo as any,
    bookingRepo as any,
    slotRepo as any,
    schedulingPeriodRepo as any,
    businessService as any,
    bookingService as any,
    bookingSlotResolver as any,
    retailPosService as any,
    { create: jest.fn() } as any,
    { createRequest: jest.fn(), listForEmployee: jest.fn() } as any,
    llm as any,
    clinicTestOrderService as any,
    clinicTestResultService as any,
    customerRepo as any,
    reviewRepo as any,
    patientClinicalProfilesService as any,
    patientClinicalProfileAccessService as any,
    clinicTasksService as any,
    loyaltyService as any,
    staffNotesService,
    staffNoteAccessService,
    { findOne: jest.fn() } as any,
    { findOne: jest.fn() } as any,
    { find: jest.fn() } as any,
    { hasPublishedIntakeQuestionnaire: jest.fn() } as any,
    {
      getPublishedQuestionnaireOrThrow: jest.fn(),
      loadFlowContext: jest.fn(),
    } as any,
    { getResponseFlow: jest.fn() } as any,
    { sendReviewRequest: jest.fn() } as any,
    { ensureReviewToken: jest.fn() } as any,
    { isConfigured: true, sendToUser: jest.fn().mockResolvedValue(1) } as any,
  );

  const linkedEmployee = {
    id: 'emp-1',
    name: 'Alex Provider',
    userId: 'user-1',
    businessId: 'biz-1',
    isActive: true,
  };

  const bookingRecord = {
    id: 'bk-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    customerId: 'cust-1',
    status: BookingStatus.CONFIRMED,
    customer: { id: 'cust-1', name: 'Jane Doe' },
    service: { id: 'svc-1', name: 'Haircut' },
    employee: linkedEmployee,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    storedNotes.length = 0;
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'salon' },
    });
    employeeRepo.findOne.mockResolvedValue(linkedEmployee);
    bookingRepo.findOne.mockResolvedValue(bookingRecord);
    customerRepo.findOne.mockResolvedValue({ id: 'cust-1' });
  });

  it('lists staff notes for an accessible booking customer', async () => {
    storedNotes.push({
      id: 'note-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      authorEmployeeId: 'emp-1',
      bookingId: 'bk-old',
      body: 'Prefers window seat',
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
    });

    const list = await service.listBookingCustomerStaffNotes(
      'biz-1',
      'user-1',
      'bk-1',
    );

    expect(list.notes).toHaveLength(1);
    expect(list.notes[0]?.body).toBe('Prefers window seat');
    expect(list.canCreate).toBe(true);
    expect(list.maxLength).toBe(500);
  });

  it('creates a staff note linked to the booking and returns dashboard-synced data', async () => {
    const created = await service.createBookingCustomerStaffNote(
      'biz-1',
      'user-1',
      'bk-1',
      { body: 'Allergic to latex' },
    );

    expect(created.note.body).toBe('Allergic to latex');
    expect(created.note.bookingId).toBe('bk-1');

    const dashboardList = await staffNotesService.listNotesForCustomer(
      'biz-1',
      'cust-1',
      {
        ctx: {
          userId: 'user-1',
          membershipRole: MemberRole.STAFF,
          employeeId: 'emp-1',
        },
        phiAccess: { hasAssignedBooking: true },
        canWrite: true,
      },
    );
    expect(dashboardList.notes[0]?.body).toBe('Allergic to latex');
  });

  it('rejects walk-in bookings without a customer', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...bookingRecord,
      customerId: null,
      customer: null,
    });

    await expect(
      service.listBookingCustomerStaffNotes('biz-1', 'user-1', 'bk-walkin'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
