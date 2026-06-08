import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type { AiEvalCaseResult } from './eval/ai-command-eval.types.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';
import { loadEvalBaseline } from './eval/ai-command-eval.report.js';
import { runDeterministicEvalSuite } from './eval/ai-command-eval.runner.js';
import {
  assertRoleSurfaceEvalFloorGate,
  assertRoleSurfaceEvalFloors,
  applyRoleSurfaceEvalFloorRatchet,
  buildRoleSurfaceEvalScorecards,
  formatRoleSurfaceEvalFloorReport,
  proposeRoleSurfaceFloorBumps,
  type RoleSurfaceEvalFloorStatus,
} from './ai-parity-eval-floor.util.js';

export interface Parity43GateInput {
  cases?: AiCommandEvalCase[];
  results?: AiEvalCaseResult[];
  floors?: Record<string, number>;
  minCasesPerPair?: number;
}

/** parity-4.3 — per role/surface deterministic eval accuracy must meet committed floors. */
export function buildParity43EvalFloorStatus(
  input: Parity43GateInput = {},
): RoleSurfaceEvalFloorStatus {
  const baseline = loadEvalBaseline();
  const cases = input.cases ?? AI_COMMAND_EVAL_DETERMINISTIC_CASES;
  const results =
    input.results ?? runDeterministicEvalSuite(cases).results;

  return assertRoleSurfaceEvalFloors({
    cases,
    results,
    floors: input.floors ?? baseline.roleSurfaceEvalFloors ?? {},
    minCasesPerPair: input.minCasesPerPair ?? baseline.minCasesPerRoleSurface,
  });
}

export function assertParity43CiGate(input: Parity43GateInput = {}): RoleSurfaceEvalFloorStatus {
  const baseline = loadEvalBaseline();
  const cases = input.cases ?? AI_COMMAND_EVAL_DETERMINISTIC_CASES;
  const results =
    input.results ?? runDeterministicEvalSuite(cases).results;

  return assertRoleSurfaceEvalFloorGate({
    cases,
    results,
    floors: input.floors ?? baseline.roleSurfaceEvalFloors ?? {},
    minCasesPerPair: input.minCasesPerPair ?? baseline.minCasesPerRoleSurface,
  });
}

export function formatParity43GateReport(
  status: RoleSurfaceEvalFloorStatus,
  floors?: Record<string, number>,
): string {
  const ratchet = proposeRoleSurfaceFloorBumps({
    scorecards: status.byRoleSurface,
    floors: floors ?? loadEvalBaseline().roleSurfaceEvalFloors ?? {},
  });
  return formatRoleSurfaceEvalFloorReport(status, { floors, ratchet });
}

export {
  applyRoleSurfaceEvalFloorRatchet,
  buildRoleSurfaceEvalScorecards,
  proposeRoleSurfaceFloorBumps,
};
