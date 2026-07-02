import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC_ASSISTANT_SOURCE = readFileSync(
  join(__dirname, '../public-booking/public-booking-assistant.service.ts'),
  'utf8',
);

describe('PublicBookingAssistantService guide wiring (ai-guide-1.5.3 / 1.6.3)', () => {
  it('dispatches step-aware public app guide intents', () => {
    expect(PUBLIC_ASSISTANT_SOURCE).toContain('dispatchPublicAppGuideIntent');
    expect(PUBLIC_ASSISTANT_SOURCE).toContain('rescueProductGuideIntent');
    expect(PUBLIC_ASSISTANT_SOURCE).toContain('enrichGuideTopicFromPrompt');
    expect(PUBLIC_ASSISTANT_SOURCE).toContain('mergePublicBookingGuideContext');
    expect(PUBLIC_ASSISTANT_SOURCE).toContain('resolveProductGuidePromptMatch');
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'isAppGuideIntent(parsed.action)',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).toContain('bookingStep');
  });
});
