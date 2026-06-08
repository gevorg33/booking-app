#!/usr/bin/env node
/** parity-4.5 — enforced CI exit gate (coverage, allow/deny, agent tasks, freshness). */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

process.chdir(backendRoot);

const {
  buildCommandRegistry,
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
} = require(join(backendRoot, 'dist/modules/ai/ai-command-registry.build.js'));
const { buildAiFeatureCatalog } = require(
  join(backendRoot, 'dist/modules/ai/ai-feature-catalog.js'),
);
const {
  assertParity45CiGate,
  formatParity45ExitGateReport,
} = require(join(backendRoot, 'dist/modules/ai/ai-parity-4.5.util.js'));

const registry = buildCommandRegistry(collectCompoundStepIds(buildCompoundCommandRecipes()));
const catalog = buildAiFeatureCatalog(registry);

try {
  const result = assertParity45CiGate(catalog);
  console.log(formatParity45ExitGateReport(result));
  console.log('\nPARITY EXIT GATE (parity-4.5): PASS');
} catch (error) {
  console.error('\nPARITY EXIT GATE (parity-4.5): FAIL — merge blocked');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
