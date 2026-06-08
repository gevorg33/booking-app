import {
  N99_AUTOFILL_PROCEED_SCENARIOS,
  N99_AUTOFILL_SCENARIOS,
} from './ai-n99-autofill.fixtures.js';
import {
  applyConfidenceGatedAutofill,
  canProceedWithoutClarifyAfterAutofill,
  resolveAutofillFieldThreshold,
  resolveAutofillRiskTier,
  shouldApplyAutofillCandidate,
} from './ai-n99-autofill.util.js';

describe('ai-n99-autofill.util (n99-2.1)', () => {
  it.each(N99_AUTOFILL_SCENARIOS)('$id confidence-gated autofill', (scenario) => {
    const result = applyConfidenceGatedAutofill({
      prompt: scenario.prompt,
      action: scenario.action,
      surface: scenario.surface,
      params: { ...scenario.params },
      sessionContext: 'sessionContext' in scenario ? scenario.sessionContext : undefined,
      screenContext: 'screenContext' in scenario ? scenario.screenContext : undefined,
      entityMemory: 'entityMemory' in scenario ? scenario.entityMemory : undefined,
      businessDefaults:
        'businessDefaults' in scenario ? scenario.businessDefaults : undefined,
      catalogServices:
        'catalogServices' in scenario ? scenario.catalogServices : undefined,
      actionConfidence: scenario.actionConfidence,
    });

    if ('expectBlocked' in scenario && scenario.expectBlocked) {
      expect(result.blocked).toBe(true);
      expect(result.filledFields).toHaveLength(0);
      return;
    }

    expect(result.blocked).toBe(false);
    for (const [key, value] of Object.entries(scenario.expectFilled)) {
      expect(result.params[key]).toEqual(value);
    }
    if ('expectSources' in scenario) {
      for (const source of scenario.expectSources) {
        expect(result.applied.some((entry) => entry.source === source)).toBe(true);
      }
    }
  });

  it.each(N99_AUTOFILL_PROCEED_SCENARIOS)(
    '$id proceed-without-clarify after autofill',
    (scenario) => {
      const autofill = applyConfidenceGatedAutofill({
        prompt: scenario.prompt,
        action: scenario.action,
        params: { ...scenario.paramsBefore },
        sessionContext: 'sessionContext' in scenario ? scenario.sessionContext : undefined,
        actionConfidence: scenario.actionConfidence,
      });
      const proceed = canProceedWithoutClarifyAfterAutofill({
        prompt: scenario.prompt,
        action: scenario.action,
        params: autofill.params,
        actionConfidence: scenario.actionConfidence,
        fieldThreshold: autofill.fieldThreshold,
      });
      expect(proceed).toBe(scenario.expectProceed);
    },
  );

  it('resolveAutofillRiskTier marks destructive intents as high', () => {
    expect(resolveAutofillRiskTier('cancel_bookings')).toBe('high');
    expect(resolveAutofillRiskTier('create_booking')).toBe('medium');
    expect(resolveAutofillRiskTier('list_bookings')).toBe('low');
  });

  it('shouldApplyAutofillCandidate respects source trust vs risk tier threshold', () => {
    expect(
      shouldApplyAutofillCandidate({
        source: 'screen_context',
        riskTier: 'medium',
        fieldThreshold: resolveAutofillFieldThreshold('medium'),
        actionConfidence: 0.9,
      }),
    ).toBe(true);
    expect(
      shouldApplyAutofillCandidate({
        source: 'last_provider',
        riskTier: 'high',
        fieldThreshold: resolveAutofillFieldThreshold('high'),
        actionConfidence: 0.9,
      }),
    ).toBe(false);
  });
});
