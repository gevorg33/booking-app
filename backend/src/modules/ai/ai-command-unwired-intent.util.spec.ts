import {
  buildUnwiredDashboardIntentResult,
  buildUnwiredIntentSummary,
  resolveUnwiredIntentDispatchGap,
} from './ai-command-unwired-intent.util.js';
import { getCommandEntry } from './ai-command-registry.util.js';

describe('ai command unwired intent util (ai-cmd-ext-0.3)', () => {
  it('reports missing switch case for AiCommandService dashboard intents', () => {
    expect(
      resolveUnwiredIntentDispatchGap('create_booking', 'dashboard'),
    ).toBe('missing_switch_case');
    expect(buildUnwiredIntentSummary('create_booking', 'dashboard')).toMatch(
      /registered for dashboard \(handler AiCommandService\) but AiCommandService has no switch case wired yet/,
    );
  });

  it('reports delegated handler when registry routes to a domain service', () => {
    const entry = getCommandEntry('mark_paid');
    expect(entry?.handler).toBeDefined();
    expect(resolveUnwiredIntentDispatchGap('mark_paid', 'dashboard')).toBe(
      'delegated_handler',
    );
    expect(buildUnwiredIntentSummary('mark_paid', 'dashboard')).toMatch(
      /registered for dashboard with handler/,
    );
    expect(buildUnwiredIntentSummary('mark_paid', 'dashboard')).toMatch(
      /instead of delegating/,
    );
  });

  it('reports unregistered actions clearly', () => {
    expect(
      resolveUnwiredIntentDispatchGap('totally_fake_intent_xyz', 'dashboard'),
    ).toBe('unregistered');
    expect(
      buildUnwiredIntentSummary('totally_fake_intent_xyz', 'dashboard'),
    ).toMatch(/not registered in the command registry/);
  });

  it('builds structured default-branch telemetry payload', () => {
    const result = buildUnwiredDashboardIntentResult('mark_paid', {
      reasoning: 'test reasoning',
      parsed: { action: 'mark_paid' },
    });

    expect(result.success).toBe(false);
    expect(result.action).toBe('unknown');
    expect(result.details?.attemptedAction).toBe('mark_paid');
    expect(result.details?.dispatchGap).toBe('delegated_handler');
    expect(result.details?.registryHandler).toBeTruthy();
    expect(result.summary).toMatch(/mark_paid/);
  });
});
