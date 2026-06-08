import type { AiFeatureCatalogEntry } from './ai-feature-catalog.types.js';
import { buildAllowDenyParityExport } from './ai-feature-allow-deny-parity.util.js';
import { buildAiParityCoverageReport } from './ai-feature-parity.util.js';
import {
  computeParityCoverageTrend,
  loadParityCoverageBaseline,
  type ParityCoverageTrend,
} from './ai-parity-dashboard-baseline.util.js';
import {
  buildParityExitGate,
  formatParityExitGateReport,
  type ParityExitGateResult,
} from './ai-parity-exit-gate.util.js';
import { formatCoveragePercent } from './ai-feature-parity.util.js';

export interface ParityDashboardRoleSurfaceRow {
  tier: string;
  surface: string;
  coveragePercent: number | null;
  coveredCount: number;
  uiActionCount: number;
  gapCount: number;
  scopeBugCount: number;
  gaps: readonly string[];
  scopeBugs: readonly string[];
}

export interface ParityDashboardAllowDenyRow {
  kind: 'over_grant' | 'under_grant';
  tier: string;
  surface: string;
  intentId: string;
  featureId: string;
}

export interface ParityDashboardSnapshot {
  generatedAt: string;
  exitGate: ParityExitGateResult;
  byRoleSurface: ParityDashboardRoleSurfaceRow[];
  minCoveragePercent: number;
  openGapCount: number;
  openScopeBugCount: number;
  allowDenyUnderGrantCount: number;
  allowDenyOverGrantCount: number;
  allowDenyDivergences: ParityDashboardAllowDenyRow[];
  extractionMissingCount: number;
  agentTaskPassRate: number;
  trend: ParityCoverageTrend;
  /** @deprecated Use trend.deltaPercent */
  trendDeltaPercent: number | null;
}

/** parity-4.4 — snapshot for AI-ops dashboard widget. */
export function buildParityDashboardSnapshot(
  catalog: readonly AiFeatureCatalogEntry[],
  options?: {
    previousMinCoverage?: number | null;
    parityBaselinePath?: string;
  },
): ParityDashboardSnapshot {
  const report = buildAiParityCoverageReport(catalog);
  const exitGate = buildParityExitGate(catalog);
  const allowDenyExport = buildAllowDenyParityExport(catalog, new Date(exitGate.generatedAt), {
    includeCapabilityOrphans: false,
  });

  const minCoverage = Math.min(
    ...report.byRoleSurface.map((row) => row.coveragePercent ?? 0),
  );
  const parityBaseline = loadParityCoverageBaseline(options?.parityBaselinePath);
  const trend = computeParityCoverageTrend(minCoverage, parityBaseline);
  const trendDeltaPercent =
    options?.previousMinCoverage != null
      ? minCoverage - options.previousMinCoverage
      : trend.deltaPercent;

  const byRoleSurface = report.byRoleSurface.map((row) => ({
    tier: row.tier,
    surface: row.surface,
    coveragePercent: row.coveragePercent,
    coveredCount: row.coveredCount,
    uiActionCount: row.uiActionCount,
    gapCount: row.gapCount,
    scopeBugCount: row.scopeBugCount,
    gaps: row.gaps,
    scopeBugs: row.scopeBugs,
  }));

  return {
    generatedAt: exitGate.generatedAt,
    exitGate,
    byRoleSurface,
    minCoveragePercent: minCoverage,
    openGapCount: byRoleSurface.reduce((sum, row) => sum + row.gapCount, 0),
    openScopeBugCount: byRoleSurface.reduce((sum, row) => sum + row.scopeBugCount, 0),
    allowDenyUnderGrantCount: allowDenyExport.underGrantCount,
    allowDenyOverGrantCount: allowDenyExport.overGrantCount,
    allowDenyDivergences: allowDenyExport.divergences.slice(0, 25).map((row) => ({
      kind: row.kind,
      tier: row.tier,
      surface: row.surface,
      intentId: row.intentId,
      featureId: row.featureId,
    })),
    extractionMissingCount: exitGate.extractionMissingCount,
    agentTaskPassRate: exitGate.agentTaskPassRate,
    trend,
    trendDeltaPercent,
  };
}

export function formatParityDashboardSummary(snapshot: ParityDashboardSnapshot): string {
  const lines = [
    'AI Parity Dashboard (parity-4.4)',
    `Generated: ${snapshot.generatedAt}`,
    `Exit gate: ${snapshot.exitGate.met ? 'PASS' : 'FAIL'}`,
    `Min coverage: ${formatCoveragePercent(snapshot.minCoveragePercent)}`,
    `Open gaps: ${snapshot.openGapCount} · scope bugs: ${snapshot.openScopeBugCount}`,
    `Under-grant divergences: ${snapshot.allowDenyUnderGrantCount}`,
    `Over-grant divergences: ${snapshot.allowDenyOverGrantCount}`,
    `Catalog freshness gaps: ${snapshot.extractionMissingCount}`,
    `Agent tasks: ${formatCoveragePercent(snapshot.agentTaskPassRate)}`,
  ];

  if (snapshot.trend.deltaPercent != null) {
    const sign = snapshot.trend.deltaPercent >= 0 ? '+' : '';
    lines.push(
      `Trend: ${sign}${formatCoveragePercent(snapshot.trend.deltaPercent)} vs ${snapshot.trend.previousSnapshotAt ?? 'baseline'}`,
    );
  }

  lines.push('', 'Per role / surface:');
  for (const row of snapshot.byRoleSurface) {
    lines.push(
      `  ${row.tier.padEnd(7)} ${row.surface.padEnd(9)} ${formatCoveragePercent(row.coveragePercent)} (${row.coveredCount}/${row.uiActionCount}) gaps=${row.gapCount} scope_bugs=${row.scopeBugCount}`,
    );
    if (row.gaps.length > 0) {
      lines.push(`      gaps: ${row.gaps.slice(0, 5).join(', ')}`);
    }
  }

  if (snapshot.allowDenyDivergences.length > 0) {
    lines.push('', 'Allow/deny divergences (sample):');
    for (const row of snapshot.allowDenyDivergences.slice(0, 10)) {
      lines.push(
        `  - [${row.kind}] ${row.tier}/${row.surface} ${row.intentId} ← ${row.featureId}`,
      );
    }
  }

  lines.push('', formatParityExitGateReport(snapshot.exitGate));
  return lines.join('\n');
}
