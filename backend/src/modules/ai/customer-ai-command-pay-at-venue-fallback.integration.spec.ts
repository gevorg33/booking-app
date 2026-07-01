import { rescuePayAtVenueFallbackIntent } from './ai-pay-at-venue-fallback.util.js';
import { PAY_AT_VENUE_FALLBACK_PROMPTS } from './ai-pay-at-venue-fallback.fixtures.js';

describe('customer-ai-command pay_at_venue_fallback integration (ai-cmd-customer-4.18.2)', () => {
  it.each(
    PAY_AT_VENUE_FALLBACK_PROMPTS.filter((row) => row.surface === 'customer'),
  )('rescues pay_at_venue_fallback for $id', (row) => {
    expect(rescuePayAtVenueFallbackIntent(row.prompt, 'unknown')?.action).toBe(
      'pay_at_venue_fallback',
    );
  });
});
