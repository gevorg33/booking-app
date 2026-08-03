import {
  commandResultToPublicAssistantResult,
  publicAssistantResultToCommandResult,
} from './customer-ai-command.util.js';
import { E2E277_BOOKING_HELP_GUIDE_ROUNDTRIP } from './ai-e2e277-booking-help-guide-payload.fixtures.js';

describe('e2e-bug.277 booking_help guide payload round-trip', () => {
  it('publicAssistantResultToCommandResult preserves guide + supportHandoff', () => {
    const { publicResult } = E2E277_BOOKING_HELP_GUIDE_ROUNDTRIP;
    const command = publicAssistantResultToCommandResult(publicResult as any);
    expect(command.action).toBe('booking_help');
    expect(command.guide).toEqual(publicResult.guide);
    expect(command.guide?.supportHandoff?.label).toBe('Still stuck? (hy)');
  });

  it('round-trip public → command → public keeps guide handoff', () => {
    const { publicResult } = E2E277_BOOKING_HELP_GUIDE_ROUNDTRIP;
    const back = commandResultToPublicAssistantResult(
      publicAssistantResultToCommandResult(publicResult as any),
    );
    expect(back.guide).toBeDefined();
    expect(back.guide?.topicId).toBe('public-booking-funnel');
    expect(back.guide?.supportHandoff?.label).toBe('Still stuck? (hy)');
    expect(back.guide?.steps?.length).toBe(3);
    expect(back.navigate).toEqual({ path: 'services' });
    expect(back.sessionContext?.guideFlowId).toBe('public-booking-funnel');
  });

  it('round-trip without guide stays undefined (non-guide actions)', () => {
    const back = commandResultToPublicAssistantResult(
      publicAssistantResultToCommandResult({
        success: true,
        action: 'list_services',
        summary: 'Here are services',
      }),
    );
    expect(back.guide).toBeUndefined();
  });
});
