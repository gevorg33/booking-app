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
  assertAccuracyFloorGate,
  buildEvalAccuracyReport,
  formatEvalAccuracyReport,
  loadEvalBaseline,
} = require(join(backendRoot, 'dist/modules/ai/eval/ai-command-eval.report.js'));
const { proposeAccuracyFloorBump } = require(
  join(backendRoot, 'dist/modules/ai/ai-accuracy-ratchet.util.js'),
);
const {
  assertRoleSurfaceEvalFloorGate,
  formatRoleSurfaceEvalFloorReport,
  proposeRoleSurfaceFloorBumps,
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

console.log(formatEvalAccuracyReport(report));
console.log('');
console.log(
  JSON.stringify(
    {
      accuracy: report.accuracy,
      accuracyFloor: baseline.accuracyFloor,
      deterministicCases: report.deterministicCases,
      minTotalCases: baseline.minTotalCases,
      llmCases: report.llmCases,
      accuracyDelta: report.accuracyDelta,
      totalCasesDelta: report.totalCasesDelta,
      accuracyDeltaVsLast: report.accuracyDeltaVsLast,
      totalCasesDeltaVsLast: report.totalCasesDeltaVsLast,
      gatePassed: report.gatePassed,
      gateFailures: report.gateFailures,
      intentMetrics: report.intentMetrics,
      byIntent: report.byIntent,
      byCorpus: report.byCorpus,
      byDomain: report.byDomain,
      byRoleSurface: report.byRoleSurface,
    },
    null,
    2,
  ),
);

const deterministicSummary = runDeterministicEvalSuite(
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
);
const roleSurfaceRatchet = proposeRoleSurfaceFloorBumps({
  scorecards: report.byRoleSurface,
  floors: baseline.roleSurfaceEvalFloors ?? {},
});
console.log('');
console.log(
  formatRoleSurfaceEvalFloorReport(
    {
      complete: true,
      errors: [],
      byRoleSurface: report.byRoleSurface,
    },
    {
      floors: baseline.roleSurfaceEvalFloors ?? {},
      ratchet: roleSurfaceRatchet,
    },
  ),
);

try {
  assertAccuracyFloorGate(report);
  assertRoleSurfaceEvalFloorGate({
    cases: AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    results: deterministicSummary.results,
    floors: baseline.roleSurfaceEvalFloors ?? {},
    minCasesPerPair: baseline.minCasesPerRoleSurface,
  });
  const ratchet = proposeAccuracyFloorBump({
    currentFloor: baseline.accuracyFloor,
    measuredAccuracy: report.accuracy,
  });
  const roleSurfaceBumpCount = roleSurfaceRatchet.filter((row) => row.shouldBump).length;
  console.log('\nACCURACY FLOOR GATE (acc-2.9): PASS');
  console.log(
    `RATCHET (acc-6.4): ${ratchet.shouldBump ? `eligible → ${(ratchet.proposedFloor * 100).toFixed(1)}%` : ratchet.reason}`,
  );
  console.log(
    `ROLE/SURFACE RATCHET (parity-4.3): ${roleSurfaceBumpCount > 0 ? `${roleSurfaceBumpCount} pair(s) eligible` : 'no bumps this run'}`,
  );
} catch (error) {
  console.error('\nACCURACY FLOOR GATE (acc-2.9 / parity-4.3): FAIL — merge blocked');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
