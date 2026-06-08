import { SELF_CHECK_RULE_SCENARIOS } from './ai-classification-selfcheck.fixtures.js';
import {
  mergeLlmSelfCheckWithRules,
  runClassificationSelfCheck,
  shouldRunLlmSelfCheck,
  verifyClassifiedIntent,
} from './ai-classification-selfcheck.util.js';

describe('ai-classification-selfcheck.util (acc-3.4)', () => {
  it.each(SELF_CHECK_RULE_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'rule self-check scenario %s',
    (_id, scenario) => {
      const verification = runClassificationSelfCheck({
        prompt: scenario.prompt,
        surface: scenario.surface,
        intent: {
          action: scenario.action,
          params: scenario.params ?? {},
          confidence: 0.95,
        },
      });
      expect(verification.ok).toBe(scenario.expectOk);
      if (scenario.expectReasonIncludes) {
        expect(
          verification.reasons.some((reason) =>
            reason.toLowerCase().includes(scenario.expectReasonIncludes!.toLowerCase()),
          ),
        ).toBe(true);
      }
      expect(verification.fieldConfidence.action).toBeDefined();
      expect(verification.source).toBe('rules');
    },
  );

  it('verifyClassifiedIntent accepts surface for availability checks', () => {
    const verification = verifyClassifiedIntent(
      'Who is free tomorrow evening for permanent lashes',
      { action: 'create_booking', params: {}, confidence: 0.9 },
      'dashboard',
    );
    expect(verification.ok).toBe(false);
    expect(verification.confidence).toBeLessThan(0.5);
  });

  it('shouldRunLlmSelfCheck triggers on rule mismatch', () => {
    const verification = runClassificationSelfCheck({
      prompt: 'Cancel Maria tomorrow',
      surface: 'dashboard',
      intent: { action: 'create_booking', params: {}, confidence: 0.9 },
    });
    expect(shouldRunLlmSelfCheck(verification, { action: 'create_booking' })).toBe(
      true,
    );
  });

  it('mergeLlmSelfCheckWithRules lowers confidence when LLM rejects classify output', () => {
    const ruleVerification = runClassificationSelfCheck({
      prompt: 'Book massage tomorrow at 10:00',
      surface: 'dashboard',
      intent: {
        action: 'create_booking',
        params: { serviceName: 'Massage', timeSlot: '10:00' },
        confidence: 0.9,
      },
    });
    const merged = mergeLlmSelfCheckWithRules(ruleVerification, {
      satisfies: false,
      confidence: 0.2,
      reason: 'missing employee when named in prompt',
    });
    expect(merged.ok).toBe(false);
    expect(merged.confidence).toBeLessThanOrEqual(0.35);
    expect(merged.source).toBe('rules+llm');
  });

  it('mergeLlmSelfCheckWithRules can soften false-positive rule mismatch', () => {
    const ruleVerification = runClassificationSelfCheck({
      prompt: 'How many appointments did we have today',
      surface: 'dashboard',
      intent: { action: 'create_booking', params: {}, confidence: 0.95 },
    });
    expect(ruleVerification.ok).toBe(false);
    const merged = mergeLlmSelfCheckWithRules(ruleVerification, {
      satisfies: true,
      confidence: 0.82,
      reason: 'staff shorthand for create booking',
    });
    expect(merged.llmVerified).toBe(true);
    expect(merged.confidence).toBeGreaterThan(ruleVerification.confidence);
  });
});
