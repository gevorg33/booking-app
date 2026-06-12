import {
  handleListWaitlistEntriesLogic,
  handleOfferWaitlistSlotLogic,
} from './ai-waitlist-dashboard.logic.js';

describe('ai-waitlist-dashboard.logic (ai-cmd-ext-2.11–2.12)', () => {
  const customerRepo = {
    createQueryBuilder: jest.fn(() => {
      const chain = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(async () => [
          {
            id: 'c-1',
            name: 'Alice',
            phone: '+15551234',
            email: 'alice@example.com',
          },
          {
            id: 'c-2',
            name: 'Bob',
            phone: null,
            email: 'bob@example.com',
          },
        ]),
      };
      return chain;
    }),
  };

  it('handleListWaitlistEntriesLogic lists tagged customers', async () => {
    const result = await handleListWaitlistEntriesLogic(
      { customerRepo: customerRepo as any },
      'biz-1',
      {},
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('list_waitlist_entries');
    expect(result.summary).toContain('Alice');
    expect(result.summary).toContain('Bob');
  });

  it('handleListWaitlistEntriesLogic empty waitlist', async () => {
    customerRepo.createQueryBuilder.mockImplementationOnce(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    }));
    const result = await handleListWaitlistEntriesLogic(
      { customerRepo: customerRepo as any },
      'biz-1',
      {},
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('No waitlist entries');
  });

  it('handleOfferWaitlistSlotLogic requires slot params', async () => {
    const result = await handleOfferWaitlistSlotLogic(
      { customerRepo: customerRepo as any },
      'biz-1',
      {},
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('employeeName');
  });

  it('handleOfferWaitlistSlotLogic prepares offer summary', async () => {
    const result = await handleOfferWaitlistSlotLogic(
      { customerRepo: customerRepo as any },
      'biz-1',
      { employeeName: 'Maria', date: 'friday', timeSlot: '14:00' },
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('offer_waitlist_slot');
    expect(result.summary).toContain('Maria');
    expect(result.summary).toContain('Alice');
  });
});
