import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { EXPLAIN_ANALYTICS_CONSENT_PROMPTS } from './ai-explain-analytics-consent.fixtures.js';
import { EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_SCENARIOS } from './ai-explain-analytics-consent-multilingual.fixtures.js';

describe('customer-ai-command explain_analytics_consent integration (ai-cmd-customer-4.13.5)', () => {
  it.each(
    [
      ...EXPLAIN_ANALYTICS_CONSENT_PROMPTS,
      ...EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues explain_analytics_consent for $0', (_id, prompt) => {
    expect(rescueConsumerAdoptionIntent(prompt, 'unknown')?.action).toBe(
      'explain_analytics_consent',
    );
  });
});
