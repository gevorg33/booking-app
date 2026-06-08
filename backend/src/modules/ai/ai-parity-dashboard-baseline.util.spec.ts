import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  applyParityCoverageBaselineSnapshot,
  computeParityCoverageTrend,
  loadParityCoverageBaseline,
} from './ai-parity-dashboard-baseline.util.js';

describe('ai-parity-dashboard-baseline (parity-4.4)', () => {
  it('loads committed parity coverage baseline', () => {
    const baseline = loadParityCoverageBaseline();
    expect(baseline.lastMinCoverage).toBeGreaterThan(0);
    expect(baseline.lastSnapshotAt).toBeTruthy();
  });

  it('computes trend delta vs last snapshot', () => {
    const trend = computeParityCoverageTrend(1, {
      version: 1,
      updatedAt: '2026-06-08',
      lastMinCoverage: 0.98,
      lastSnapshotAt: '2026-06-07T00:00:00.000Z',
    });
    expect(trend.deltaPercent).toBeCloseTo(0.02, 5);
    expect(trend.previousMinCoverage).toBe(0.98);
  });

  it('applyParityCoverageBaselineSnapshot never lowers lastMinCoverage', () => {
    const dir = mkdtempSync(join(tmpdir(), 'parity-coverage-baseline-'));
    const path = join(dir, 'baseline.json');
    writeFileSync(
      path,
      JSON.stringify(
        {
          version: 1,
          updatedAt: '2026-06-08',
          lastMinCoverage: 0.99,
          lastSnapshotAt: '2026-06-08T00:00:00.000Z',
          history: [],
        },
        null,
        2,
      ),
    );

    const improved = applyParityCoverageBaselineSnapshot(1, path);
    expect(improved.applied).toBe(true);
    expect(improved.baseline.lastMinCoverage).toBe(1);

    const regressed = applyParityCoverageBaselineSnapshot(0.95, path);
    expect(regressed.baseline.lastMinCoverage).toBe(1);
    const saved = JSON.parse(readFileSync(path, 'utf8'));
    expect(saved.lastMinCoverage).toBe(1);
  });
});
