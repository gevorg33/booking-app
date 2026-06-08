#!/usr/bin/env node
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');

process.chdir(backendRoot);

const {
  applyNoClarifyFloorRatchet,
  formatNoClarifyEvalGateReport,
} = require(
  join(backendRoot, 'dist/modules/ai/eval/ai-n99-no-clarify-gate.util.js'),
);
const {
  assertNoClarifyEvalGateRun,
  runNoClarifyEvalGate,
} = require(
  join(backendRoot, 'dist/modules/ai/eval/ai-n99-no-clarify-gate.eval.util.js'),
);

const baselinePath = join(
  backendRoot,
  'src/modules/ai/eval/ai-command-eval.baseline.json',
);

const { report } = runNoClarifyEvalGate({ baselinePath });

console.log(formatNoClarifyEvalGateReport(report));
console.log('');

try {
  assertNoClarifyEvalGateRun({ baselinePath });
  console.log('NO CLARIFY DUAL GATE (n99-2.9): PASS');
  console.log(
    `  no_clarify: ${(report.accuracy * 100).toFixed(2)}% (floor ${(report.floor * 100).toFixed(1)}%)`,
  );
  console.log(
    `  wrong_execution: ${(report.wrongExecutionRate * 100).toFixed(2)}% (ceiling ${(report.wrongExecutionCeiling * 100).toFixed(1)}%)`,
  );
} catch (error) {
  console.error('NO CLARIFY DUAL GATE (n99-2.9): FAIL — merge blocked');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const ratchet = applyNoClarifyFloorRatchet(report, baselinePath);
if (ratchet.applied) {
  console.log(
    `NO CLARIFY RATCHET (n99-2.9): applied ${(ratchet.ratchet.currentFloor * 100).toFixed(1)}% → ${(ratchet.ratchet.proposedFloor * 100).toFixed(1)}%`,
  );
} else {
  console.log(`NO CLARIFY RATCHET (n99-2.9): skipped — ${ratchet.ratchet.reason}`);
}
