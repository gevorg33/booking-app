#!/usr/bin/env node
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');

process.chdir(backendRoot);

const {
  buildCommandRegistry,
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
} = require(join(backendRoot, 'dist/modules/ai/ai-command-registry.build.js'));
const { buildAiFeatureCatalog } = require(
  join(backendRoot, 'dist/modules/ai/ai-feature-catalog.js'),
);
const { buildParityDashboardSnapshot } = require(
  join(backendRoot, 'dist/modules/ai/ai-parity-dashboard.util.js'),
);
const { applyParityCoverageBaselineSnapshot } = require(
  join(backendRoot, 'dist/modules/ai/ai-parity-dashboard-baseline.util.js'),
);

const registry = buildCommandRegistry(collectCompoundStepIds(buildCompoundCommandRecipes()));
const catalog = buildAiFeatureCatalog(registry);
const snapshot = buildParityDashboardSnapshot(catalog);

if (!snapshot.exitGate.met) {
  console.error('PARITY COVERAGE RATCHET (parity-4.4): FAIL — exit gate not green');
  process.exit(1);
}

const result = applyParityCoverageBaselineSnapshot(snapshot.minCoveragePercent);
if (result.applied) {
  console.log(
    `PARITY COVERAGE RATCHET (parity-4.4): applied min coverage → ${(result.baseline.lastMinCoverage * 100).toFixed(1)}%`,
  );
} else {
  console.log('PARITY COVERAGE RATCHET (parity-4.4): skipped — no change');
}
