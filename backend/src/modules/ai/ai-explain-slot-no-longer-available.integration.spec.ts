import { validateCommand } from './command-completion.validator.js';
import { handleExplainSlotNoLongerAvailableLogic } from './ai-explain-slot-no-longer-available.logic.js';
import {
  EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS,
  EXPLAIN_SLOT_NO_LONGER_AVAILABLE_RESCUE_SCENARIOS,
} from './ai-explain-slot-no-longer-available.fixtures.js';
import { rescueExplainSlotNoLongerAvailableIntent } from './ai-explain-slot-no-longer-available.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai explain slot no longer available integration (ai-cmd-customer-4.18.4)', () => {
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'biz-1', name: 'Glow Nails' }),
  };

  it.each(EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS)(
    'validates $id',
    ({ prompt }) => {
      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_slot_no_longer_available',
          params: {},
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);
    },
  );

  it.each(EXPLAIN_SLOT_NO_LONGER_AVAILABLE_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainSlotNoLongerAvailableIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler with checkout TTL and navigate context', async () => {
    const result = await handleExplainSlotNoLongerAvailableLogic(
      { businessRepo },
      'biz-1',
      {
        serviceId: 'svc-1',
        date: '2026-06-30',
        startTime: '14:00',
        employeeId: 'emp-1',
      },
      'Someone took my slot',
    );
    expect(result.action).toBe('explain_slot_no_longer_available');
    expect(result.success).toBe(true);
    expect(result.details?.checkoutHoldTtlMinutes).toBe(30);
    expect(result.details?.navigate).toMatchObject({
      path: 'checkout',
      query: expect.objectContaining({ freshBook: '1', serviceId: 'svc-1' }),
    });
  });
});
