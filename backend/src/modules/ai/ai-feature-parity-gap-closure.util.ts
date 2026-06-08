import type { AiParityCoverageReport } from './ai-feature-catalog.types.js';
import { PARITY_TIER_SURFACE_PAIRS } from './ai-feature-parity.util.js';
import { formatCoveragePercent } from './ai-feature-parity.util.js';

/** parity-2 — per role/surface coverage floor (100%). */
export const PARITY_GAP_CLOSURE_TARGET = 1;

export interface ParityGapClosureStatus {
  complete: boolean;
  errors: string[];
  byRoleSurface: Array<{
    tier: string;
    surface: string;
    coveragePercent: number | null;
    gapCount: number;
    scopeBugCount: number;
  }>;
}

export function assertParityGapClosureComplete(
  report: AiParityCoverageReport,
  target = PARITY_GAP_CLOSURE_TARGET,
): ParityGapClosureStatus {
  const errors: string[] = [];

  for (const row of report.byRoleSurface) {
    const rate = row.coveragePercent;
    if (rate == null || rate + 1e-9 < target) {
      errors.push(
        `${row.tier}/${row.surface} coverage ${formatCoveragePercent(rate)} below ${formatCoveragePercent(target)} (gaps=${row.gapCount} scope_bugs=${row.scopeBugCount})`,
      );
    }
    if (row.gapCount > 0) {
      errors.push(
        `${row.tier}/${row.surface} has ${row.gapCount} gap(s): ${row.gaps.slice(0, 5).join(', ')}`,
      );
    }
    if (row.scopeBugCount > 0) {
      errors.push(
        `${row.tier}/${row.surface} has ${row.scopeBugCount} scope bug(s): ${row.scopeBugs.slice(0, 5).join(', ')}`,
      );
    }
  }

  const unique = [...new Set(errors)];
  return {
    complete: unique.length === 0,
    errors: unique,
    byRoleSurface: report.byRoleSurface.map((row) => ({
      tier: row.tier,
      surface: row.surface,
      coveragePercent: row.coveragePercent,
      gapCount: row.gapCount,
      scopeBugCount: row.scopeBugCount,
    })),
  };
}

export function formatParityGapClosureReport(status: ParityGapClosureStatus): string {
  const lines = [
    'AI Feature Parity Gap Closure (parity-2)',
    `Target: ${formatCoveragePercent(PARITY_GAP_CLOSURE_TARGET)} per role/surface`,
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    '',
    'Per role / surface:',
  ];
  for (const row of status.byRoleSurface) {
    lines.push(
      `  ${row.tier.padEnd(7)} ${row.surface.padEnd(9)} covered=${formatCoveragePercent(row.coveragePercent)} gaps=${row.gapCount} scope_bugs=${row.scopeBugCount}`,
    );
  }
  if (status.errors.length > 0) {
    lines.push('', 'Issues:');
    for (const error of status.errors) lines.push(`  - ${error}`);
  }
  return lines.join('\n');
}

export { PARITY_TIER_SURFACE_PAIRS };
