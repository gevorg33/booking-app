import {
  E2E331_FALLBACK_PRECEDENCE_CASES,
  E2E331_SESSION_CONTEXT_CASES,
} from './ai-e2e331-public-funnel-surface-detection.fixtures.js';
import { resolvePostFailureGuideSnippet } from './ai-product-guide-failure-fallback.util.js';
import { resolveProductGuideSessionContext } from './ai-product-guide-session.util.js';

describe('e2e-bug.331 — public booking funnel surface detection', () => {
  it.each(E2E331_SESSION_CONTEXT_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, scenario) => {
      const ctx = resolveProductGuideSessionContext(
        { context: scenario.context },
        scenario.surfaceHint,
      );
      expect(ctx.surface).toBe(scenario.expectedSurface);
      expect(ctx.route).toBe(scenario.expectedRoute);
    },
  );

  it.each(
    E2E331_FALLBACK_PRECEDENCE_CASES.map((row) => [row.id, row] as const),
  )('%s', (_id, scenario) => {
    const snippet = resolvePostFailureGuideSnippet({
      surface: 'public',
      route: scenario.route,
      locale: 'en',
      prompt: scenario.prompt,
    });
    expect(snippet?.snippetLine.toLowerCase()).toContain(
      scenario.expectedTaskLabelContains,
    );
  });

  it('does not regress the generic funnel overview route (no specific step)', () => {
    const snippet = resolvePostFailureGuideSnippet({
      surface: 'public',
      route: '/book',
      locale: 'en',
      prompt: 'Help me with this page',
    });
    expect(snippet?.guide.topicId).toBe('public-booking-funnel');
  });
});
