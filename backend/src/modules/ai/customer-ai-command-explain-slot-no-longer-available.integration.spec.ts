import { rescueExplainSlotNoLongerAvailableIntent } from './ai-explain-slot-no-longer-available.util.js';
import { EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS } from './ai-explain-slot-no-longer-available.fixtures.js';

describe('customer-ai-command explain_slot_no_longer_available integration (ai-cmd-customer-4.18.4)', () => {
  it.each(
    EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ),
  )('rescues explain_slot_no_longer_available for $id', (row) => {
    expect(
      rescueExplainSlotNoLongerAvailableIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_slot_no_longer_available');
  });
});
