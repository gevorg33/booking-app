import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import {
  EXPLAIN_ANALYTICS_CONSENT_PROMPTS,
  EXPLAIN_ANALYTICS_CONSENT_BOUNDARY_PROMPTS,
  EXPLAIN_ANALYTICS_CONSENT_RESCUE_SCENARIOS,
  CUSTOMER_EXPLAIN_ANALYTICS_CONSENT_CLASSIFIER_RULES,
} from './ai-explain-analytics-consent.fixtures.js';
import { EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_SCENARIOS } from './ai-explain-analytics-consent-multilingual.fixtures.js';
import {
  assembleAnalyticsConsentSummary,
  buildTurnOffTrackingLines,
  buildWhatIsTrackedLines,
  isExplainAnalyticsConsentIntent,
  isExplainAnalyticsConsentPrompt,
  parseExplainAnalyticsConsentFromPrompt,
  rescueExplainAnalyticsConsentIntent,
  resolveConsumerAnalyticsConsentExplainContext,
  resolveExplainAnalyticsConsentAspect,
  shouldDeclineConsumerAnalyticsConsent,
} from './ai-explain-analytics-consent.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_ANALYTICS_CONSENT_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-analytics-consent.util (ai-cmd-customer-4.13.5)', () => {
  it('exports classifier rules for explain_analytics_consent', () => {
    expect(CUSTOMER_EXPLAIN_ANALYTICS_CONSENT_CLASSIFIER_RULES).toContain(
      'explain_analytics_consent',
    );
  });

  it.each(
    EXPLAIN_ANALYTICS_CONSENT_PROMPTS.map((row) => [row.id, row] as const),
  )('detects explain_analytics_consent for $id', (_id, row) => {
    expect(isExplainAnalyticsConsentPrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainAnalyticsConsentIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_analytics_consent');
    expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_analytics_consent',
    );
  });

  it.each(
    EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_analytics_consent for $id', (_id, row) => {
    expect(isExplainAnalyticsConsentPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_ANALYTICS_CONSENT_BOUNDARY_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('rejects boundary prompt $id', (_id, row) => {
    expect(isExplainAnalyticsConsentPrompt(row.prompt)).toBe(false);
  });

  it.each(EXPLAIN_ANALYTICS_CONSENT_RESCUE_SCENARIOS)(
    'rescues explain_analytics_consent for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainAnalyticsConsentIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_analytics_consent');
    },
  );

  it('resolves aspects and context', () => {
    expect(
      resolveExplainAnalyticsConsentAspect(
        'Why are you asking about analytics?',
      ),
    ).toBe('why_consent');
    const ctx = resolveConsumerAnalyticsConsentExplainContext({
      analyticsConsent: true,
    });
    expect(ctx.trackingEnabled).toBe(true);
    expect(ctx.consentState).toBe('granted');
  });

  it('builds summaries for consent states', () => {
    const pending = assembleAnalyticsConsentSummary('why_consent', {
      consentState: 'pending',
      consentPending: true,
      trackingEnabled: false,
    });
    expect(pending).toContain('banner');
    expect(
      assembleAnalyticsConsentSummary('turn_off_tracking', {
        consentState: 'denied',
        consentPending: false,
        trackingEnabled: false,
      }),
    ).toContain('already off');
    expect(buildWhatIsTrackedLines()[0]).toContain('anonymous');
    expect(
      buildTurnOffTrackingLines({
        consentState: 'pending',
        consentPending: true,
        trackingEnabled: false,
      })[2],
    ).toContain('consent prompt');
  });

  it('parses prompt and recognizes intent id', () => {
    expect(
      parseExplainAnalyticsConsentFromPrompt('Turn off usage tracking')?.aspect,
    ).toBe('turn_off_tracking');
    expect(isExplainAnalyticsConsentIntent('explain_analytics_consent')).toBe(
      true,
    );
  });

  it('returns null when action already matches', () => {
    expect(
      rescueExplainAnalyticsConsentIntent(
        'Why are you asking about analytics?',
        'explain_analytics_consent',
      ),
    ).toBeNull();
  });

  it('detects heuristic prompts not in fixtures', () => {
    expect(
      isExplainAnalyticsConsentPrompt('Ինչու եք հարցնում վերլուծության մասին'),
    ).toBe(true);
    expect(
      isExplainAnalyticsConsentPrompt('Отключить отслеживание использования'),
    ).toBe(true);
  });

  it('covers aspect resolution heuristics', () => {
    expect(
      resolveExplainAnalyticsConsentAspect('How does analytics consent work?'),
    ).toBe('how_it_works');
    expect(
      resolveExplainAnalyticsConsentAspect('Why is there an analytics banner?'),
    ).toBe('consent_prompt');
    expect(
      resolveExplainAnalyticsConsentAspect('What usage data do you collect?'),
    ).toBe('what_is_tracked');
  });

  it('decides decline client action from context', () => {
    const granted = {
      consentState: 'granted' as const,
      consentPending: false,
      trackingEnabled: true,
    };
    expect(
      shouldDeclineConsumerAnalyticsConsent('turn_off_tracking', granted),
    ).toBe(true);
    expect(shouldDeclineConsumerAnalyticsConsent('why_consent', granted)).toBe(
      false,
    );
    expect(
      shouldDeclineConsumerAnalyticsConsent('turn_off_tracking', {
        consentState: 'denied',
        consentPending: false,
        trackingEnabled: false,
      }),
    ).toBe(false);
  });

  it('rejects empty prompt and provider or dashboard analytics', () => {
    expect(isExplainAnalyticsConsentPrompt('')).toBe(false);
    expect(
      isExplainAnalyticsConsentPrompt('Show me salon revenue analytics'),
    ).toBe(false);
    expect(
      isExplainAnalyticsConsentPrompt(
        'Why is the provider app tracking my shifts?',
      ),
    ).toBe(false);
  });

  it('resolves context defaults', () => {
    const ctx = resolveConsumerAnalyticsConsentExplainContext({});
    expect(ctx.consentState).toBe('pending');
    expect(ctx.consentPending).toBe(true);
  });

  it('registers eval cases', () => {
    expect(
      AI_COMMAND_EVAL_EXPLAIN_ANALYTICS_CONSENT_CASES.length,
    ).toBeGreaterThan(0);
  });

  it('covers granted and denied consent branches in summaries', () => {
    expect(
      assembleAnalyticsConsentSummary('why_consent', {
        consentState: 'granted',
        consentPending: false,
        trackingEnabled: true,
      }),
    ).toContain('already accepted');
    expect(
      assembleAnalyticsConsentSummary('why_consent', {
        consentState: 'denied',
        consentPending: false,
        trackingEnabled: false,
      }),
    ).toContain('declined');
    expect(
      assembleAnalyticsConsentSummary('consent_prompt', {
        consentState: 'granted',
        consentPending: false,
        trackingEnabled: true,
      }),
    ).toContain('already accepted');
    expect(
      assembleAnalyticsConsentSummary('consent_prompt', {
        consentState: 'denied',
        consentPending: false,
        trackingEnabled: false,
      }),
    ).toContain('already declined');
    expect(
      assembleAnalyticsConsentSummary('how_it_works', {
        consentState: 'granted',
        consentPending: false,
        trackingEnabled: true,
      }),
    ).toContain('granted');
    expect(
      assembleAnalyticsConsentSummary('how_it_works', {
        consentState: 'denied',
        consentPending: false,
        trackingEnabled: false,
      }),
    ).toContain('denied');
  });

  it('resolves string consent params', () => {
    expect(
      resolveConsumerAnalyticsConsentExplainContext({
        analyticsConsent: 'granted',
      }).consentState,
    ).toBe('granted');
    expect(
      resolveConsumerAnalyticsConsentExplainContext({
        analyticsConsent: 'denied',
      }).consentState,
    ).toBe('denied');
    expect(
      resolveConsumerAnalyticsConsentExplainContext({
        analyticsConsentDenied: true,
      }).consentState,
    ).toBe('denied');
  });

  it('covers why consent heuristic aspect', () => {
    expect(
      resolveExplainAnalyticsConsentAspect('Why is usage tracking enabled?'),
    ).toBe('why_consent');
  });
});
