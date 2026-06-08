import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const DEFAULT_PARITY_COVERAGE_BASELINE_PATH = join(
  process.cwd(),
  'src/modules/ai/eval/parity-coverage.baseline.json',
);

export interface ParityCoverageBaseline {
  version: number;
  updatedAt: string;
  lastMinCoverage: number;
  lastSnapshotAt: string;
  history?: Array<{ at: string; minCoverage: number }>;
  note?: string;
}

export interface ParityCoverageTrend {
  currentMinCoverage: number;
  previousMinCoverage: number | null;
  deltaPercent: number | null;
  previousSnapshotAt: string | null;
}

export function loadParityCoverageBaseline(
  baselinePath = DEFAULT_PARITY_COVERAGE_BASELINE_PATH,
): ParityCoverageBaseline {
  return JSON.parse(readFileSync(baselinePath, 'utf8')) as ParityCoverageBaseline;
}

export function writeParityCoverageBaseline(
  baseline: ParityCoverageBaseline,
  baselinePath = DEFAULT_PARITY_COVERAGE_BASELINE_PATH,
): void {
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
}

/** parity-4.4 — compare current min role/surface coverage to last committed snapshot. */
export function computeParityCoverageTrend(
  currentMinCoverage: number,
  baseline?: ParityCoverageBaseline,
): ParityCoverageTrend {
  const previous = baseline?.lastMinCoverage ?? null;
  return {
    currentMinCoverage,
    previousMinCoverage: previous,
    deltaPercent:
      previous == null ? null : currentMinCoverage - previous,
    previousSnapshotAt: baseline?.lastSnapshotAt ?? null,
  };
}

/** parity-4.4 — record a green parity snapshot for dashboard trend (never lowers). */
export function applyParityCoverageBaselineSnapshot(
  currentMinCoverage: number,
  baselinePath = DEFAULT_PARITY_COVERAGE_BASELINE_PATH,
): { applied: boolean; baseline: ParityCoverageBaseline } {
  const baseline = loadParityCoverageBaseline(baselinePath);
  const nextMin = Math.max(baseline.lastMinCoverage, currentMinCoverage);
  const now = new Date().toISOString();

  if (
    Math.abs(nextMin - baseline.lastMinCoverage) < 1e-9 &&
    Math.abs(currentMinCoverage - baseline.lastMinCoverage) < 1e-9
  ) {
    return { applied: false, baseline };
  }

  const nextBaseline: ParityCoverageBaseline = {
    ...baseline,
    updatedAt: now.slice(0, 10),
    lastMinCoverage: nextMin,
    lastSnapshotAt: now,
    history: [
      ...(baseline.history ?? []),
      { at: now, minCoverage: currentMinCoverage },
    ].slice(-24),
  };

  writeParityCoverageBaseline(nextBaseline, baselinePath);
  return { applied: true, baseline: nextBaseline };
}
