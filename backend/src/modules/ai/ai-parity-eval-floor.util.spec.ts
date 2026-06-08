import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';
import { loadEvalBaseline } from './eval/ai-command-eval.report.js';
import { runDeterministicEvalSuite } from './eval/ai-command-eval.runner.js';
import {
  assertRoleSurfaceEvalFloors,
  buildRoleSurfaceEvalScorecards,
  proposeRoleSurfaceFloorBumps,
  roleSurfaceEvalKey,
  ROLE_SURFACE_EVAL_RATCHET_SCENARIOS,
} from './ai-parity-eval-floor.util.js';

describe('ai-parity-eval-floor (parity-4.3)', () => {
  const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_DETERMINISTIC_CASES);

  it('builds role/surface eval scorecards', () => {
    const scorecards = buildRoleSurfaceEvalScorecards(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      summary.results,
    );
    expect(scorecards.length).toBeGreaterThan(0);
    expect(scorecards.some((row) => row.key === roleSurfaceEvalKey('owner', 'dashboard'))).toBe(
      true,
    );
  });

  it.each(ROLE_SURFACE_EVAL_RATCHET_SCENARIOS)(
    'ratchet scenario $id never lowers floor',
    ({ key, currentFloor, measuredAccuracy, expectBump, expectNextFloor }) => {
      const proposal = proposeRoleSurfaceFloorBumps({
        scorecards: [
          { key, total: 12, passed: 12, failed: 0, accuracy: measuredAccuracy },
        ],
        floors: { [key]: currentFloor },
      }).find((row) => row.key === key)!;
      expect(proposal.shouldBump).toBe(expectBump);
      expect(proposal.proposedFloor).toBeCloseTo(expectNextFloor, 5);
      expect(proposal.proposedFloor).toBeGreaterThanOrEqual(currentFloor);
    },
  );

  it('passes role/surface eval floor gate from baseline (parity-4.3)', () => {
    const baseline = loadEvalBaseline();
    const status = assertRoleSurfaceEvalFloors({
      cases: AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      results: summary.results,
      floors: baseline.roleSurfaceEvalFloors ?? {},
      minCasesPerPair: baseline.minCasesPerRoleSurface,
    });
    if (!status.complete) {
      console.log(status.errors.join('\n'));
    }
    expect(status.complete).toBe(true);
  });
});
