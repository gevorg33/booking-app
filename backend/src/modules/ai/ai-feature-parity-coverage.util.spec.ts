import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  AI_PARITY_COVERAGE_ANALYTICS_FIXTURES,
  AI_PARITY_COVERAGE_SCENARIOS,
  AI_PARITY_COVERAGE_TRACE_FIXTURES,
} from './ai-feature-parity-coverage.fixtures.js';
import {
  aggregateAppAnalyticsUsage,
  aggregateTraceIntentUsage,
  buildSprint56GapBacklog,
  countAnalyticsScreenHits,
  countTraceIntentHits,
  mergeUncoveredMaps,
  rankUncoveredActionsForRoleSurface,
  scoreFeatureUsage,
} from './ai-feature-parity-coverage.util.js';
import {
  buildAiParityCoverageReport,
  buildFeatureCoverageCells,
} from './ai-feature-parity.util.js';
import { formatAiParityReport } from './ai-feature-parity.report.js';

describe('ai-feature-parity-coverage (parity-1.5)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);
  const traceUsage = aggregateTraceIntentUsage(AI_PARITY_COVERAGE_TRACE_FIXTURES);
  const analyticsUsage = aggregateAppAnalyticsUsage(AI_PARITY_COVERAGE_ANALYTICS_FIXTURES);

  it('aggregates trace intent usage by surface and action', () => {
    expect(traceUsage.get('dashboard:summarize_day')).toBe(2);
    expect(traceUsage.get('dashboard:summarize_customers')).toBe(1);
    expect(traceUsage.get('customer:book_package')).toBe(1);
  });

  it('aggregates app analytics screen usage by surface bucket', () => {
    expect(analyticsUsage.get('dashboard_web:/dashboard/billing')).toBe(420);
    expect(analyticsUsage.get('consumer_app:/s/*/services')).toBe(1200);
  });

  it('scores usage with trace weighted above analytics', () => {
    expect(scoreFeatureUsage({ traceIntentHits: 2, analyticsScreenHits: 50 })).toBe(70);
  });

  it.each(AI_PARITY_COVERAGE_SCENARIOS)(
    'usage ranking scenario $id',
    ({ featureId, tier, surface, expectUncovered, minUsageScore, minTraceHits }) => {
      const report = buildAiParityCoverageReport(catalog, {
        traceRows: AI_PARITY_COVERAGE_TRACE_FIXTURES,
        analyticsRows: [...AI_PARITY_COVERAGE_ANALYTICS_FIXTURES],
      });
      const row = report.byRoleSurface.find((entry) => entry.tier === tier && entry.surface === surface)!;
      const uncovered = row.uncoveredRanked.find((entry) => entry.featureId === featureId);
      if (expectUncovered) {
        expect(uncovered).toBeDefined();
        if (minUsageScore != null) expect(uncovered!.usageScore).toBeGreaterThanOrEqual(minUsageScore);
        if (minTraceHits != null) expect(uncovered!.traceIntentHits).toBeGreaterThanOrEqual(minTraceHits);
      } else {
        expect(uncovered).toBeUndefined();
      }
    },
  );

  it('builds Sprint 56 backlog ranked by usage with unconfirmed rows', () => {
    const report = buildAiParityCoverageReport(catalog, {
      traceRows: AI_PARITY_COVERAGE_TRACE_FIXTURES,
      analyticsRows: [...AI_PARITY_COVERAGE_ANALYTICS_FIXTURES],
    });
    expect(report.sprint56Backlog.length).toBeGreaterThan(0);
    expect(report.sprint56Backlog[0].usageScore).toBeGreaterThanOrEqual(
      report.sprint56Backlog[report.sprint56Backlog.length - 1].usageScore,
    );
    expect(report.sprint56Backlog.some((row) => row.kind === 'unconfirmed')).toBe(true);
    expect(report.sprint56Backlog.some((row) => row.featureId === 'dashboard.route.calendar')).toBe(true);
  });

  it('ranks uncovered actions per role/surface when usage data is absent', () => {
    const report = buildAiParityCoverageReport(catalog);
    expect(report.usageAvailability.traceRows).toBe(0);
    expect(report.usageAvailability.analyticsRows).toBe(0);
    const ownerDashboard = report.byRoleSurface.find(
      (row) => row.tier === 'owner' && row.surface === 'dashboard',
    )!;
    expect(ownerDashboard.uncoveredRanked.length).toBe(0);
    expect(ownerDashboard.uncoveredRanked.every((row) => row.usageScore === 0)).toBe(true);
  });

  it('formats parity-1.5 coverage report for npm run report:ai-parity', () => {
    const report = buildAiParityCoverageReport(catalog, {
      traceRows: AI_PARITY_COVERAGE_TRACE_FIXTURES,
      analyticsRows: [...AI_PARITY_COVERAGE_ANALYTICS_FIXTURES],
    });
    const text = formatAiParityReport(report);
    expect(text).toContain('AI Feature Parity Coverage Report (parity-1.5)');
    expect(text).toContain('Usage signals:');
    expect(text).toContain('Sprint 56 backlog:');
    if (report.byRoleSurface.some((row) => row.uncoveredRanked.length > 0)) {
      expect(text).toContain('Uncovered (usage-ranked):');
    }

    if (process.env.PARITY_REPORT === '1') {
      console.log(text);
      console.log('');
      console.log(JSON.stringify(report, null, 2));
    }
  });

  it('counts analytics hits for billing nav via uiPath', () => {
    const billing = catalog.find((row) => row.id === 'dashboard.nav.billing')!;
    expect(countAnalyticsScreenHits(billing, analyticsUsage)).toBe(420);
    expect(countTraceIntentHits(billing, traceUsage)).toBe(0);
  });

  it('builds sprint backlog from merged uncovered map', () => {
    const cells = buildFeatureCoverageCells(catalog, 'dashboard', 'owner');
    const uncovered = rankUncoveredActionsForRoleSurface(
      cells,
      catalog,
      traceUsage,
      analyticsUsage,
    );
    const backlog = buildSprint56GapBacklog({
      catalog,
      uncoveredByFeature: mergeUncoveredMaps(uncovered),
      traceUsage,
      analyticsUsage,
    });
    expect(backlog.length).toBeGreaterThan(uncovered.length);
  });
});
