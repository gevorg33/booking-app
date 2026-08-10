import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import {
  buildAccuracyBaseline,
  buildDeterministicAccuracyReport,
  buildIntentAccuracyStats,
  diffAccuracyAgainstBaseline,
  formatAccuracyReport,
  loadAccuracyBaseline,
  resolveEvalCaseIntentLabel,
  evaluateAccuracyRatchet,
  runAiAccuracyGate,
  writeAccuracyBaseline,
} from './ai-command-eval.report.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

describe('ai-command-eval.report (acc-2.8)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('groups cases by rescuedAction intent label', () => {
    const evalCase: AiCommandEvalCase = {
      id: 'x',
      prompt: 'book nearest slot',
      expect: { rescuedAction: 'book_nearest_slot' },
    };
    expect(resolveEvalCaseIntentLabel(evalCase)).toBe('book_nearest_slot');
  });

  it('labels compound cases with joined steps', () => {
    const evalCase: AiCommandEvalCase = {
      id: 'compound',
      prompt: 'x',
      expect: {
        compoundSurface: 'dashboard',
        compoundSteps: ['cancel_package_visit', 'fill_slot_from_waitlist'],
      },
    };
    expect(resolveEvalCaseIntentLabel(evalCase)).toBe(
      'compound:cancel_package_visit+fill_slot_from_waitlist',
    );
  });

  it('builds per-intent accuracy stats', () => {
    const cases: AiCommandEvalCase[] = [
      {
        id: 'a',
        prompt: 'Show appointments today',
        expect: { routeTier: 'read_only' },
      },
      {
        id: 'b',
        prompt: 'Show appointments today',
        expect: { routeTier: 'compound' },
      },
    ];
    const results = cases.map((c) => evaluateDeterministicEvalCase(c));
    const stats = buildIntentAccuracyStats(cases, results);
    expect(stats.find((row) => row.intent === 'route:read_only')?.passed).toBe(
      1,
    );
    expect(stats.find((row) => row.intent === 'route:compound')?.failed).toBe(
      1,
    );
  });

  it('formats report with accuracy and per-intent rows', () => {
    const report = buildDeterministicAccuracyReport([
      {
        id: 'ok',
        prompt: 'Show appointments today',
        expect: { routeTier: 'read_only' },
      },
    ]);
    const text = formatAccuracyReport(report);
    expect(text).toContain('AI deterministic accuracy report');
    expect(text).toContain('route:read_only');
    expect(text).toContain('100%');
  });

  it('diffs against baseline and flags regressed intents', () => {
    const baseline = buildAccuracyBaseline({
      totalCases: 2,
      passed: 2,
      failed: 0,
      accuracyPct: 100,
      llmCaseCount: 0,
      skippedLlmCases: 0,
      byIntent: [
        {
          intent: 'route:read_only',
          passed: 2,
          failed: 0,
          total: 2,
          accuracyPct: 100,
        },
      ],
      failures: [],
    });
    const diff = diffAccuracyAgainstBaseline(
      [
        {
          intent: 'route:read_only',
          passed: 1,
          failed: 1,
          total: 2,
          accuracyPct: 50,
        },
      ],
      baseline,
      50,
    );
    expect(diff.accuracyDeltaPct).toBe(-50);
    expect(diff.regressedIntents[0]?.intent).toBe('route:read_only');
  });

  it('runAiAccuracyGate refuses to pass with no baseline to ratchet against', () => {
    // Explicit empty path: without it this reads the repo's committed baseline
    // and reports staleness instead, which is a different rule.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-eval-nobaseline-'));
    const result = runAiAccuracyGate({
      cases: [
        {
          id: 'bad',
          prompt: 'Show appointments today',
          expect: { routeTier: 'compound' },
        },
      ],
      baselinePath: path.join(dir, 'absent.json'),
    });
    fs.rmSync(dir, { recursive: true, force: true });
    expect(result.report.failed).toBe(1);
    expect(result.exitCode).toBe(1);
    // Not because a case failed — failures alone are no longer fatal — but
    // because there is nothing to compare them to.
    expect(result.violations.map((v) => v.code)).toEqual(['no_baseline']);
  });

  it('runAiAccuracyGate exits non-zero when baseline case count is stale (acc-2.9)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-eval-baseline-'));
    const baselinePath = path.join(dir, 'baseline.json');
    writeAccuracyBaseline(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        totalCases: 1,
        passed: 1,
        failed: 0,
        accuracyPct: 100,
        llmCaseCount: 0,
        byIntent: {
          'route:read_only': {
            passed: 1,
            failed: 0,
            total: 1,
            accuracyPct: 100,
          },
        },
      },
      baselinePath,
    );

    const result = runAiAccuracyGate({
      cases: [
        {
          id: 'ok-a',
          prompt: 'Show appointments today',
          expect: { routeTier: 'read_only' },
        },
        {
          id: 'ok-b',
          prompt: 'Show appointments today',
          expect: { routeTier: 'read_only' },
        },
      ],
      baselinePath,
    });

    expect(result.report.failed).toBe(0);
    expect(result.exitCode).toBe(1);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes baseline when updateBaseline is true', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-eval-baseline-'));
    const baselinePath = path.join(dir, 'baseline.json');
    const result = runAiAccuracyGate({
      cases: [
        {
          id: 'ok',
          prompt: 'Show appointments today',
          expect: { routeTier: 'read_only' },
        },
      ],
      updateBaseline: true,
      baselinePath,
    });
    expect(result.baselineWritten).toBe(true);
    expect(loadAccuracyBaseline(baselinePath)?.accuracyPct).toBe(100);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('persists and reloads baseline snapshots', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-eval-baseline-'));
    const baselinePath = path.join(dir, 'baseline.json');
    const snapshot = buildAccuracyBaseline({
      totalCases: 1,
      passed: 1,
      failed: 0,
      accuracyPct: 100,
      llmCaseCount: 0,
      skippedLlmCases: 0,
      byIntent: [],
      failures: [],
    });
    writeAccuracyBaseline(snapshot, baselinePath);
    expect(loadAccuracyBaseline(baselinePath)?.totalCases).toBe(1);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

/**
 * AI-ROADMAP Phase 2 — the ratchet is the gate.
 *
 * The old gate demanded zero failures against a corpus with 404 of them, so it
 * had never passed, and every check behind `if (exitCode === 0)` had never run.
 * These tests pin the replacement: the committed baseline is the bar, failures
 * may fall but never rise, and a single intent getting worse is caught even
 * when the total stays flat.
 */
describe('accuracy ratchet (acc-2.9)', () => {
  const PASS: AiCommandEvalCase = {
    id: 'ok',
    prompt: 'Show appointments today',
    expect: { routeTier: 'read_only' },
  };
  const FAIL: AiCommandEvalCase = {
    id: 'bad',
    prompt: 'Show appointments today',
    expect: { routeTier: 'compound' },
  };

  function withBaseline(
    cases: AiCommandEvalCase[],
    baselineCases: AiCommandEvalCase[],
  ) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-ratchet-'));
    const baselinePath = path.join(dir, 'baseline.json');
    runAiAccuracyGate({
      cases: baselineCases,
      baselinePath,
      updateBaseline: true,
    });
    const result = runAiAccuracyGate({ cases, baselinePath });
    fs.rmSync(dir, { recursive: true, force: true });
    return result;
  }

  it('passes with known failures, so long as they did not grow', () => {
    // The whole point: 404 failures is debt, not a build break.
    const result = withBaseline([PASS, FAIL], [PASS, FAIL]);
    expect(result.report.failed).toBe(1);
    expect(result.violations).toEqual([]);
    expect(result.exitCode).toBe(0);
  });

  it('fails when a case that used to pass starts failing', () => {
    const result = withBaseline([FAIL, FAIL], [PASS, FAIL]);
    expect(result.exitCode).toBe(1);
    expect(result.violations.map((v) => v.code)).toContain('more_failures');
  });

  it('passes when failures go down', () => {
    const result = withBaseline([PASS, PASS], [PASS, FAIL]);
    expect(result.violations).toEqual([]);
    expect(result.exitCode).toBe(0);
  });

  it('fails when the corpus size moved, because percentages stop comparing', () => {
    const result = withBaseline([PASS, PASS, PASS], [PASS, PASS]);
    expect(result.violations.map((v) => v.code)).toEqual(['stale_baseline']);
    expect(result.exitCode).toBe(1);
  });

  it('names the rule that broke, not just a number', () => {
    const result = withBaseline([FAIL, FAIL], [PASS, FAIL]);
    expect(result.violations[0].message).toMatch(/Failures rose from 1 to 2/);
  });

  it('an updating run does not fail against the line it just moved', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-ratchet-'));
    const baselinePath = path.join(dir, 'baseline.json');
    runAiAccuracyGate({
      cases: [PASS, PASS],
      baselinePath,
      updateBaseline: true,
    });
    const result = runAiAccuracyGate({
      cases: [PASS, FAIL],
      baselinePath,
      updateBaseline: true,
    });
    expect(result.exitCode).toBe(0);
    expect(result.baselineWritten).toBe(true);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('catches an intent regressing even when the total holds steady', () => {
    // One intent losing cases while another gains them is a regression wearing
    // a disguise; the overall count alone would not see it.
    const report = buildDeterministicAccuracyReport([PASS]);
    const rigged = {
      ...report,
      failed: 0,
      baseline: {
        version: 1 as const,
        generatedAt: '2026-01-01T00:00:00.000Z',
        totalCases: report.totalCases,
        passed: report.passed,
        failed: 0,
        accuracyPct: 100,
        llmCaseCount: 0,
        byIntent: Object.fromEntries(
          report.byIntent.map((r) => [
            r.intent,
            { passed: r.total, failed: 0, total: r.total, accuracyPct: 100 },
          ]),
        ),
      },
      baselineDiff: {
        accuracyDeltaPct: 0,
        regressedIntents: [
          {
            intent: 'lookup_customer',
            baselinePct: 100,
            currentPct: 0,
            deltaPct: -100,
            baselineFailed: 0,
            currentFailed: 6,
          },
        ],
        improvedIntents: [],
        newIntents: [],
        removedIntents: [],
      },
    };
    const violations = evaluateAccuracyRatchet(rigged);
    expect(violations.map((v) => v.code)).toEqual(['intent_regressed']);
    expect(violations[0].message).toContain('lookup_customer');
  });
});
