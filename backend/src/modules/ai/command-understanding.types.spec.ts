import {
  classifiedIntentToCandidate,
  PIPELINE_COMPLETION_STAGE_ORDER,
  PIPELINE_UNDERSTAND_STAGE_ORDER,
  type IntentCandidate,
  type PipelineUnderstandResult,
} from './command-understanding.types.js';
import type { PipelineStage } from './command-completion.types.js';
import {
  evaluateConfidenceGate,
  shouldEscalateToSemantic,
} from './confidence-gate.util.js';

describe('command-understanding.types (pipe-1.0.1)', () => {
  it('defines understand stages in target flow order', () => {
    expect([...PIPELINE_UNDERSTAND_STAGE_ORDER]).toEqual([
      'normalize',
      'fast_heuristics',
      'classify',
      'confidence_gate',
      'semantic_match',
      'rerank',
      'narrow_reclassify',
      'rescue',
      'self_verify',
      'structural_enrich',
    ]);
  });

  it('defines completion stages after understand phase', () => {
    expect([...PIPELINE_COMPLETION_STAGE_ORDER]).toEqual([
      'resolve',
      'validate',
      'plan',
      'execute',
      'clarify',
      'telemetry',
    ]);
  });

  it('uses only valid PipelineStage values', () => {
    const allStages: PipelineStage[] = [
      ...PIPELINE_UNDERSTAND_STAGE_ORDER,
      ...PIPELINE_COMPLETION_STAGE_ORDER,
    ];
    const unique = new Set(allStages);
    expect(unique.size).toBe(allStages.length);
  });

  it('maps ClassifiedIntent to IntentCandidate', () => {
    const candidate = classifiedIntentToCandidate({
      action: 'create_booking',
      params: { bookingFirstAvailable: true },
      reasoning: 'book first slot',
      confidence: 0.91,
    });
    expect(candidate).toMatchObject<IntentCandidate>({
      action: 'create_booking',
      confidence: 0.91,
      source: 'classifier',
      params: { bookingFirstAvailable: true },
      reasoning: 'book first slot',
    });
  });

  it('defaults missing classifier confidence to zero', () => {
    expect(
      classifiedIntentToCandidate({
        action: 'unknown',
        params: {},
        reasoning: 'unclear',
      }).confidence,
    ).toBe(0);
  });

  describe('ConfidenceGateResult via evaluateConfidenceGate', () => {
    it.each([
      {
        id: 'unknown-escalates',
        action: 'unknown',
        confidence: 0.2,
        escalate: true,
        decision: 'escalate_semantic' as const,
      },
      {
        id: 'low-confidence-escalates',
        action: 'create_booking',
        confidence: 0.2,
        escalate: true,
        decision: 'escalate_semantic' as const,
      },
      {
        id: 'high-confidence-skips',
        action: 'create_booking',
        confidence: 0.99,
        escalate: false,
        decision: 'skip_semantic' as const,
      },
      {
        id: 'ambiguous-band',
        action: 'create_booking',
        confidence: 0.7,
        escalate: false,
        decision: 'ambiguous_band' as const,
      },
      {
        id: 'missing-confidence',
        action: 'create_booking',
        confidence: undefined,
        escalate: true,
        decision: 'escalate_semantic' as const,
      },
    ])('$id', ({ action, confidence, escalate, decision }) => {
      const gate = evaluateConfidenceGate(action, confidence);
      expect(gate.shouldEscalateToSemantic).toBe(escalate);
      expect(gate.decision).toBe(decision);
      expect(shouldEscalateToSemantic(action, confidence)).toBe(escalate);
    });
  });

  it('accepts a fully shaped PipelineUnderstandResult', () => {
    const gate = evaluateConfidenceGate('create_booking', 0.99);
    const result: PipelineUnderstandResult = {
      status: 'resolved',
      action: 'create_booking',
      params: { bookingFirstAvailable: true },
      reasoning: 'high-confidence classify',
      confidence: 0.99,
      candidates: [
        classifiedIntentToCandidate({
          action: 'create_booking',
          params: {},
          reasoning: 'classify',
          confidence: 0.99,
        }),
      ],
      trace: [
        {
          stage: 'classify',
          action: 'create_booking',
          at: new Date().toISOString(),
        },
      ],
      gate,
      context: {
        originalPrompt: 'book first available',
        normalizedPrompt: 'book first available',
        classifierContext: null,
        method: 'passthrough',
      },
      normalization: {
        original: 'book first available',
        normalized: 'book first available',
        method: 'passthrough',
        classifierContext: null,
      },
      surface: 'dashboard',
    };
    expect(result.status).toBe('resolved');
    expect(result.gate.decision).toBe('skip_semantic');
  });
});
