import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  buildParityDashboardSnapshot,
  formatParityDashboardSummary,
} from './ai-parity-dashboard.util.js';

describe('ai-parity-dashboard (parity-4.4)', () => {
  const catalog = buildAiFeatureCatalog(
    buildCommandRegistry(collectCompoundStepIds(buildCompoundCommandRecipes())),
  );

  it('builds parity dashboard snapshot with exit gate and role rows', () => {
    const snapshot = buildParityDashboardSnapshot(catalog);
    expect(snapshot.byRoleSurface.length).toBe(6);
    expect(snapshot.exitGate.met).toBe(true);
    expect(snapshot.allowDenyUnderGrantCount).toBe(0);
    expect(snapshot.minCoveragePercent).toBeGreaterThanOrEqual(1);
    expect(snapshot.openGapCount).toBe(0);
    expect(snapshot.trend.currentMinCoverage).toBe(snapshot.minCoveragePercent);
    expect(snapshot.byRoleSurface.every((row) => Array.isArray(row.gaps))).toBe(true);
    expect(snapshot.byRoleSurface.every((row) => Array.isArray(row.scopeBugs))).toBe(true);
  });

  it('reports coverage trend vs parity coverage baseline', () => {
    const dir = mkdtempSync(join(tmpdir(), 'parity-dashboard-baseline-'));
    const baselinePath = join(dir, 'baseline.json');
    writeFileSync(
      baselinePath,
      JSON.stringify(
        {
          version: 1,
          updatedAt: '2026-06-01',
          lastMinCoverage: 0.97,
          lastSnapshotAt: '2026-06-01T00:00:00.000Z',
          history: [],
        },
        null,
        2,
      ),
    );

    const snapshot = buildParityDashboardSnapshot(catalog, { parityBaselinePath: baselinePath });
    expect(snapshot.trend.previousMinCoverage).toBe(0.97);
    expect(snapshot.trend.deltaPercent).toBeCloseTo(snapshot.minCoveragePercent - 0.97, 5);
    expect(snapshot.trendDeltaPercent).toBe(snapshot.trend.deltaPercent);
  });

  it('formats parity dashboard summary for npm run report:ai-parity-dashboard', () => {
    const snapshot = buildParityDashboardSnapshot(catalog);
    const text = formatParityDashboardSummary(snapshot);
    expect(text).toContain('AI Parity Dashboard (parity-4.4)');
    expect(text).toContain('Per role / surface');

    if (process.env.PARITY_DASHBOARD_REPORT === '1') {
      console.log(text);
      console.log('');
      console.log(JSON.stringify(snapshot, null, 2));
    }
  });
});
