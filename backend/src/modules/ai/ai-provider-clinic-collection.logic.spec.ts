import {
  handleListMyCollectionQueueLogic,
  handleMarkSpecimenCollectedLogic,
} from './ai-provider-clinic-collection.logic.js';
import {
  LIST_MY_COLLECTION_QUEUE_PROMPTS,
  MARK_SPECIMEN_COLLECTED_PROMPTS,
} from './ai-provider-clinic-collection.fixtures.js';

describe('ai-provider-clinic-collection.logic', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    })),
  };
  const clinicSpecimenService = {
    listSpecimens: jest.fn(async () => [
      {
        id: 'spec-1',
        status: 'NotCollected',
        specimenIdentifier: 'SP-001',
        orderId: 'order-1',
        orderDisplayNames: 'CBC',
        bookingId: 'booking-1',
        customerName: 'Maria Lopez',
        bookingStartTime: '2026-06-08T10:00:00.000Z',
        employeeName: 'Dr. Smith',
        department: 'Lab',
        collectedAt: null,
        storageLocationName: null,
        transportFolderCode: null,
        createdAt: new Date('2026-06-08T09:00:00.000Z'),
      },
    ]),
    getSpecimenForBusiness: jest.fn(async () => ({
      id: 'spec-abc123',
      status: 'NotCollected',
      orderId: 'order-abc123',
      bookingId: 'booking-1',
      specimenIdentifier: 'SP-ABC',
      collectedAt: null,
      createdAt: new Date('2026-06-08T09:00:00.000Z'),
    })),
  };
  const clinicSpecimenStatusService = {
    transitionSpecimenStatus: jest.fn(async () => ({
      id: 'spec-1',
      status: 'Collected',
      orderId: 'order-1',
      collectedAt: new Date('2026-06-08T11:00:00.000Z'),
    })),
  };
  const clinicLabAccessService = {
    assertSpecimenLabAccess: jest.fn(async () => ({
      employeeId: 'emp-1',
      userId: 'user-1',
    })),
  };

  const deps = {
    businessRepo,
    clinicSpecimenService,
    clinicSpecimenStatusService,
    clinicLabAccessService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(LIST_MY_COLLECTION_QUEUE_PROMPTS.slice(0, 3))(
    'returns collection queue for prompt $id',
    async ({ prompt }) => {
      const result = await handleListMyCollectionQueueLogic(
        deps,
        'biz-1',
        { sessionEmployeeId: 'emp-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('list_my_collection_queue');
      expect(result.summary).toContain('Maria Lopez');
      expect(clinicSpecimenService.listSpecimens).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ view: 'collection', employeeId: 'emp-1' }),
      );
    },
  );

  it.each(MARK_SPECIMEN_COLLECTED_PROMPTS.slice(0, 2))(
    'marks specimen collected for prompt $id',
    async ({ prompt, customerName }) => {
      const result = await handleMarkSpecimenCollectedLogic(
        deps,
        'biz-1',
        'user-1',
        { sessionEmployeeId: 'emp-1', customerName },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('mark_specimen_collected');
      expect(
        clinicSpecimenStatusService.transitionSpecimenStatus,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ toStatus: 'Collected', businessId: 'biz-1' }),
      );
    },
  );

  it('marks specimen collected by specimen id', async () => {
    const result = await handleMarkSpecimenCollectedLogic(
      deps,
      'biz-1',
      'user-1',
      { sessionEmployeeId: 'emp-1', specimenId: 'abc123' },
      'Mark specimen #abc123 collected',
    );
    expect(result.success).toBe(true);
    expect(
      clinicSpecimenStatusService.transitionSpecimenStatus,
    ).toHaveBeenCalled();
  });

  it('returns empty queue summary', async () => {
    clinicSpecimenService.listSpecimens.mockResolvedValueOnce([]);
    const result = await handleListMyCollectionQueueLogic(
      deps,
      'biz-1',
      { sessionEmployeeId: 'emp-1' },
      'Show my collection queue today',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('empty');
  });

  it('fails when specimen is not on queue', async () => {
    const result = await handleMarkSpecimenCollectedLogic(
      deps,
      'biz-1',
      'user-1',
      { sessionEmployeeId: 'emp-1', customerName: 'John' },
      'Mark specimen collected for John',
    );
    expect(result.success).toBe(false);
  });

  it('falls back to queue prefix when specimen id lookup fails', async () => {
    clinicSpecimenService.getSpecimenForBusiness.mockRejectedValueOnce(
      new Error('not found'),
    );
    const result = await handleMarkSpecimenCollectedLogic(
      deps,
      'biz-1',
      'user-1',
      { sessionEmployeeId: 'emp-1', specimenId: 'spec' },
      'Mark specimen spec collected',
    );
    expect(result.success).toBe(true);
  });

  it('surfaces lab access errors', async () => {
    clinicLabAccessService.assertSpecimenLabAccess.mockRejectedValueOnce(
      new Error('You do not have access to lab records for this specimen'),
    );
    const result = await handleMarkSpecimenCollectedLogic(
      deps,
      'biz-1',
      'user-1',
      { sessionEmployeeId: 'emp-1', customerName: 'Maria' },
      'Mark specimen collected for Maria',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('access');
  });

  it('returns business not found for queue list', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleListMyCollectionQueueLogic(
      deps,
      'missing',
      { sessionEmployeeId: 'emp-1' },
      'Show my collection queue today',
    );
    expect(result.success).toBe(false);
  });

  it('clarifies when specimen target is missing', async () => {
    const result = await handleMarkSpecimenCollectedLogic(
      deps,
      'biz-1',
      'user-1',
      { sessionEmployeeId: 'emp-1' },
      'Mark specimen collected',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('blocks non-clinic businesses', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    const result = await handleListMyCollectionQueueLogic(
      deps,
      'biz-1',
      { sessionEmployeeId: 'emp-1' },
      'Show my collection queue today',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('clinic');
  });
});
