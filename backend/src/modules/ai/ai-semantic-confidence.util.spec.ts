import {
  applySemanticMatchToIntent,
  buildSemanticClarifyCandidates,
  buildSemanticClarifySummary,
  buildSemanticConfidenceClarifyIfNeeded,
  resolveSemanticMatchDisposition,
  shouldApplySemanticMatch,
  shouldRunSemanticMatcherForIntent,
} from './ai-semantic-confidence.util.js';
import {
  SEMANTIC_CLARIFY_PROMPT_SCENARIOS,
  SEMANTIC_CONFIDENCE_SCENARIOS,
} from './ai-semantic-confidence.fixtures.js';
import { enrichClassifiedIntent } from './ai-classification-engine.util.js';
import type { SemanticIntentMatch } from './ai-classification-engine.types.js';

describe('ai-semantic-confidence.util (acc-3.15)', () => {
  it.each(SEMANTIC_CONFIDENCE_SCENARIOS)(
    'disposition $id → $expectedDisposition',
    ({ semanticConfidence, action, expectedDisposition }) => {
      expect(
        resolveSemanticMatchDisposition({ action, confidence: semanticConfidence }),
      ).toBe(expectedDisposition);
      expect(
        shouldApplySemanticMatch({
          action,
          confidence: semanticConfidence,
          matchedPhraseId: 'test',
          source: 'canonical',
        }),
      ).toBe(expectedDisposition === 'execute');
    },
  );

  it.each(SEMANTIC_CLARIFY_PROMPT_SCENARIOS)(
    'prompt scenario $id',
    async ({
      classifierAction,
      classifierConfidence,
      semanticAction,
      semanticConfidence,
      expectClarify,
      expectCandidateCount,
    }) => {
      const semanticMatch: SemanticIntentMatch = {
        action: semanticAction,
        confidence: semanticConfidence,
        matchedPhraseId: 'sem-test',
        source: 'canonical',
      };

      const enriched = await enrichClassifiedIntent({
        prompt: 'test prompt',
        surface: 'dashboard',
        intent: {
          action: classifierAction,
          confidence: classifierConfidence,
          params: {},
        },
        semanticMatcher: async () => semanticMatch,
        skipLlmSelfCheck: true,
        skipEscalationTieBreaker: true,
      });

      if (expectClarify) {
        expect(enriched.intent.params?._semanticClarify).toBe(true);
        expect(enriched.intent.params?._classificationNeedsClarify).toBe(true);
        expect(
          (enriched.intent.params?._semanticClarifyCandidates as unknown[])?.length,
        ).toBe(expectCandidateCount ?? 1);
      } else {
        expect(enriched.intent.params?._semanticClarify).toBeUndefined();
        expect(enriched.intent.action).toBe(semanticAction);
      }
    },
  );

  it('buildSemanticClarifyCandidates returns top-2 classifier vs semantic', () => {
    const candidates = buildSemanticClarifyCandidates({
      classifierAction: 'create_booking',
      classifierConfidence: 0.46,
      semanticMatch: {
        action: 'check_providers_for_service',
        confidence: 0.63,
        matchedPhraseId: 'sem-1',
        source: 'embedding',
      },
    });
    expect(candidates).toHaveLength(2);
    expect(candidates.map((entry) => entry.action)).toEqual([
      'create_booking',
      'check_providers_for_service',
    ]);
  });

  it('buildSemanticConfidenceClarifyIfNeeded returns targeted clarify payload', () => {
    const clarify = buildSemanticConfidenceClarifyIfNeeded({
      prompt: 'who can do lashes tomorrow',
      surface: 'dashboard',
      action: 'unknown',
      params: {
        _semanticClarify: true,
        _semanticClarifyCandidates: buildSemanticClarifyCandidates({
          classifierAction: 'create_booking',
          classifierConfidence: 0.46,
          semanticMatch: {
            action: 'check_providers_for_service',
            confidence: 0.63,
            matchedPhraseId: 'sem-1',
            source: 'embedding',
          },
        }),
        _semanticMatchAction: 'check_providers_for_service',
        _semanticMatchConfidence: 0.63,
        _semanticMatchPhraseId: 'sem-1',
        _semanticMatchSource: 'embedding',
      },
    });

    expect(clarify?.details.needsClarification).toBe(true);
    expect(clarify?.details.clarifySource).toBe('semantic_confidence');
    expect(clarify?.summary).toContain('create booking');
    expect(clarify?.summary).toContain('check providers for service');
  });

  it('shouldRunSemanticMatcherForIntent runs for unknown and low-confidence classify', () => {
    expect(shouldRunSemanticMatcherForIntent({ action: 'unknown' })).toBe(true);
    expect(
      shouldRunSemanticMatcherForIntent({
        action: 'create_booking',
        confidence: 0.4,
      }),
    ).toBe(true);
    expect(
      shouldRunSemanticMatcherForIntent({
        action: 'create_booking',
        confidence: 0.9,
      }),
    ).toBe(false);
  });

  it('applySemanticMatchToIntent suppresses low-confidence mutating classify into clarify', () => {
    const intent = {
      action: 'create_booking',
      confidence: 0.46,
      params: {} as Record<string, unknown>,
    };
    const disposition = applySemanticMatchToIntent({
      intent,
      classifierAction: 'create_booking',
      classifierConfidence: 0.46,
      semanticMatch: {
        action: 'check_providers_for_service',
        confidence: 0.63,
        matchedPhraseId: 'sem-1',
        source: 'embedding',
      },
    });
    expect(disposition).toBe('clarify');
    expect(intent.action).toBe('unknown');
    expect(intent.params._semanticClarifySuppressedAction).toBe('create_booking');
  });

  it('buildSemanticClarifySummary handles one and two candidates', () => {
    expect(
      buildSemanticClarifySummary([
        {
          action: 'create_booking',
          confidence: 0.6,
          source: 'semantic',
          label: 'create booking',
        },
      ]),
    ).toContain('create booking');
    expect(
      buildSemanticClarifySummary([
        {
          action: 'create_booking',
          confidence: 0.46,
          source: 'classifier',
          label: 'create booking',
        },
        {
          action: 'check_providers_for_service',
          confidence: 0.63,
          source: 'semantic',
          label: 'check providers for service',
        },
      ]),
    ).toContain(' or ');
  });
});
