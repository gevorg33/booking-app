import { resolvePatientClinicalCustomer } from './ai-patient-clinical-mutations.util.js';
import {
  handleAddCustomerStaffNoteLogic,
  handleCreateEncounterAddendumLogic,
  handleDismissPatientAlertLogic,
  handleListCustomerStaffNotesLogic,
  handleReleasePatientDocumentLogic,
  handleUpdateClinicalProfileLogic,
  handleUpdateEncounterByBookingLogic,
  type PatientClinicalMutationsLogicDeps,
} from './ai-patient-clinical-mutations.logic.js';

describe('ai-patient-clinical-mutations.logic', () => {
  const maria = { id: 'cust-maria', name: 'Maria Lopez', businessId: 'biz-1' };

  const customerRepo = {
    find: jest.fn(async () => [maria]),
    findOne: jest.fn(async () => null),
  };
  const profileAccess = {
    ctx: { userId: 'user-1', membershipRole: 'owner', employeeId: null },
    phiAccess: { hasAssignedBooking: false },
  };
  const staffNoteAccess = {
    ctx: { userId: 'user-1', membershipRole: 'owner', employeeId: null },
    phiAccess: { hasAssignedBooking: false },
    canWrite: true,
  };

  const profilesService = {
    upsertProfileForCustomer: jest.fn(
      async (
        _businessId: string,
        _customerId: string,
        _access: unknown,
        dto: Record<string, unknown>,
      ) => ({ id: 'profile-1', ...dto }),
    ),
  };
  const profileAccessService = {
    assertCustomerClinicalProfileAccess: jest.fn(async () => profileAccess),
  };
  const documentsService = {
    updateDocumentReleaseForCustomer: jest.fn(
      async (
        _businessId: string,
        _customerId: string,
        documentId: string,
        _access: unknown,
        releasedToPatient: boolean,
      ) => ({ id: documentId, title: 'Lab report', releasedToPatient }),
    ),
  };
  const encountersService = {
    appendAddendum: jest.fn(async () => ({ id: 'encounter-1', addenda: [] })),
    upsertEncounterForBooking: jest.fn(async () => ({ id: 'encounter-1' })),
    listEncountersForCustomer: jest.fn(async () => [
      { encounterId: 'encounter-1', bookingId: 'booking-1' },
      { encounterId: null, bookingId: 'booking-2' },
    ]),
  };
  const staffNotesService = {
    listNotesForCustomer: jest.fn(async () => ({
      notes: [{ id: 'note-1', body: 'Prefers morning slots' }],
      canCreate: true,
    })),
    createNoteForCustomer: jest.fn(
      async (
        _businessId: string,
        _customerId: string,
        _access: unknown,
        dto: Record<string, unknown>,
      ) => ({ id: 'note-2', ...dto }),
    ),
  };
  const staffNoteAccessService = {
    assertCustomerStaffNoteAccess: jest.fn(async () => staffNoteAccess),
  };
  const alertsService = {
    dismissAlert: jest.fn(async () => ({ ok: true })),
  };

  const deps: PatientClinicalMutationsLogicDeps = {
    customerRepo: customerRepo as any,
    profilesService: profilesService as any,
    profileAccessService: profileAccessService as any,
    documentsService: documentsService as any,
    encountersService: encountersService as any,
    staffNotesService: staffNotesService as any,
    staffNoteAccessService: staffNoteAccessService as any,
    alertsService: alertsService as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepo.find.mockResolvedValue([maria]);
  });

  describe('handleUpdateClinicalProfileLogic', () => {
    it('clarifies when no customer is given', async () => {
      const result = await handleUpdateClinicalProfileLogic(
        deps,
        'biz-1',
        'user-1',
        {},
      );
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('clarifies when no field is given', async () => {
      const result = await handleUpdateClinicalProfileLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
        },
      );
      expect(result.success).toBe(false);
      expect(
        profileAccessService.assertCustomerClinicalProfileAccess,
      ).not.toHaveBeenCalled();
    });

    it('updates the clinical profile', async () => {
      const result = await handleUpdateClinicalProfileLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          bloodType: 'O+',
        },
      );
      expect(result.success).toBe(true);
      expect(profilesService.upsertProfileForCustomer).toHaveBeenCalledWith(
        'biz-1',
        'cust-maria',
        profileAccess,
        { bloodType: 'O+' },
      );
    });
  });

  describe('handleDismissPatientAlertLogic', () => {
    it('clarifies when alertType/sourceId missing', async () => {
      const result = await handleDismissPatientAlertLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
        },
      );
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('rejects an unknown alert type', async () => {
      const result = await handleDismissPatientAlertLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          alertType: 'NotARealType',
          sourceId: 'src-1',
        },
      );
      expect(result.success).toBe(false);
      expect(alertsService.dismissAlert).not.toHaveBeenCalled();
    });

    it('dismisses the alert', async () => {
      const result = await handleDismissPatientAlertLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          alertType: 'IntakeIncomplete',
          sourceId: 'src-1',
        },
      );
      expect(result.success).toBe(true);
      expect(alertsService.dismissAlert).toHaveBeenCalledWith(
        'biz-1',
        'cust-maria',
        'user-1',
        'IntakeIncomplete',
        'src-1',
      );
    });
  });

  describe('handleReleasePatientDocumentLogic', () => {
    it('clarifies when documentId missing', async () => {
      const result = await handleReleasePatientDocumentLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
        },
      );
      expect(result.success).toBe(false);
    });

    it('releases the document (default true)', async () => {
      const result = await handleReleasePatientDocumentLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          documentId: 'doc-1',
        },
      );
      expect(result.success).toBe(true);
      expect(
        documentsService.updateDocumentReleaseForCustomer,
      ).toHaveBeenCalledWith(
        'biz-1',
        'cust-maria',
        'doc-1',
        profileAccess,
        true,
      );
    });

    it('revokes the document when releasedToPatient=false', async () => {
      const result = await handleReleasePatientDocumentLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          documentId: 'doc-1',
          releasedToPatient: false,
        },
      );
      expect(result.success).toBe(true);
      expect(result.summary).toMatch(/Revoked/);
    });
  });

  describe('handleCreateEncounterAddendumLogic', () => {
    it('clarifies when body missing', async () => {
      const result = await handleCreateEncounterAddendumLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          bookingId: 'booking-1',
        },
      );
      expect(result.success).toBe(false);
    });

    it('resolves encounterId from bookingId', async () => {
      const result = await handleCreateEncounterAddendumLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          bookingId: 'booking-1',
          body: 'Follow-up scheduled',
        },
      );
      expect(result.success).toBe(true);
      expect(encountersService.appendAddendum).toHaveBeenCalledWith(
        'biz-1',
        'cust-maria',
        'encounter-1',
        profileAccess,
        { body: 'Follow-up scheduled' },
      );
    });

    it('fails when the booking has no visit note yet', async () => {
      const result = await handleCreateEncounterAddendumLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          bookingId: 'booking-2',
          body: 'Follow-up scheduled',
        },
      );
      expect(result.success).toBe(false);
      expect(encountersService.appendAddendum).not.toHaveBeenCalled();
    });

    it('uses encounterId directly when given', async () => {
      const result = await handleCreateEncounterAddendumLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          encounterId: 'encounter-9',
          body: 'Note',
        },
      );
      expect(result.success).toBe(true);
      expect(encountersService.appendAddendum).toHaveBeenCalledWith(
        'biz-1',
        'cust-maria',
        'encounter-9',
        profileAccess,
        { body: 'Note' },
      );
    });
  });

  describe('handleUpdateEncounterByBookingLogic', () => {
    it('clarifies when bookingId/visitNote missing', async () => {
      const result = await handleUpdateEncounterByBookingLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
        },
      );
      expect(result.success).toBe(false);
    });

    it('upserts the encounter', async () => {
      const result = await handleUpdateEncounterByBookingLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          bookingId: 'booking-1',
          visitNote: 'Patient reports mild headache',
        },
      );
      expect(result.success).toBe(true);
      expect(encountersService.upsertEncounterForBooking).toHaveBeenCalledWith(
        'biz-1',
        'cust-maria',
        'booking-1',
        profileAccess,
        { visitNote: 'Patient reports mild headache' },
      );
    });
  });

  describe('handleListCustomerStaffNotesLogic', () => {
    it('clarifies without a customer', async () => {
      const result = await handleListCustomerStaffNotesLogic(
        deps,
        'biz-1',
        'user-1',
        {},
      );
      expect(result.success).toBe(false);
    });

    it('lists staff notes', async () => {
      const result = await handleListCustomerStaffNotesLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
        },
      );
      expect(result.success).toBe(true);
      expect(result.details.notes).toHaveLength(1);
    });
  });

  describe('handleAddCustomerStaffNoteLogic', () => {
    it('clarifies when body missing', async () => {
      const result = await handleAddCustomerStaffNoteLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
        },
      );
      expect(result.success).toBe(false);
    });

    it('adds a staff note', async () => {
      const result = await handleAddCustomerStaffNoteLogic(
        deps,
        'biz-1',
        'user-1',
        {
          customerName: 'Maria',
          body: 'Prefers text reminders',
          bookingId: 'booking-1',
        },
      );
      expect(result.success).toBe(true);
      expect(staffNotesService.createNoteForCustomer).toHaveBeenCalledWith(
        'biz-1',
        'cust-maria',
        staffNoteAccess,
        { body: 'Prefers text reminders', bookingId: 'booking-1' },
      );
    });
  });
});

/**
 * e2e-bug.443 — the patient lookup no longer scans an arbitrary slice.
 *
 * It read `{ where: { businessId }, take: 200 }` with no `order` and no
 * `isActive`, then matched in memory — on a path that writes to a **patient
 * chart**. Past 200 customers a real patient was simply not in the set;
 * deactivated customers were candidates; and which 200 you got could vary
 * between identical calls.
 *
 * These assert the *query*, because that is where all three faults lived — the
 * in-memory tie-break below it was always fine.
 */
describe('e2e-bug.443 — clinical patient lookup query', () => {
  // Local mock: the `customerRepo` above is scoped to its own describe.
  const customerRepo = { find: jest.fn(), findOne: jest.fn() };

  const findArgs = async (name: string) => {
    customerRepo.find.mockResolvedValue([]);
    await resolvePatientClinicalCustomer(
      { customerRepo } as any,
      'biz-1',
      { customerName: name },
    );
    return customerRepo.find.mock.calls.at(-1)?.[0] ?? {};
  };

  it('excludes deactivated customers', async () => {
    expect((await findArgs('Maria')).where).toMatchObject({ isActive: true });
  });

  it('filters by name in the database rather than scanning', async () => {
    // The cap must bound *matching* rows, not arbitrary ones.
    const where = (await findArgs('Maria')).where as any;
    expect(where.name).toBeDefined();
    expect(String(where.name.value ?? where.name)).toContain('maria');
  });

  it('orders deterministically so repeated calls agree', async () => {
    expect((await findArgs('Maria')).order).toBeDefined();
  });

  it('escapes LIKE metacharacters in the name', async () => {
    // "50%_off" must match literally, not as a wildcard.
    const where = (await findArgs('50%_off')).where as any;
    const pattern = String(where.name.value ?? where.name);
    expect(pattern).toContain('\\%');
    expect(pattern).toContain('\\_');
  });
});
