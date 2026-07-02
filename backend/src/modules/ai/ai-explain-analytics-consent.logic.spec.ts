import { handleExplainAnalyticsConsentLogic } from './ai-explain-analytics-consent.logic.js';
import {
  EXPLAIN_ANALYTICS_CONSENT_PROMPTS,
  EXPLAIN_ANALYTICS_CONSENT_RESCUE_SCENARIOS,
} from './ai-explain-analytics-consent.fixtures.js';
import { rescueExplainAnalyticsConsentIntent } from './ai-explain-analytics-consent.util.js';

describe('ai-explain-analytics-consent.logic (ai-cmd-customer-4.13.5)', () => {
  it.each(
    EXPLAIN_ANALYTICS_CONSENT_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_analytics_consent for $0', async (_id, prompt) => {
    const result = await handleExplainAnalyticsConsentLogic(
      'biz-1',
      { analyticsConsent: null, analyticsConsentPending: true },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_analytics_consent');
    expect(result.details?.consumerAnalyticsConsent).toBe(true);
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleExplainAnalyticsConsentLogic(
      'biz-1',
      {},
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('uses params prompt fallback', async () => {
    const result = await handleExplainAnalyticsConsentLogic('biz-1', {
      _prompt: 'Why are you asking about analytics?',
    });
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('why_consent');
  });

  it('offers decline clientAction when tracking is on or pending', async () => {
    const granted = await handleExplainAnalyticsConsentLogic(
      'biz-1',
      { analyticsConsent: true },
      'Turn off usage tracking',
    );
    expect(granted.details?.clientAction).toBe(
      'declineConsumerAnalyticsConsent',
    );

    const pending = await handleExplainAnalyticsConsentLogic(
      'biz-1',
      { analyticsConsentPending: true },
      'Stop tracking my app usage',
    );
    expect(pending.details?.clientAction).toBe(
      'declineConsumerAnalyticsConsent',
    );
  });

  it('does not offer decline when already denied', async () => {
    const result = await handleExplainAnalyticsConsentLogic(
      'biz-1',
      { analyticsConsent: false },
      'Turn off usage tracking',
    );
    expect(result.details?.clientAction).toBeUndefined();
    expect(result.summary).toContain('already off');
  });

  it.each(EXPLAIN_ANALYTICS_CONSENT_RESCUE_SCENARIOS)(
    'pipeline rescues explain_analytics_consent for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainAnalyticsConsentIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_analytics_consent');
    },
  );
});
