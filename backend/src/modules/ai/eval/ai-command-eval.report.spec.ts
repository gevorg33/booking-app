import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
} from './ai-command-eval.cases.js';
import {
  assertAccuracyFloorGate,
  applyAccuracyFloorRatchet,
  buildEvalAccuracyReport,
  formatEvalAccuracyReport,
  formatEvalIntentBreakdown,
  loadEvalBaseline,
  validateEvalBaseline,
} from './ai-command-eval.report.js';

describe('ai-command-eval.report (acc-2.8–2.11)', () => {
  it('acc-2.8 — builds full-suite report with per-intent breakdown and baseline diff', () => {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      baseline,
    );

    expect(report.deterministicCases).toBeGreaterThanOrEqual(5400);
    expect(report.byIntent.length).toBeGreaterThan(0);
    expect(report.byCorpus.some((row) => row.key === 'adversarial')).toBe(true);
    expect(report.accuracyDelta).toBeDefined();
    expect(report.totalCasesDelta).toBeDefined();
    expect(report.lastRecordedAccuracy).toBe(baseline.lastAccuracy);
    expect(report.lastRecordedDeterministicCases).toBe(
      baseline.lastDeterministicCases,
    );

    const formatted = formatEvalAccuracyReport(report);
    expect(formatted).toContain('Deterministic:');
    expect(formatted).toContain('Delta vs floor:');
    expect(formatted).toContain('Delta vs last baseline:');
    expect(formatted).toContain('Per-intent scorecards');
    expect(formatted).toContain('Intent metrics:');

    const intentBreakdown = formatEvalIntentBreakdown(report.byIntent, {
      maxRows: 5,
    });
    expect(intentBreakdown).toMatch(/Per-intent scorecards/);
    expect(intentBreakdown.split('\n').length).toBeGreaterThan(2);
  });

  it('builds scorecards and passes gate at current baseline', () => {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      baseline,
    );

    expect(report.gatePassed).toBe(true);
    expect(report.failed).toBe(0);
  });

  it('parity-4.3 — reports per role/surface eval accuracy buckets', () => {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      baseline,
    );

    expect(report.byRoleSurface.length).toBeGreaterThan(0);
    expect(report.byRoleSurface.some((row) => row.key === 'owner:dashboard')).toBe(
      true,
    );
    expect(formatEvalAccuracyReport(report)).toContain('Per role / surface (parity-4.3)');
  });

  it('acc-2.9 — fails gate when accuracy drops below floor', () => {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      [
        {
          id: 'forced-fail',
          prompt: 'Show appointments today',
          expect: { routeTier: 'compound' },
        },
      ],
      baseline,
    );
    expect(report.gatePassed).toBe(false);
    expect(report.gateFailures.length).toBeGreaterThan(0);
    expect(() => assertAccuracyFloorGate(report)).toThrow(/acc-2.9/);
    expect(() => assertAccuracyFloorGate(report)).toThrow(/merge blocked/i);
  });

  it('acc-2.9 — fails gate when deterministic case count drops below minTotalCases', () => {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.slice(0, 10),
      { ...baseline, minTotalCases: 5894, accuracyFloor: 1 },
    );
    expect(report.gatePassed).toBe(false);
    expect(report.gateFailures.some((line) => /deterministic case count/i.test(line))).toBe(
      true,
    );
    expect(() => assertAccuracyFloorGate(report)).toThrow(/deterministic case count/i);
  });

  it('acc-2.11 — includes macro/micro intent metrics on the report', () => {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      baseline,
    );

    expect(report.intentMetrics.macroPrecision).toBeGreaterThan(0);
    expect(report.intentMetrics.microRecall).toBe(report.accuracy);
    expect(report.byIntent[0]).toMatchObject({
      precision: expect.any(Number),
      recall: expect.any(Number),
      f1: expect.any(Number),
      truePositives: expect.any(Number),
      falsePositives: expect.any(Number),
      falseNegatives: expect.any(Number),
    });
  });

  it('acc-2.9 — validateEvalBaseline rejects invalid floors', () => {
    expect(validateEvalBaseline({ ...loadEvalBaseline(), accuracyFloor: 1.5 })).toEqual([
      'accuracyFloor must be between 0 and 1, got 1.5',
    ]);
  });

  it('acc-6.4 — applyAccuracyFloorRatchet bumps floor when gate passes with headroom', () => {
    const dir = mkdtempSync(join(tmpdir(), 'eval-baseline-'));
    const baselinePath = join(dir, 'baseline.json');
    const baseline = {
      ...loadEvalBaseline(),
      accuracyFloor: 0.95,
      ratchetHistory: [],
    };
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
    const report = buildEvalAccuracyReport(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      baseline,
    );
    const result = applyAccuracyFloorRatchet(report, baselinePath);
    expect(result.applied).toBe(true);
    expect(result.ratchet.currentFloor).toBe(0.95);
    expect(result.ratchet.proposedFloor).toBeGreaterThan(0.95);
    const updated = JSON.parse(readFileSync(baselinePath, 'utf8'));
    expect(updated.accuracyFloor).toBe(result.ratchet.proposedFloor);
    expect(updated.ratchetHistory).toHaveLength(1);
    expect(updated.ratchetHistory[0]).toMatchObject({
      from: 0.95,
      to: result.ratchet.proposedFloor,
    });
  });
});
