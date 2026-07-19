import { POST_FAILURE_GUIDE_FALLBACK_SCENARIOS } from './ai-product-guide-failure-fallback.fixtures.js';
import {
  appendPostFailureGuideFallback,
  buildPostFailureGuideFallbackInput,
  isWeakDefaultGuideFallbackRoute,
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

  it.each([
    ['customer', '/s'],
    ['customer', '/s/home'],
    ['public', '/book'],
  ] as const)(
    'isWeakDefaultGuideFallbackRoute for %s %s (e2e-bug.53)',
    (surface, route) => {
      expect(isWeakDefaultGuideFallbackRoute(route, surface)).toBe(true);
    },
  );

  it.each([
    ['customer', '/s/book'],
    ['customer', '/s/account'],
    ['public', '/book/checkout'],
    ['dashboard', '/dashboard/schedule'],
  ] as const)(
    'keeps grounded routes for %s %s',
    (surface, route) => {
      expect(isWeakDefaultGuideFallbackRoute(route, surface)).toBe(false);
    },
  );

  it.each(
    POST_FAILURE_GUIDE_FALLBACK_SCENARIOS.filter(
      (row) => 'expectGuideAttached' in row && row.expectGuideAttached === false,
    ).map((row) => [row.id, row] as const),
  )(
    'appendPostFailureGuideFallback skips weak default for $id (e2e-bug.53)',
    (_id, scenario) => {
      const enriched = appendPostFailureGuideFallback(
        {
          success: scenario.result.success,
          action: scenario.result.action,
          summary: scenario.result.summary,
          details: { ...scenario.result.details },
        },
        {
          surface: scenario.surface,
          route: scenario.route,
          locale: scenario.locale,
          prompt: 'prompt' in scenario ? scenario.prompt : undefined,
        },
      );
      expect(shouldAppendPostFailureGuideFallback(scenario.result)).toBe(true);
      expect(enriched.details?.guideFallbackApplied).not.toBe(true);
      expect(enriched.guide?.topicId).not.toBe('consumer-tabs');
      expect(enriched.summary).toBe(scenario.result.summary);
    },
  );

  it('does not attach consumer-tabs for Hello on default customer route (e2e-bug.53)', () => {
    const clarify = buildUnknownIntentClarifyResult({
      surface: 'customer',
      prompt: 'Hello',
    });
    const enriched = appendPostFailureGuideFallback(
      clarify,
      buildPostFailureGuideFallbackInput(
        { context: { pathname: '/s/demo/home' } },
        'customer',
        'en',
        'Hello',
      ),
    );
    expect(enriched.summary).toBe(clarify.summary);
    expect(enriched.details?.guideFallbackApplied).not.toBe(true);
    expect(enriched.guide?.topicId).not.toBe('consumer-tabs');
  });
});
