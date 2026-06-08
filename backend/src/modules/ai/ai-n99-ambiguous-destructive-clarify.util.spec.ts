import { N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS } from './ai-n99-ambiguous-destructive-clarify.fixtures.js';
import {
  buildNoClarifyGuardrailClarifyResult,
  evaluateAmbiguousDestructiveScenario,
  isNoClarifyGuardrailBlockReason,
  resolveNoClarifyGuardrailClarify,
  shouldBlockNoClarifyAutofill,
  shouldBlockNoClarifyExecution,
  NO_CLARIFY_GUARDRAIL_CLARIFY_SOURCE,
} from './ai-n99-ambiguous-destructive-clarify.util.js';

describe('ai-n99-ambiguous-destructive-clarify.util (n99-2.8)', () => {
  it.each(N99_AMBIGUOUS_DESTRUCTIVE_SCENARIOS)(
    '$id guardrail blocks or passes as expected',
    (scenario) => {
      const result = evaluateAmbiguousDestructiveScenario(scenario);
      expect(result.passed).toBe(true);
    },
  );

  it('shouldBlockNoClarifyAutofill is an alias for shouldBlockNoClarifyExecution', () => {
    expect(shouldBlockNoClarifyAutofill).toBe(shouldBlockNoClarifyExecution);
  });

  it('isNoClarifyGuardrailBlockReason recognizes guard reasons', () => {
    expect(isNoClarifyGuardrailBlockReason('high_risk_action')).toBe(true);
    expect(isNoClarifyGuardrailBlockReason('random')).toBe(false);
  });

  it('resolveNoClarifyGuardrailClarify returns clarify for blocked destructive action', () => {
    const clarify = resolveNoClarifyGuardrailClarify({
      prompt: 'cancel all tomorrow',
      surface: 'dashboard',
      action: 'cancel_bookings',
      params: { allAppointments: true, date: '2026-06-09' },
      actionConfidence: 0.7,
    });
    expect(clarify).not.toBeNull();
    expect(clarify?.details?.clarifySource).toBe(NO_CLARIFY_GUARDRAIL_CLARIFY_SOURCE);
    expect(clarify?.details?.countsTowardClarifySuccess).toBe(true);
  });

  it('resolveNoClarifyGuardrailClarify returns null for confirmed safe scope', () => {
    const clarify = resolveNoClarifyGuardrailClarify({
      prompt: 'cancel these 3 bookings',
      surface: 'dashboard',
      action: 'cancel_bookings',
      params: { bookingIds: ['bk-1', 'bk-2', 'bk-3'] },
      actionConfidence: 0.9,
      sessionContext: { confirmed: true },
    });
    expect(clarify).toBeNull();
  });

  it('does not block team-wide availability checks for blast radius', () => {
    const clarify = resolveNoClarifyGuardrailClarify({
      prompt: 'who is available for permanent lashes tomorrow evening',
      surface: 'public',
      action: 'check_availability',
      params: {
        allProviders: true,
        serviceName: 'Permanent lashes',
        date: '2026-06-09',
        timeOfDay: 'evening',
      },
      actionConfidence: 0.88,
    });
    expect(clarify).toBeNull();
  });

  it('buildNoClarifyGuardrailClarifyResult tags low-confidence clarify toward n99-1', () => {
    const clarify = buildNoClarifyGuardrailClarifyResult(
      {
        prompt: 'change it',
        surface: 'dashboard',
        action: 'unknown',
        params: {},
        actionConfidence: 0.5,
      },
      'ambiguous_or_unknown',
    );
    expect(clarify?.details?.countsTowardClarifySuccess).toBe(true);
    expect(clarify?.details?.noClarifyGuardReason).toBe('ambiguous_or_unknown');
  });
});
