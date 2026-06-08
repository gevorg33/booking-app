import { enrichClassifiedIntent, matchSemanticIntent } from './ai-classification-engine.util.js';
import { SEMANTIC_PARAPHRASE_EVAL_CASES } from './ai-classification-paraphrase.fixtures.js';

describe('AiClassificationEngine integration (acc-3)', () => {
  it('semantic rescue upgrades unknown dashboard classify to create_booking', async () => {
    const match = matchSemanticIntent(
      'Put Maria on the books for facemassage tomorrow at 14:00',
      'dashboard',
      { threshold: 0.35 },
    );
    expect(match?.action).toBe('create_booking');

    const enriched = await enrichClassifiedIntent({
      prompt: 'Put Maria on the books for facemassage tomorrow at 14:00',
      surface: 'dashboard',
      intent: { action: 'unknown', params: {} },
      skipLlmSelfCheck: true,
      skipEscalationTieBreaker: true,
    });
    expect(enriched.intent.action).toBe('create_booking');
    expect(enriched.intent.params?._classificationSource).toBe('semantic');
    expect(enriched.semanticMatch?.matchedPhraseId).toBeTruthy();
  });

  it('enrichment surfaces clarify flag when verification fails', async () => {
    const enriched = await enrichClassifiedIntent({
      prompt: 'Explain why the GDPR checklist is failing',
      surface: 'dashboard',
      intent: { action: 'create_booking', params: {}, confidence: 0.95 },
      skipLlmSelfCheck: true,
      skipEscalationTieBreaker: true,
    });
    expect(enriched.intent.params?._classificationNeedsClarify).toBe(true);
    expect(enriched.verification.ok).toBe(false);
  });

  it('acc-3.15 — low semantic confidence routes to clarify instead of adopting action', async () => {
    const enriched = await enrichClassifiedIntent({
      prompt: 'who can do lashes tomorrow evening',
      surface: 'dashboard',
      intent: { action: 'unknown', params: {} },
      semanticMatcher: async () => ({
        action: 'check_providers_for_service',
        confidence: 0.62,
        matchedPhraseId: 'sem-test',
        source: 'embedding',
      }),
      skipLlmSelfCheck: true,
      skipEscalationTieBreaker: true,
    });
    expect(enriched.intent.action).toBe('unknown');
    expect(enriched.intent.params?._semanticClarify).toBe(true);
    expect(enriched.intent.params?._classificationNeedsClarify).toBe(true);
  });

  it.each(SEMANTIC_PARAPHRASE_EVAL_CASES.map((entry) => [entry.id, entry]))(
    'acc-3.16 — paraphrase %s resolves via enrichClassifiedIntent from unknown',
    async (_id, evalCase) => {
      const enriched = await enrichClassifiedIntent({
        prompt: evalCase.prompt,
        surface: evalCase.surface ?? 'dashboard',
        intent: { action: 'unknown', params: {} },
        skipLlmSelfCheck: true,
      });
      expect(enriched.intent.action).toBe(
        evalCase.expect.rescuedAction ?? evalCase.expect.action,
      );
    },
  );
});
