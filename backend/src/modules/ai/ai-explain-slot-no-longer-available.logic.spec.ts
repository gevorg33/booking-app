import { handleExplainSlotNoLongerAvailableLogic } from './ai-explain-slot-no-longer-available.logic.js';
import {
  EXPLAIN_SLOT_NO_LONGER_AVAILABLE_HANDLER_FIXTURES,
  EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS,
} from './ai-explain-slot-no-longer-available.fixtures.js';

describe('ai-explain-slot-no-longer-available.logic', () => {
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'biz-1', name: 'Glow Nails' }),
  };

  beforeEach(() => {
    businessRepo.findOne.mockClear();
  });

  it.each(EXPLAIN_SLOT_NO_LONGER_AVAILABLE_HANDLER_FIXTURES)(
    'returns aspect-specific copy for $id',
    async ({ prompt, aspect, params }) => {
      const result = await handleExplainSlotNoLongerAvailableLogic(
        { businessRepo },
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_slot_no_longer_available');
      expect(result.details?.aspect).toBe(aspect);
      expect(result.details?.checkoutHoldTtlMinutes).toBe(30);
      expect(result.summary).toContain('30 minutes');
    },
  );

  it('re-runs check_availability when session has service and date', async () => {
    const refreshAvailability = jest.fn().mockResolvedValue({
      success: true,
      action: 'check_availability',
      summary: '2 slots open on Monday.',
      details: { slots: [] },
    });

    const result = await handleExplainSlotNoLongerAvailableLogic(
      { businessRepo },
      'biz-1',
      {
        serviceId: 'svc-1',
        date: '2026-06-30',
      },
      'That time disappeared',
      refreshAvailability,
    );

    expect(refreshAvailability).toHaveBeenCalledWith({
      serviceId: 'svc-1',
      date: '2026-06-30',
    });
    expect(result.success).toBe(true);
    expect(result.details?.wrappedFrom).toBe('check_availability');
    expect(result.summary).toContain('2 slots open on Monday.');
  });

  it('fails clarify when prompt does not match', async () => {
    const result = await handleExplainSlotNoLongerAvailableLogic(
      { businessRepo },
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleExplainSlotNoLongerAvailableLogic(
      { businessRepo },
      'biz-1',
      {},
      EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Business not found');
  });
});
