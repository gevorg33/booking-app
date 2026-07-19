import {
  SELF_VERIFY_CLARIFY_SCENARIOS,
  UNKNOWN_INTENT_GUARD_PIPE_MARKER,
  UNKNOWN_INTENT_GUARD_SCENARIOS,
  UNKNOWN_INTENT_PIPE_MARKER,
} from './ai-unknown-intent.fixtures.js';
import {
  buildPipelineClarifyCommandResult,
  buildTargetedClarifyFromSelfVerifyFailure,
  buildUnknownIntentClarifyPayload,
  buildUnknownIntentClarifyResult,
  isUnknownIntentForHandlerBlock,
  lowerConfidenceAfterSelfVerifyFailure,
  resolveSelfVerifyStageOutcome,
  SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD,
  shouldBlockUnknownFromHandlerSwitch,
  shouldEmitSelfVerifyClarify,
  UNKNOWN_INTENT_GUARD_PIPE_MARKER as GUARD_MARKER,
  UNKNOWN_INTENT_PIPE_MARKER as UTIL_MARKER,
} from './ai-unknown-intent.util.js';
import { verifyIntentMatchesPrompt } from './ai-intent-self-verify.util.js';

describe('ai-unknown-intent.util (pipe-1.6.2)', () => {
  it('exports pipe marker and threshold', () => {
    expect(UNKNOWN_INTENT_PIPE_MARKER).toBe('pipe-1.6.2');
    expect(UTIL_MARKER).toBe('pipe-1.6.2');
    expect(SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD).toBe(0.55);
  });

  it('lowers confidence below clarify threshold', () => {
    expect(lowerConfidenceAfterSelfVerifyFailure(0.72)).toBe(0.54);
    expect(lowerConfidenceAfterSelfVerifyFailure(0.4)).toBe(0.4);
  });

  it.each(SELF_VERIFY_CLARIFY_SCENARIOS)(
    'shouldEmitSelfVerifyClarify $id',
    (scenario) => {
      const result = verifyIntentMatchesPrompt(scenario.prompt, {
        action: scenario.action,
        params: {},
      });
      expect(result.ruleId).toBe(scenario.ruleId);
      if (scenario.reason === 'ambiguous_schedule_intent') {
        expect(result.reason).toBe(scenario.reason);
      }
      expect(shouldEmitSelfVerifyClarify(result, scenario.confidence)).toBe(
        scenario.expectClarify,
      );
    },
  );

  it.each(SELF_VERIFY_CLARIFY_SCENARIOS.filter((row) => row.expectClarify))(
    'buildTargetedClarifyFromSelfVerifyFailure $id',
    (scenario) => {
      const result = verifyIntentMatchesPrompt(scenario.prompt, {
        action: scenario.action,
        params: {},
      });
      const payload = buildTargetedClarifyFromSelfVerifyFailure(
        { action: scenario.action, confidence: scenario.confidence },
        result,
        'dashboard',
      );
      expect(payload.clarifyFields).toEqual(scenario.expectedClarifyFields);
      expect(payload.summary.length).toBeGreaterThan(20);
      expect(payload.suggestions.length).toBeGreaterThanOrEqual(
        scenario.expectedSuggestionsMin ?? 2,
      );
      expect(payload.loweredConfidence).toBeLessThan(
        SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD,
      );
    },
  );

  it('resolveSelfVerifyStageOutcome emits clarify for uncorrectable low-confidence fail', () => {
    const outcome = resolveSelfVerifyStageOutcome(
      'Block Gevorg schedule tomorrow',
      {
        action: 'create_booking',
        params: {},
        reasoning: 'classify',
        confidence: 0.42,
      },
      'dashboard',
    );
    expect(outcome.result.passed).toBe(false);
    expect(outcome.result.correctedAction).toBeUndefined();
    expect(outcome.clarify?.clarifyFields).toEqual(['intentChoice']);
    expect(outcome.intent?.confidence).toBeLessThan(0.55);
  });

  it('resolveSelfVerifyStageOutcome corrects without clarify when fix exists', () => {
    const outcome = resolveSelfVerifyStageOutcome(
      'Clear Gevorg schedule for tomorrow',
      {
        action: 'create_booking',
        params: {},
        reasoning: 'classify',
        confidence: 0.4,
      },
      'dashboard',
    );
    expect(outcome.clarify).toBeUndefined();
    expect(outcome.intent?.action).toBe('clear_schedule');
  });

  it('buildPipelineClarifyCommandResult includes suggestions and missing fields', () => {
    const payload = buildTargetedClarifyFromSelfVerifyFailure(
      { action: 'create_booking', confidence: 0.4 },
      {
        passed: false,
        ruleId: 'schedule_vocab_mismatch',
        reason: 'ambiguous_schedule_intent',
      },
      'dashboard',
    );
    const result = buildPipelineClarifyCommandResult(
      {
        status: 'clarify',
        action: 'create_booking',
        params: {},
        reasoning: 'test',
        confidence: payload.loweredConfidence,
        candidates: [],
        trace: [],
        gate: {
          action: 'create_booking',
          confidence: 0.4,
          shouldEscalateToSemantic: true,
          decision: 'escalate_semantic',
          lowThreshold: 0.55,
          highThreshold: 0.85,
          reason: 'low',
        },
        context: {
          originalPrompt: 'Block Gevorg schedule tomorrow',
          normalizedPrompt: 'Block Gevorg schedule tomorrow',
          classifierContext: null,
          method: 'none',
        },
        normalization: {
          normalizedPrompt: 'Block Gevorg schedule tomorrow',
          method: 'none',
          classifierContext: null,
        },
        surface: 'dashboard',
        clarifyFields: payload.clarifyFields,
        clarifySummary: payload.summary,
        clarifySuggestions: payload.suggestions,
      },
      payload,
    );
    expect(result.success).toBe(false);
    expect(result.details.needsClarification).toBe(true);
    expect(result.details.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(result.details.missing[0].field).toBe('intentChoice');
  });
});

describe('ai-unknown-intent.util (pipe-1.8.1)', () => {
  it('exports unknown guard pipe marker', () => {
    expect(UNKNOWN_INTENT_GUARD_PIPE_MARKER).toBe('pipe-1.8.1');
    expect(GUARD_MARKER).toBe('pipe-1.8.1');
  });

  it.each(UNKNOWN_INTENT_GUARD_SCENARIOS)(
    'shouldBlockUnknownFromHandlerSwitch $id',
    (scenario) => {
      expect(shouldBlockUnknownFromHandlerSwitch(scenario.action)).toBe(
        scenario.expectBlockHandler,
      );
      expect(isUnknownIntentForHandlerBlock(scenario.action)).toBe(
        scenario.expectBlockHandler,
      );
    },
  );

  it.each(
    UNKNOWN_INTENT_GUARD_SCENARIOS.filter((row) => row.expectBlockHandler),
  )('buildUnknownIntentClarifyPayload $id', (scenario) => {
    const surface = scenario.surface ?? 'dashboard';
    const payload = buildUnknownIntentClarifyPayload(surface, {
      confidence: 0.2,
      reasoning: 'test',
    });
    expect(payload.clarifyFields).toEqual(['intentChoice']);
    expect(payload.ruleId).toBe('unknown_intent');
    expect(payload.suggestions.length).toBeGreaterThanOrEqual(
      scenario.expectedSuggestionsMin ?? 2,
    );
  });

  it('buildUnknownIntentClarifyResult blocks handler dispatch with clarify', () => {
    const result = buildUnknownIntentClarifyResult({
      surface: 'dashboard',
      prompt: scenarioPrompt(),
      params: { _timeZone: 'America/Los_Angeles' },
      reasoning: 'classifier returned unknown',
      confidence: 0.12,
      trace: [{ stage: 'classify', detail: 'unknown' }],
    });
    expect(result.success).toBe(false);
    expect(result.action).toBe('unknown');
    expect(result.details.needsClarification).toBe(true);
    expect(result.details.pipelineStage).toBe('unknown_intent_clarify');
    expect(result.details.pipeMarker).toBe('pipe-1.8.1');
    expect(result.details.suggestions?.length).toBeGreaterThanOrEqual(2);
  });

  // e2e-bug.126
  it.each([
    {
      id: 'customer-ru',
      surface: 'customer' as const,
      locale: 'ru',
      pattern: /не до конца понял/i,
    },
    {
      id: 'public-hy',
      surface: 'public' as const,
      locale: 'hy',
      pattern: /չհասկացա/,
    },
    {
      id: 'provider-ru',
      surface: 'provider' as const,
      locale: 'ru',
      pattern: /Не уверен/i,
    },
    {
      id: 'dashboard-en',
      surface: 'dashboard' as const,
      locale: 'en',
      pattern: /didn't fully understand that command/i,
    },
  ])(
    'localizes unknown-intent clarify summary ($id)',
    ({ surface, locale, pattern }) => {
      const payload = buildUnknownIntentClarifyPayload(surface, { locale });
      expect(payload.summary).toMatch(pattern);
      const result = buildUnknownIntentClarifyResult({
        surface,
        prompt: scenarioPrompt(),
        locale,
      });
      expect(result.summary).toMatch(pattern);
    },
  );
});

function scenarioPrompt(): string {
  return 'maybe do something with the thing tomorrow';
}
