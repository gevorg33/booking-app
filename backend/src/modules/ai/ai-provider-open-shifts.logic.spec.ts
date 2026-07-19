import {
  handleBookWalkInGapLogic,
  handleDraftWaitlistOfferMessageLogic,
  handleListRebookingCandidatesLogic,
  handleListWaitlistForMyServicesLogic,
  handleSuggestWaitlistForGapLogic,
} from './ai-provider-open-shifts.logic.js';
import { buildFillGapAiPrompt } from '../provider-mobile/provider-open-shifts.util.js';

describe('ai-provider-open-shifts.logic (prov-exp-7.3)', () => {
  const businessService = { findOne: jest.fn() };
  const periodRepo = { find: jest.fn() };
  const customerRepo = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };
  const bookingRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const serviceRepo = { find: jest.fn() };
  const employeeRepo = { findOne: jest.fn() };
  const bookingService = { create: jest.fn() };

  const deps = {
    businessService: businessService as any,
    periodRepo: periodRepo as any,
    customerRepo: customerRepo as any,
    bookingRepo: bookingRepo as any,
    serviceRepo: serviceRepo as any,
    employeeRepo: employeeRepo as any,
    bookingService: bookingService as any,
  };

  function mockWaitlist(customers: unknown[]) {
    customerRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(customers),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { providerOpenShifts: { enabled: true } },
    });
    periodRepo.find.mockResolvedValue([]);
    mockWaitlist([
      { id: 'c1', name: 'Anna' },
      { id: 'c2', name: 'Ben' },
    ]);
  });

  it('resolves ISO gap date from Fill-this-gap UI prompt when params.date is missing (e2e-bug.67)', async () => {
    const prompt = buildFillGapAiPrompt('2026-07-15', {
      startTime: '09:00',
      endTime: '19:00',
    });

    const result = await handleSuggestWaitlistForGapLogic(
      deps,
      'biz-1',
      'emp-1',
      prompt,
      {},
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('suggest_waitlist_for_gap');
    expect(result.details?.date).toBe('2026-07-15');
    expect(result.summary).not.toContain('Specify the gap date');
  });

  it('still clarifies when neither params nor prompt contain a date (e2e-bug.67)', async () => {
    const result = await handleSuggestWaitlistForGapLogic(
      deps,
      'biz-1',
      'emp-1',
      'Fill this gap from waitlist',
      {},
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Specify the gap date');
    expect(result.details?.clarify).toBe(true);
  });

  it('drafts a copy-only offer message for the top waitlist candidate (ai-cmd-provider-5.5.3)', async () => {
    const result = await handleDraftWaitlistOfferMessageLogic(
      deps,
      'biz-1',
      'emp-1',
      'Draft SMS for waitlist',
      { date: '2026-06-09', timeFrom: '09:00', timeTo: '19:00' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('draft_waitlist_offer_message');
    expect(result.details?.customerName).toBe('Anna');
    expect(result.details?.messageBody).toContain('Anna');
    expect(result.details?.messageBody).toContain('09:00');
  });

  it('fails when there is no waitlist candidate for the gap', async () => {
    mockWaitlist([]);

    const result = await handleDraftWaitlistOfferMessageLogic(
      deps,
      'biz-1',
      'emp-1',
      'Draft SMS for waitlist',
      { date: '2026-06-09', timeFrom: '09:00', timeTo: '19:00' },
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('draft_waitlist_offer_message');
  });

  it('propagates a relabeled failure from the underlying gap lookup', async () => {
    businessService.findOne.mockResolvedValue({ id: 'biz-1', settings: {} });

    const result = await handleDraftWaitlistOfferMessageLogic(
      deps,
      'biz-1',
      'emp-1',
      'Draft SMS for waitlist',
      { date: '2026-06-09', timeFrom: '09:00', timeTo: '19:00' },
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('draft_waitlist_offer_message');
  });

  describe('handleListWaitlistForMyServicesLogic (ai-cmd-provider-5.9.2)', () => {
    it('lists active waitlist entries scoped to the provider services', async () => {
      employeeRepo.findOne.mockResolvedValue({
        id: 'emp-1',
        serviceIds: ['svc-color'],
      });
      const joinedAt = '2026-01-01T00:00:00.000Z';
      mockWaitlist([
        {
          id: 'c1',
          name: 'Anna',
          metadata: {
            waitlistRequest: {
              status: 'active',
              joinedAt,
              updatedAt: joinedAt,
              serviceId: 'svc-color',
              serviceName: 'Color',
            },
          },
        },
        {
          id: 'c2',
          name: 'Ben',
          metadata: {
            waitlistRequest: {
              status: 'active',
              joinedAt,
              updatedAt: joinedAt,
              serviceId: 'svc-massage',
              serviceName: 'Massage',
            },
          },
        },
      ]);

      const result = await handleListWaitlistForMyServicesLogic(
        deps,
        'biz-1',
        'emp-1',
        'Show my waitlist',
        {},
      );

      expect(result.success).toBe(true);
      expect(result.details?.count).toBe(1);
      expect(result.summary).toContain('Anna');
      expect(result.summary).not.toContain('Ben');
    });

    it('filters by service name mentioned in the prompt', async () => {
      employeeRepo.findOne.mockResolvedValue({ id: 'emp-1', serviceIds: [] });
      const joinedAt = '2026-01-01T00:00:00.000Z';
      mockWaitlist([
        {
          id: 'c1',
          name: 'Anna',
          metadata: {
            waitlistRequest: {
              status: 'active',
              joinedAt,
              updatedAt: joinedAt,
              serviceName: 'Color',
            },
          },
        },
        {
          id: 'c2',
          name: 'Ben',
          metadata: {
            waitlistRequest: {
              status: 'active',
              joinedAt,
              updatedAt: joinedAt,
              serviceName: 'Massage',
            },
          },
        },
      ]);

      const result = await handleListWaitlistForMyServicesLogic(
        deps,
        'biz-1',
        'emp-1',
        "Who's waiting for color?",
        {},
      );

      expect(result.details?.count).toBe(1);
      expect(result.summary).toContain('Anna');
    });

    it('reports an empty waitlist', async () => {
      employeeRepo.findOne.mockResolvedValue({ id: 'emp-1', serviceIds: [] });
      mockWaitlist([]);

      const result = await handleListWaitlistForMyServicesLogic(
        deps,
        'biz-1',
        'emp-1',
        'Show my waitlist',
        {},
      );

      expect(result.success).toBe(true);
      expect(result.summary).toContain('No one is on your waitlist');
    });
  });

  describe('handleListRebookingCandidatesLogic (ai-cmd-provider-5.9.4)', () => {
    it('combines matching waitlist entries with repeat regulars', async () => {
      bookingRepo.findOne.mockResolvedValue({
        id: 'bk-1',
        employeeId: 'emp-1',
        serviceId: 'svc-color',
        customerId: 'cust-cancelled',
        service: { name: 'Color' },
      });
      const joinedAt = '2026-01-01T00:00:00.000Z';
      mockWaitlist([
        {
          id: 'c1',
          name: 'Anna',
          metadata: {
            waitlistRequest: {
              status: 'active',
              joinedAt,
              updatedAt: joinedAt,
              serviceId: 'svc-color',
            },
          },
        },
      ]);
      bookingRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ customerId: 'cust-regular', visitCount: '3' }]),
      });
      customerRepo.find.mockResolvedValue([
        { id: 'cust-regular', name: 'Regular Rachel' },
      ]);

      const result = await handleListRebookingCandidatesLogic(
        deps,
        'biz-1',
        'emp-1',
        { bookingId: 'bk-1' },
      );

      expect(result.success).toBe(true);
      expect(result.summary).toContain('Anna');
      expect(result.summary).toContain('Regular Rachel');
      expect(result.details?.waitlistCount).toBe(1);
      expect(result.details?.regularsCount).toBe(1);
    });

    it('requires a bookingId', async () => {
      const result = await handleListRebookingCandidatesLogic(
        deps,
        'biz-1',
        'emp-1',
        {},
      );

      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });
  });

  describe('handleBookWalkInGapLogic (ai-cmd-provider-5.9.5)', () => {
    it('books a walk-in for the resolved service', async () => {
      serviceRepo.find.mockResolvedValue([
        { id: 'svc-trim', name: 'Trim' },
        { id: 'svc-color', name: 'Color' },
      ]);
      bookingService.create.mockResolvedValue({
        id: 'bk-new',
        startTime: new Date('2026-07-10T14:00:00.000Z'),
      });

      const result = await handleBookWalkInGapLogic(
        deps,
        'biz-1',
        'emp-1',
        'user-1',
        'Quick book Trim now',
        {},
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('book_walk_in_gap');
      expect(bookingService.create).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ employeeId: 'emp-1', serviceId: 'svc-trim' }),
        'user-1',
      );
    });

    it('fails when no service name can be resolved', async () => {
      const result = await handleBookWalkInGapLogic(
        deps,
        'biz-1',
        'emp-1',
        'user-1',
        'Quick book now',
        {},
      );

      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('fails when the service cannot be matched', async () => {
      serviceRepo.find.mockResolvedValue([{ id: 'svc-trim', name: 'Trim' }]);

      const result = await handleBookWalkInGapLogic(
        deps,
        'biz-1',
        'emp-1',
        'user-1',
        'Quick book Zzznotaservice now',
        {},
      );

      expect(result.success).toBe(false);
    });
  });
});
