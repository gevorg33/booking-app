import {
  STRUCTURAL_ENRICH_SKIP_PIPE_MARKER,
  STRUCTURAL_ENRICH_SKIP_SCENARIOS,
} from './ai-intent-structural-enrich-skip.fixtures.js';
import {
  assertStructuralEnrichSkipped,
  buildStructuralEnrichSkipTraceDetail,
  shouldSkipStructuralEnrichAfterSelfVerify,
  STRUCTURAL_ENRICH_SKIP_PIPE_MARKER as UTIL_MARKER,
  STRUCTURAL_ENRICH_SKIP_TRACE_DETAIL,
} from './ai-intent-structural-enrich-skip.util.js';
import { resolveSelfVerifyStageOutcome } from './ai-unknown-intent.util.js';
import { readStructuralEnrichHints } from './ai-intent-structural-enrich.util.js';

describe('ai-intent-structural-enrich-skip.util (pipe-1.7.3)', () => {
  it('exports pipe marker and skip trace detail', () => {
    expect(STRUCTURAL_ENRICH_SKIP_PIPE_MARKER).toBe('pipe-1.7.3');
    expect(UTIL_MARKER).toBe('pipe-1.7.3');
    expect(STRUCTURAL_ENRICH_SKIP_TRACE_DETAIL).toContain(
      'skipped; self_verify clarify',
    );
  });

  it('shouldSkipStructuralEnrichAfterSelfVerify when clarify payload present', () => {
    expect(
      shouldSkipStructuralEnrichAfterSelfVerify({
        intent: {
          action: 'create_booking',
          params: {},
          reasoning: 'test',
          confidence: 0.4,
        },
        result: { passed: false, ruleId: 'schedule_vocab_mismatch' },
        clarify: {
          summary: 'clarify',
          clarifyFields: ['intentChoice'],
          suggestions: [],
          loweredConfidence: 0.4,
          ruleId: 'schedule_vocab_mismatch',
          reason: 'ambiguous_schedule_intent',
        },
      }),
    ).toBe(true);
    expect(
      shouldSkipStructuralEnrichAfterSelfVerify({
        intent: {
          action: 'clear_schedule',
          params: {},
          reasoning: 'test',
          confidence: 0.9,
        },
        result: { passed: true },
      }),
    ).toBe(false);
  });

  it.each(
    STRUCTURAL_ENRICH_SKIP_SCENARIOS.filter(
      (s) => s.expectSkipStructuralEnrich,
    ),
  )('resolveSelfVerifyStageOutcome skips enrich path $id', (scenario) => {
    const outcome = resolveSelfVerifyStageOutcome(
      scenario.prompt,
      {
        action: scenario.classifyAction,
        params: scenario.classifyParams ?? {},
        reasoning: 'classify',
        confidence: scenario.classifyConfidence,
      },
      'dashboard',
    );
    expect(outcome.result.passed).toBe(false);
    expect(shouldSkipStructuralEnrichAfterSelfVerify(outcome)).toBe(true);
    expect(assertStructuralEnrichSkipped(outcome.clarify)).toBe(true);
  });

  it.each(
    STRUCTURAL_ENRICH_SKIP_SCENARIOS.filter(
      (s) => !s.expectSkipStructuralEnrich,
    ),
  )('resolveSelfVerifyStageOutcome continues to enrich $id', (scenario) => {
    const outcome = resolveSelfVerifyStageOutcome(
      scenario.prompt,
      {
        action: scenario.classifyAction,
        params: scenario.classifyParams ?? {},
        reasoning: 'classify',
        confidence: scenario.classifyConfidence,
      },
      'dashboard',
    );
    expect(shouldSkipStructuralEnrichAfterSelfVerify(outcome)).toBe(false);
    expect(outcome.clarify).toBeUndefined();
  });

  it('buildStructuralEnrichSkipTraceDetail uses stable skip message', () => {
    expect(buildStructuralEnrichSkipTraceDetail('create_booking')).toEqual({
      stage: 'structural_enrich',
      action: 'create_booking',
      detail: STRUCTURAL_ENRICH_SKIP_TRACE_DETAIL,
    });
  });

  it('readStructuralEnrichHints absent when enrich not applied', () => {
    expect(readStructuralEnrichHints({})).toBeUndefined();
  });
});
