import {
  AI_COMMAND_EVAL_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_LLM_CASES,
} from './ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_CORPUS_CASES } from './ai-command-eval.corpus.js';
import {
  ACC_EVAL_MIN_TOTAL_CASES,
  buildEvalCoverageReport,
  formatEvalCoverageReport,
} from './ai-command-eval.coverage.util.js';
import { assertLocaleParityGate } from './ai-command-eval.locale-parity.util.js';
import {
  assertAccuracyFloorGate,
  buildEvalAccuracyReport,
  formatEvalAccuracyReport,
  loadEvalBaseline,
} from './ai-command-eval.report.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';
import {
  runSemanticParaphraseEvalSuite,
  SEMANTIC_PARAPHRASE_EVAL_CASES,
} from './ai-command-eval.semantic.util.js';
import { assertSemanticParaphraseCoverageGate } from './ai-command-eval.semantic-paraphrase.util.js';
import {
  buildEvalHarvestCandidatesFromRows,
  isEvalHarvestCandidate,
} from '../ai-command-trace.util.js';

describe('AI accuracy regression gate (acc-2)', () => {
  it('acc-2.1 — production prompt harvester selects failure signals and anonymizes prompts', () => {
    const rows = [
      {
        traceId: 't-suspected',
        surface: 'dashboard',
        locale: 'en',
        action: 'create_booking',
        outcome: 'clarified',
        confidence: 0.42,
        failureSignal: 'suspected_miss' as const,
        feedbackRating: null,
        correctedAction: 'list_bookings',
        rawPrompt: 'book anna@gmail.com for haircut tomorrow',
        createdAt: new Date(),
      },
      {
        traceId: 't-down',
        surface: 'customer',
        locale: 'en',
        action: 'create_booking',
        outcome: 'executed',
        confidence: 0.9,
        failureSignal: null,
        feedbackRating: 'down' as const,
        correctedAction: null,
        rawPrompt: 'book anna@gmail.com for haircut tomorrow',
        createdAt: new Date(),
      },
      {
        traceId: 't-ok',
        surface: 'dashboard',
        locale: 'en',
        action: 'list_bookings',
        outcome: 'executed',
        confidence: 0.95,
        failureSignal: null,
        feedbackRating: null,
        correctedAction: null,
        rawPrompt: 'show appointments today',
        createdAt: new Date(),
      },
    ];

    expect(isEvalHarvestCandidate(rows[0]!)).toBe(true);
    expect(isEvalHarvestCandidate(rows[1]!)).toBe(true);
    expect(isEvalHarvestCandidate(rows[2]!)).toBe(false);

    const candidates = buildEvalHarvestCandidatesFromRows(rows, 10);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.promptSnippet).toContain('[email]');
    expect(candidates[0]?.failureCount).toBe(2);
    expect(candidates[0]?.correctedAction).toBe('list_bookings');
  });

  it('acc-2.3 — deterministic eval set meets 2,000+ labeled cases with balanced domains', () => {
    const report = buildEvalCoverageReport(AI_COMMAND_EVAL_DETERMINISTIC_CASES);
    if (!report.balancePassed) {
      throw new Error(formatEvalCoverageReport(report));
    }
    expect(report.totalCases).toBeGreaterThanOrEqual(ACC_EVAL_MIN_TOTAL_CASES);
  });

  it('acc-2.4 — every EN golden case has HY and RU locale parity siblings', () => {
    assertLocaleParityGate(AI_COMMAND_EVAL_DETERMINISTIC_CASES);
  });

  it('acc-2.7 — adversarial corpus blocks security preflight and enforceAction abuse', () => {
    const adversarialCases = AI_COMMAND_EVAL_CORPUS_CASES.filter(
      (entry) => entry.corpus === 'adversarial',
    );
    expect(adversarialCases.length).toBeGreaterThanOrEqual(24);
    for (const evalCase of adversarialCases) {
      expect(evalCase.expect.securityBlocked).toBe(true);
      expect(evalCase.expect.securityBlockReason).toBeTruthy();
    }
  });

  it('acc-2.6 — ambiguity corpus prompts expect clarify fields, not execution', () => {
    const ambiguityCases = AI_COMMAND_EVAL_CORPUS_CASES.filter(
      (entry) => entry.corpus === 'ambiguity',
    );
    expect(ambiguityCases.length).toBeGreaterThanOrEqual(24);
    for (const evalCase of ambiguityCases) {
      expect(evalCase.expect.clarifyFields?.length).toBeGreaterThan(0);
      expect(evalCase.expect.clarifyAction).toBeTruthy();
    }
  });

  it('acc-2.5 — typo/fuzzy corpus has eval-filtered variants of top prompts', () => {
    const typoCases = AI_COMMAND_EVAL_CORPUS_CASES.filter(
      (entry) => entry.corpus === 'typo',
    );
    expect(typoCases.length).toBeGreaterThanOrEqual(80);
    for (const evalCase of typoCases) {
      expect(evalCase.id).toMatch(/^typo-.+-/);
    }
  });

  it('acc-2.4–2.7 — corpus cases are included in the deterministic suite', () => {
    const ids = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((entry) => entry.id),
    );
    for (const corpusCase of AI_COMMAND_EVAL_CORPUS_CASES) {
      expect(ids.has(corpusCase.id)).toBe(true);
    }
    expect(AI_COMMAND_EVAL_CORPUS_CASES.length).toBeGreaterThanOrEqual(10);
  });

  it('acc-2.8 — full deterministic eval suite reports accuracy and per-intent scorecards', () => {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      [...AI_COMMAND_EVAL_DETERMINISTIC_CASES, ...AI_COMMAND_EVAL_LLM_CASES],
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      baseline,
    );

    expect(report.deterministicCases).toBeGreaterThanOrEqual(
      baseline.minTotalCases,
    );
    expect(report.byIntent.length).toBeGreaterThan(0);
    expect(formatEvalAccuracyReport(report)).toContain('Per-intent scorecards');
    expect(report.accuracyDeltaVsLast).toBeDefined();
  });

  it('acc-2.9 — full deterministic eval passes accuracy floor gate', () => {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      [...AI_COMMAND_EVAL_DETERMINISTIC_CASES, ...AI_COMMAND_EVAL_LLM_CASES],
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      baseline,
    );

    assertAccuracyFloorGate(report);

    expect(report.accuracy).toBeGreaterThanOrEqual(baseline.accuracyFloor);
    expect(report.deterministicCases).toBeGreaterThanOrEqual(
      baseline.minTotalCases,
    );
    expect(report.gatePassed).toBe(true);
    expect(report.failed).toBe(0);
  });

  it('acc-2.11 — per-intent scorecards expose precision/recall/F1 and cover failures', () => {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      baseline,
    );
    const failedInScorecards = report.byIntent.reduce(
      (sum, row) => sum + row.failed,
      0,
    );
    expect(failedInScorecards).toBe(report.failed);
    expect(report.byIntent.every((row) => row.precision >= 0)).toBe(true);
    expect(report.byIntent.every((row) => row.recall >= 0)).toBe(true);
    expect(report.byIntent.every((row) => row.f1 >= 0)).toBe(true);
    expect(report.intentMetrics.macroF1).toBeGreaterThanOrEqual(0.99);
    expect(report.intentMetrics.microF1).toBeGreaterThanOrEqual(0.99);
    expect(formatEvalAccuracyReport(report)).toContain('precision / recall / F1');
    expect(report.byCorpus.some((row) => row.key === 'golden')).toBe(true);
  });

  it('acc-2.8 — legacy routing cases still pass independently', () => {
    const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_CASES);
    expect(summary.failed).toBe(0);
  });

  it('acc-3.16 — semantic paraphrase corpus resolves via matcher', () => {
    assertSemanticParaphraseCoverageGate(SEMANTIC_PARAPHRASE_EVAL_CASES);
    const summary = runSemanticParaphraseEvalSuite();
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(SEMANTIC_PARAPHRASE_EVAL_CASES.length);
  });
});
