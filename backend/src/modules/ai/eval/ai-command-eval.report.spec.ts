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
    expect(stats.find((row) => row.intent === 'route:read_only')?.passed).toBe(1);
    expect(stats.find((row) => row.intent === 'route:compound')?.failed).toBe(1);
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

  it('runAiAccuracyGate exits non-zero when a case fails', () => {
    const result = runAiAccuracyGate({
      cases: [
        {
          id: 'bad',
          prompt: 'Show appointments today',
          expect: { routeTier: 'compound' },
        },
      ],
    });
    expect(result.report.failed).toBe(1);
    expect(result.exitCode).toBe(1);
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
