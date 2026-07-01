import {
  findClassifierCandidate,
  findRescueCandidate,
  findSemanticCandidate,
  pipelineRescueReason,
  pipelineResultToClassifiedIntent,
  wasPipelineRescueApplied,
} from './command-understanding-result.util.js';
import type { PipelineUnderstandResult } from './command-understanding.types.js';
import { pipelineContextFromNormalization } from './command-understanding-context.util.js';
import { evaluateConfidenceGate } from './confidence-gate.util.js';

function buildUnderstandResult(
  overrides: Partial<PipelineUnderstandResult> = {},
): PipelineUnderstandResult {
  const gate = evaluateConfidenceGate('create_booking', 0.99);
  const normalization = {
    original: 'book first available',
    normalized: 'book first available',
    method: 'passthrough' as const,
    classifierContext: null,
  };
  return {
    status: 'resolved',
    action: 'create_booking',
    params: { bookingFirstAvailable: true },
    reasoning: 'classify',
    confidence: 0.99,
    candidates: [
      {
        action: 'create_booking',
        confidence: 0.99,
        source: 'classifier',
        params: { bookingFirstAvailable: true },
        reasoning: 'classify',
      },
    ],
    trace: [
      {
        stage: 'classify',
        action: 'create_booking',
        at: '2026-01-01T00:00:00.000Z',
      },
    ],
    gate,
    context: pipelineContextFromNormalization(normalization),
    normalization,
    surface: 'dashboard',
    ...overrides,
  };
}

describe('command-understanding-result.util', () => {
  it('maps pipeline result to ClassifiedIntent', () => {
    const parsed = pipelineResultToClassifiedIntent(buildUnderstandResult());
    expect(parsed).toMatchObject({
      action: 'create_booking',
      params: { bookingFirstAvailable: true },
      reasoning: 'classify',
      confidence: 0.99,
    });
  });

  it('finds classifier and rescue candidates', () => {
    const result = buildUnderstandResult({
      candidates: [
        {
          action: 'unknown',
          confidence: 0.2,
          source: 'classifier',
          params: {},
        },
        {
          action: 'check_providers_for_service',
          confidence: 0.85,
          source: 'rescue',
          params: { allProviders: true },
          rescueReason: 'team_wide_availability',
        },
      ],
      action: 'check_providers_for_service',
    });

    expect(findClassifierCandidate(result)?.action).toBe('unknown');
    expect(findRescueCandidate(result)?.rescueReason).toBe(
      'team_wide_availability',
    );
    expect(wasPipelineRescueApplied(result)).toBe(true);
    expect(pipelineRescueReason(result)).toBe('team_wide_availability');
  });

  it('findSemanticCandidate returns highest semantic_match hypothesis', () => {
    const result = buildUnderstandResult({
      candidates: [
        {
          action: 'unknown',
          confidence: 0.2,
          source: 'classifier',
          params: {},
        },
        {
          action: 'create_booking',
          confidence: 0.81,
          source: 'semantic_match',
          rescueReason: 'semantic_match',
        },
        {
          action: 'book_nearest_slot',
          confidence: 0.9,
          source: 'semantic_match',
          rescueReason: 'semantic_match',
        },
      ],
    });

    expect(findSemanticCandidate(result)?.action).toBe('book_nearest_slot');
    expect(findSemanticCandidate(result)?.confidence).toBe(0.9);
  });
});
