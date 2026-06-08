import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';
import { loadEvalBaseline } from './eval/ai-command-eval.report.js';
import { runDeterministicEvalSuite } from './eval/ai-command-eval.runner.js';
import {
  assertParity43CiGate,
  buildParity43EvalFloorStatus,
  formatParity43GateReport,
} from './ai-parity-4.3.util.js';
import {
  applyRoleSurfaceEvalFloorRatchet,
  proposeRoleSurfaceFloorBumps,
  ROLE_SURFACE_EVAL_RATCHET_SCENARIOS,
} from './ai-parity-eval-floor.util.js';

describe('ai-parity-4.3 (per-role eval floor)', () => {
  const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_DETERMINISTIC_CASES);

  it('assertParity43CiGate passes on live deterministic eval', () => {
    expect(() => assertParity43CiGate()).not.toThrow();
  });

  it('buildParity43EvalFloorStatus reports all role/surface buckets', () => {
    const status = buildParity43EvalFloorStatus({
      results: summary.results,
    });
    expect(status.complete).toBe(true);
    expect(status.byRoleSurface.length).toBeGreaterThan(0);
  });

  it.each(ROLE_SURFACE_EVAL_RATCHET_SCENARIOS)(
    'ratchet scenario $id',
    ({ key, currentFloor, measuredAccuracy, expectBump, expectNextFloor }) => {
      const proposal = proposeRoleSurfaceFloorBumps({
        scorecards: [{ key, total: 10, passed: 10, failed: 0, accuracy: measuredAccuracy }],
        floors: { [key]: currentFloor },
      }).find((row) => row.key === key)!;
      expect(proposal.shouldBump).toBe(expectBump);
      expect(proposal.proposedFloor).toBeCloseTo(expectNextFloor, 5);
      expect(proposal.proposedFloor).toBeGreaterThanOrEqual(currentFloor);
    },
  );

  it('applyRoleSurfaceEvalFloorRatchet never lowers committed floors', () => {
    const dir = mkdtempSync(join(tmpdir(), 'parity-43-baseline-'));
    const baselinePath = join(dir, 'baseline.json');
    const baseline = {
      ...loadEvalBaseline(),
      roleSurfaceEvalFloors: {
        'owner:dashboard': 0.996,
        'manager:dashboard': 1,
        'staff:dashboard': 1,
        'staff:provider': 0.981,
        'client:customer': 0.935,
        'client:public': 0.964,
      },
      roleSurfaceEvalFloorHistory: [],
    };
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));

    const status = buildParity43EvalFloorStatus({
      results: summary.results,
      floors: baseline.roleSurfaceEvalFloors,
    });
    const result = applyRoleSurfaceEvalFloorRatchet(
      status,
      baseline.roleSurfaceEvalFloors!,
      baselinePath,
    );

    if (result.applied) {
      const updated = JSON.parse(readFileSync(baselinePath, 'utf8'));
      for (const [key, floor] of Object.entries(
        baseline.roleSurfaceEvalFloors as Record<string, number>,
      )) {
        expect(updated.roleSurfaceEvalFloors[key]).toBeGreaterThanOrEqual(floor);
      }
      expect(updated.roleSurfaceEvalFloorHistory.length).toBeGreaterThan(0);
    }
  });

  it('formats parity-4.3 gate report for npm run report:ai-role-surface-floors', () => {
    const status = buildParity43EvalFloorStatus({ results: summary.results });
    const text = formatParity43GateReport(
      status,
      loadEvalBaseline().roleSurfaceEvalFloors,
    );
    expect(text).toContain('AI Parity Role/Surface Eval Floors (parity-4.3)');
    expect(text).toContain('owner:dashboard');

    if (process.env.ROLE_SURFACE_FLOOR_REPORT === '1') {
      console.log(text);
    }
  });
});
