#!/usr/bin/env node
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');

process.chdir(backendRoot);

const { AI_COMMAND_EVAL_CLARIFY_FOLLOWUP_CASES } = require(
  join(backendRoot, 'dist/modules/ai/eval/ai-n99-clarify-followup.eval.util.js'),
);
const {
  assertClarifyFollowupEvalGate,
  applyClarifyFollowupFloorRatchet,
  buildClarifyFollowupEvalGateReport,
  formatClarifyFollowupEvalGateReport,
} = require(
  join(backendRoot, 'dist/modules/ai/eval/ai-n99-clarify-followup-gate.util.js'),
);
const { runDeterministicEvalSuite } = require(
  join(backendRoot, 'dist/modules/ai/eval/ai-command-eval.runner.js'),
);
const { loadEvalBaseline } = require(
  join(backendRoot, 'dist/modules/ai/eval/ai-command-eval.report.js'),
);

const baselinePath = join(
  backendRoot,
  'src/modules/ai/eval/ai-command-eval.baseline.json',
);
const baseline = loadEvalBaseline(baselinePath);
const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_CLARIFY_FOLLOWUP_CASES);
const report = buildClarifyFollowupEvalGateReport({
  cases: AI_COMMAND_EVAL_CLARIFY_FOLLOWUP_CASES,
  results: summary.results,
  baseline,
});

console.log(formatClarifyFollowupEvalGateReport(report));
console.log('');

try {
  assertClarifyFollowupEvalGate(report);
  console.log('CLARIFY FOLLOWUP GATE (n99-1.9): PASS');
} catch (error) {
  console.error('CLARIFY FOLLOWUP GATE (n99-1.9): FAIL — merge blocked');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const ratchet = applyClarifyFollowupFloorRatchet(report, baselinePath);
if (ratchet.applied) {
  console.log(
    `CLARIFY FOLLOWUP RATCHET (n99-1.9): applied ${(ratchet.ratchet.currentFloor * 100).toFixed(1)}% → ${(ratchet.ratchet.proposedFloor * 100).toFixed(1)}%`,
  );
} else {
  console.log(`CLARIFY FOLLOWUP RATCHET (n99-1.9): skipped — ${ratchet.ratchet.reason}`);
}
