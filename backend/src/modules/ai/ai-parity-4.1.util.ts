import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';
import { assertAllowDenyParityZero } from './ai-feature-allow-deny-parity.util.js';
import { buildAiParityCoverageReport } from './ai-feature-parity.util.js';
import { assertParityGapClosureComplete } from './ai-feature-parity-gap-closure.util.js';

export interface Parity41GateStatus {
  coverageComplete: boolean;
  allowDenyComplete: boolean;
  errors: string[];
}

/** parity-4.1 — fails when a catalog action lacks a mapped intent or allow/deny diverges from access-control.matrix. */
export function assertParity41CiGate(
  catalog: readonly AiFeatureCatalogEntry[],
): Parity41GateStatus {
  const errors: string[] = [];

  const gapStatus = assertParityGapClosureComplete(
    buildAiParityCoverageReport(catalog),
  );
  if (!gapStatus.complete) errors.push(...gapStatus.errors);

  try {
    assertAllowDenyParityZero(catalog, { includeCapabilityOrphans: false });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  if (errors.length > 0) {
    throw new Error(
      [
        'AI parity CI gate failed (parity-4.1) — merge blocked.',
        ...errors.map((line) => `  - ${line}`),
      ].join('\n'),
    );
  }

  return {
    coverageComplete: true,
    allowDenyComplete: true,
    errors: [],
  };
}

export function formatParity41GateReport(status: Parity41GateStatus): string {
  const lines = [
    'AI Feature Parity CI Gate (parity-4.1)',
    `Status: ${status.errors.length === 0 ? 'PASS' : 'FAIL'}`,
    `Coverage gaps closed: ${status.coverageComplete ? 'yes' : 'no'}`,
    `Allow/deny aligned (catalog vs access-control.matrix): ${status.allowDenyComplete ? 'yes' : 'no'}`,
  ];
  if (status.errors.length > 0) {
    lines.push('', 'Failures:');
    for (const error of status.errors) lines.push(`  - ${error}`);
  }
  return lines.join('\n');
}
