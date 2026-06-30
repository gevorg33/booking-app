import { POST_FAILURE_GUIDE_FALLBACK_SCENARIOS } from './ai-product-guide-failure-fallback.fixtures.js';
import {
  appendPostFailureGuideFallback,
  buildPostFailureGuideFallbackInput,
  resolvePostFailureGuideSnippet,
  shouldAppendPostFailureGuideFallback,
} from './ai-product-guide-failure-fallback.util.js';
import { buildUnknownIntentClarifyResult } from './ai-unknown-intent.util.js';

describe('ai-product-guide-failure-fallback.util (ai-guide-1.8.3)', () => {
  it.each(
    POST_FAILURE_GUIDE_FALLBACK_SCENARIOS.map((row) => [row.id, row] as const),
  )('shouldAppendPostFailureGuideFallback for $id', (_id, scenario) => {
    expect(shouldAppendPostFailureGuideFallback(scenario.result)).toBe(
      scenario.expectSnippet,
    );
  });

  it('resolvePostFailureGuideSnippet returns route playbook snippet', () => {
    const snippet = resolvePostFailureGuideSnippet({
      surface: 'dashboard',
      route: '/dashboard/schedule',
      locale: 'en',
    });
    expect(snippet?.snippetLine).toMatch(/^Here's how to .+ on this page:/);
    expect(snippet?.guide.steps.length).toBeGreaterThan(0);
    expect(snippet?.guide.topicId).toBeTruthy();
  });

  it('appendPostFailureGuideFallback augments unknown clarify (acc-4.7, n99-1)', () => {
    const clarify = buildUnknownIntentClarifyResult({
      surface: 'dashboard',
      prompt: 'do the thing',
    });
    const enriched = appendPostFailureGuideFallback(
      clarify,
      buildPostFailureGuideFallbackInput(
        { context: { route: '/dashboard/schedule' } },
        'dashboard',
      ),
    );
    expect(enriched.summary).toContain(clarify.summary);
    expect(enriched.summary).toMatch(/Here's how to .+ on this page:/);
    expect(enriched.guide?.steps.length).toBeGreaterThan(0);
    expect(enriched.details.guideFallbackApplied).toBe(true);
  });

  it('does not double-append when guideFallbackApplied is set', () => {
    const first = appendPostFailureGuideFallback(
      {
        success: false,
        action: 'unknown',
        summary: 'Clarify',
        details: { needsClarification: true },
      },
      buildPostFailureGuideFallbackInput(
        { context: { route: '/dashboard/calendar' } },
        'dashboard',
      ),
    );
    const second = appendPostFailureGuideFallback(
      first,
      buildPostFailureGuideFallbackInput(
        { context: { route: '/dashboard/calendar' } },
        'dashboard',
      ),
    );
    expect(second.summary).toBe(first.summary);
  });
});
