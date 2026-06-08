import { SEMANTIC_PARAPHRASE_EVAL_CASES } from './ai-classification-paraphrase.fixtures.js';
import {
  assessClassificationConsensus,
  buildClassifierAppendix,
  buildIntentShortlist,
  enrichClassifiedIntent,
  matchSemanticIntent,
  matchTelemetryRescueHint,
  normalizePromptForClassifier,
  retrieveFewShotExamples,
  shouldSuppressFalseCompound,
  verifyClassifiedIntent,
} from './ai-classification-engine.util.js';
import {
  buildPhrasingMemoryBlock,
  findPhrasingMemoryHits,
} from './ai-classification-phrasing.util.js';
import { runSemanticParaphraseEvalSuite } from './eval/ai-command-eval.semantic.util.js';
import {
  assertClassificationAbHarnessGate,
  runClassificationAbHarness,
} from './ai-classification-ab-harness.util.js';

describe('ai-classification-engine.util (acc-3)', () => {
  it('acc-3.1 — retrieveFewShotExamples ranks booking prompts for dashboard', () => {
    const examples = retrieveFewShotExamples(
      'Book massage with Gevorg tomorrow at 10:00',
      'dashboard',
    );
    expect(examples.length).toBeGreaterThan(0);
    expect(examples[0]?.action).toBe('create_booking');
  });

  it('acc-3.3 — buildIntentShortlist narrows plausible dashboard intents', () => {
    const shortlist = buildIntentShortlist(
      'Book massage with Gevorg tomorrow at 10:00',
      'dashboard',
    );
    expect(shortlist).toContain('unknown');
    expect(shortlist).toContain('create_booking');
    expect(shortlist.length).toBeLessThanOrEqual(15);
  });

  it('acc-3.2 — buildPhrasingMemoryBlock surfaces business aliases', () => {
    const hits = findPhrasingMemoryHits(
      'book the usual with gevorg',
      {
        aliases: {
          gevorg: { employeeName: 'Gevorg' },
          usual: { serviceName: 'Facemassage' },
        },
      },
      'dashboard',
    );
    const block = buildPhrasingMemoryBlock(hits, 'dashboard');
    expect(block).toContain('Business phrasing memory');
    expect(block).toContain('gevorg');
  });

  it('acc-3.10 — buildClassifierAppendix includes few-shot, shortlist, and phrasing memory', () => {
    const appendix = buildClassifierAppendix({
      businessId: 'biz-1',
      prompt: 'Book the usual with Gevorg tomorrow',
      surface: 'dashboard',
      entityMemory: {
        aliases: {
          'the usual': {
            serviceName: 'Face massage',
            employeeName: 'Gevorg',
          },
        },
      },
    });
    expect(appendix.block).toContain('Similar labeled examples');
    expect(appendix.block).toContain('Plausible intents');
    expect(appendix.block).toContain('Business phrasing memory');
    expect(appendix.fewShotCount).toBeGreaterThan(0);
    expect(appendix.shortlistCount).toBeGreaterThan(0);
  });

  it('acc-3.10 — A/B harness scores variants and passes CI gate', () => {
    const report = runClassificationAbHarness();
    assertClassificationAbHarnessGate(report);
    expect(report.promotedVariantId).toMatch(/^(control|fewshot_heavy)$/);
  });

  it('acc-3.11 — matchSemanticIntent resolves paraphrase bank entries', () => {
    for (const evalCase of SEMANTIC_PARAPHRASE_EVAL_CASES.slice(0, 4)) {
      const match = matchSemanticIntent(evalCase.prompt, evalCase.surface ?? 'dashboard', {
        threshold: 0.35,
      });
      expect(match?.action).toBe(
        evalCase.expect.rescuedAction ?? evalCase.expect.action,
      );
    }
  });

  it('acc-3.4 — verifyClassifiedIntent flags availability misclassification', () => {
    const verification = verifyClassifiedIntent(
      'Who is free tomorrow evening for lashes',
      { action: 'create_booking', params: {}, confidence: 0.9 },
      'dashboard',
    );
    expect(verification.ok).toBe(false);
    expect(verification.confidence).toBeLessThan(0.5);
    expect(verification.reasons.length).toBeGreaterThan(0);
  });

  it('acc-3.5 — assessClassificationConsensus escalates read-only vs mutating disagreement', () => {
    const consensus = assessClassificationConsensus(
      { action: 'create_booking', params: {} },
      { tier: 'read_only', reason: 'analytics query' },
      'How many appointments did we have today',
      'dashboard',
    );
    expect(consensus.needsEscalation).toBe(true);
    expect(consensus.deterministicPreferredAction).toBe('summarize_bookings');
  });

  it('acc-3.8 — enrichClassifiedIntent applies telemetry rescue hints', async () => {
    const enriched = await enrichClassifiedIntent({
      prompt: "Who is free tomorrow for lashes",
      surface: 'dashboard',
      intent: { action: 'create_booking', params: {} },
      skipLlmSelfCheck: true,
      skipEscalationTieBreaker: true,
    });
    expect(enriched.intent.action).toBe('check_providers_for_service');
    expect(enriched.intent.reasoning).toContain('telemetry-create-to-check-providers');
  });

  it('acc-3.6 — enrichClassifiedIntent attaches field confidence metadata', async () => {
    const enriched = await enrichClassifiedIntent({
      prompt: 'Book massage tomorrow at 10:00',
      surface: 'dashboard',
      intent: {
        action: 'create_booking',
        params: { serviceName: 'Massage', date: 'tomorrow', timeSlot: '10:00' },
      },
      skipLlmSelfCheck: true,
      skipEscalationTieBreaker: true,
    });
    expect(enriched.intent.params?._fieldConfidence).toBeDefined();
    expect(enriched.intent.params?._fieldConfidence.action).toBeGreaterThan(0);
    expect(enriched.intent.params?._fieldConfidence.serviceName).toBeGreaterThan(
      0.8,
    );
  });

  it('acc-3.9 — shouldSuppressFalseCompound blocks availability "and" false positives', () => {
    expect(
      shouldSuppressFalseCompound(
        'Who is free tomorrow and who can do lashes',
      ),
    ).toBe(true);
    expect(
      shouldSuppressFalseCompound(
        'Book massage and then cancel Maria appointment',
      ),
    ).toBe(false);
    expect(
      shouldSuppressFalseCompound(
        'Book haircut and beard trim Tuesday 10am with Anna',
      ),
    ).toBe(true);
    expect(
      shouldSuppressFalseCompound(
        'Show appointments for Gevorg and Maria tomorrow',
      ),
    ).toBe(true);
  });

  it('acc-3.7 — normalizePromptForClassifier expands abbreviations and times', () => {
    const { normalized, expansions } = normalizePromptForClassifier(
      'Book apt tomrw at 2pm',
    );
    expect(normalized).toContain('appointment');
    expect(normalized).toContain('tomorrow');
    expect(normalized).toContain('14:00');
    expect(expansions.length).toBeGreaterThan(0);
  });

  it('acc-3.8 — matchTelemetryRescueHint maps show appointments pattern', () => {
    const hint = matchTelemetryRescueHint(
      'show Maria appointments tomorrow',
      'list_bookings',
    );
    expect(hint?.toAction).toBe('show_appointments');
  });

  it('acc-3.16 — semantic paraphrase eval suite passes for corpus', () => {
    const summary = runSemanticParaphraseEvalSuite();
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(SEMANTIC_PARAPHRASE_EVAL_CASES.length);
    expect(SEMANTIC_PARAPHRASE_EVAL_CASES.length).toBeGreaterThanOrEqual(120);
  });
});
