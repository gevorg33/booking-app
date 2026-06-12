import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  LIST_WAITLIST_ENTRIES_PROMPTS,
  OFFER_WAITLIST_SLOT_PROMPTS,
  WAITLIST_DASHBOARD_RESCUE_SCENARIOS,
} from './ai-waitlist-dashboard.fixtures.js';
import {
  handleListWaitlistEntriesLogic,
  handleOfferWaitlistSlotLogic,
} from './ai-waitlist-dashboard.logic.js';

describe('AiWaitlistDashboard integration (ai-cmd-ext-2.11–2.12)', () => {
  const rescueService = new AiIntentRescueService();

  it.each(WAITLIST_DASHBOARD_RESCUE_SCENARIOS)(
    'rescues misclassified waitlist prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it.each(LIST_WAITLIST_ENTRIES_PROMPTS.slice(0, 3))(
    'rescues unknown list prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('list_waitlist_entries');
    },
  );

  it.each(OFFER_WAITLIST_SLOT_PROMPTS.slice(0, 3))(
    'rescues unknown offer prompt $id with params',
    ({ prompt, expectedParams }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('offer_waitlist_slot');
      if (expectedParams?.employeeName) {
        expect(rescued?.params.employeeName).toBe(expectedParams.employeeName);
      }
      if (expectedParams?.date) {
        expect(rescued?.params.date).toBe(expectedParams.date);
      }
      if (expectedParams?.timeSlot) {
        expect(rescued?.params.timeSlot).toBe(expectedParams.timeSlot);
      }
    },
  );

  describe('waitlist handlers', () => {
    const customerRepo = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(async () => [
          { id: 'c-1', name: 'Nina', phone: '+1', email: 'nina@x.com' },
        ]),
      })),
    };

    it('handleListWaitlistEntriesLogic end-to-end', async () => {
      const result = await handleListWaitlistEntriesLogic(
        { customerRepo: customerRepo as any },
        'biz-1',
        {},
      );
      expect(result.success).toBe(true);
      expect(result.details).toMatchObject({ count: 1 });
    });

    it('handleOfferWaitlistSlotLogic end-to-end', async () => {
      const result = await handleOfferWaitlistSlotLogic(
        { customerRepo: customerRepo as any },
        'biz-1',
        { employeeName: 'Anna', date: 'friday', timeSlot: '14:00' },
      );
      expect(result.success).toBe(true);
      expect(result.details).toMatchObject({
        employeeName: 'Anna',
        waitlistCount: 1,
      });
    });
  });
});
