import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';
import { AI_UI_FEATURE_CATALOG } from './ai-feature-catalog.fixtures.js';
import { AI_FEATURE_EXTRACTION_SEEDS } from './ai-feature-catalog.extraction-seeds.js';
import { assertParity41CiGate } from './ai-parity-4.1.util.js';
import { assertParity42CiGate } from './ai-parity-4.2.util.js';
import {
  buildParityExitGate,
  formatParityExitGateReport,
  type ParityExitGateResult,
} from './ai-parity-exit-gate.util.js';
import { PARITY_45_EXIT_CRITERIA } from './ai-parity-4.5.fixtures.js';

export { PARITY_45_EXIT_CRITERIA } from './ai-parity-4.5.fixtures.js';

/** parity-4.5 — evaluate all Sprint 58 exit criteria on a catalog snapshot. */
export function buildParity45ExitGate(
  catalog: readonly AiFeatureCatalogEntry[],
): ParityExitGateResult {
  return buildParityExitGate(catalog);
}

/** parity-4.5 — throws when any ship-blocking exit criterion fails. */
export function assertParity45ExitGate(
  catalog: readonly AiFeatureCatalogEntry[],
): ParityExitGateResult {
  const result = buildParityExitGate(catalog);
  if (result.met) return result;

  const lines = [
    'AI parity exit gate failed (parity-4.5) — merge blocked.',
    'Exit criteria: 100% feature→intent coverage, zero allow/deny divergences, agent tasks ≥ 95%, catalog freshness.',
    formatParityExitGateReport(result),
  ];
  throw new Error(lines.join('\n'));
}

/** parity-4.5 — full CI gate: parity-4.1 + 4.2 + exit criteria. */
export function assertParity45CiGate(
  catalog: readonly AiFeatureCatalogEntry[],
): ParityExitGateResult {
  assertParity42CiGate(AI_FEATURE_EXTRACTION_SEEDS, AI_UI_FEATURE_CATALOG);
  assertParity41CiGate(catalog);
  return assertParity45ExitGate(catalog);
}

export function formatParity45ExitGateReport(result: ParityExitGateResult): string {
  const lines = [
    'AI Feature Parity Exit Gate (parity-4.5)',
    `Generated: ${result.generatedAt}`,
    `Status: ${result.met ? 'PASS' : 'FAIL'}`,
    '',
    'Exit criteria:',
  ];

  for (const spec of PARITY_45_EXIT_CRITERIA) {
    const row = result.criteria.find((criterion) => criterion.id === spec.id);
    if (!row) continue;
    lines.push(`  ${row.met ? '✓' : '✗'} ${spec.label}`);
  }

  lines.push('', formatParityExitGateReport(result));
  return lines.join('\n');
}
