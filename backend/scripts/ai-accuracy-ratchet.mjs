#!/usr/bin/env node
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');

process.chdir(backendRoot);

const {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_LLM_CASES,
} = require(join(backendRoot, 'dist/modules/ai/eval/ai-command-eval.cases.js'));
const {
  applyAccuracyFloorRatchet,
  assertAccuracyFloorGate,
  buildEvalAccuracyReport,
  loadEvalBaseline,
} = require(join(backendRoot, 'dist/modules/ai/eval/ai-command-eval.report.js'));
const {
  applyRoleSurfaceEvalFloorRatchet,
  assertRoleSurfaceEvalFloors,
} = require(join(backendRoot, 'dist/modules/ai/ai-parity-eval-floor.util.js'));
const { runDeterministicEvalSuite } = require(
  join(backendRoot, 'dist/modules/ai/eval/ai-command-eval.runner.js'),
);

const baselinePath = join(
  backendRoot,
  'src/modules/ai/eval/ai-command-eval.baseline.json',
);
const baseline = loadEvalBaseline(baselinePath);
const report = buildEvalAccuracyReport(
  [...AI_COMMAND_EVAL_DETERMINISTIC_CASES, ...AI_COMMAND_EVAL_LLM_CASES],
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  baseline,
);

try {
  assertAccuracyFloorGate(report);
} catch (error) {
  console.error('ACCURACY FLOOR GATE (acc-2.9): FAIL — ratchet blocked');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const result = applyAccuracyFloorRatchet(report, baselinePath);
if (result.applied) {
  console.log(
    `ACCURACY RATCHET (acc-6.4): applied ${(result.ratchet.currentFloor * 100).toFixed(1)}% → ${(result.ratchet.proposedFloor * 100).toFixed(1)}%`,
  );
} else {
  console.log(`ACCURACY RATCHET (acc-6.4): skipped — ${result.ratchet.reason}`);
}

const roleSurfaceStatus = assertRoleSurfaceEvalFloors({
  cases: AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  results: runDeterministicEvalSuite(AI_COMMAND_EVAL_DETERMINISTIC_CASES).results,
  floors: baseline.roleSurfaceEvalFloors ?? {},
  minCasesPerPair: baseline.minCasesPerRoleSurface,
});
const roleSurfaceResult = applyRoleSurfaceEvalFloorRatchet(
  roleSurfaceStatus,
  baseline.roleSurfaceEvalFloors ?? {},
  baselinePath,
);
const roleSurfaceApplied = roleSurfaceResult.bumps.filter((row) => row.shouldBump);
if (roleSurfaceResult.applied) {
  console.log(
    `ROLE/SURFACE RATCHET (parity-4.3): applied ${roleSurfaceApplied.length} floor bump(s)`,
  );
  for (const bump of roleSurfaceApplied.slice(0, 6)) {
    console.log(
      `  ${bump.key}: ${(bump.currentFloor * 100).toFixed(1)}% → ${(bump.proposedFloor * 100).toFixed(1)}%`,
    );
  }
} else {
  console.log('ROLE/SURFACE RATCHET (parity-4.3): skipped — no eligible bumps');
}
