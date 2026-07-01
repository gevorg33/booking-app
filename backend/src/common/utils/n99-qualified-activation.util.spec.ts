import {
  N99_LOCALE_COHORT_SCENARIOS,
  N99_QUALIFIED_ACTIVATION_GATE_SCENARIOS,
  N99_QUALIFIED_INSTALL_SCENARIOS,
  buildN99ColdActivationFixtureRows,
  buildN99QualifiedActivationNear99FixtureRows,
} from './n99-qualified-activation.fixtures.js';
import {
  assertN99QualifiedActivationExitGate,
  buildN99QualifiedActivationCohortExport,
  buildN99QualifiedActivationExitGate,
  buildN99QualifiedActivationExitGateFromRows,
  computeColdActivationMetrics,
  computeQualifiedActivationMetrics,
  isColdInstall,
  isIntentQualifiedInstall,
} from './n99-qualified-activation.util.js';
import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';

function toRows(
  fixtures: Array<{
    anonId: string;
    event: AppEventAnalyticsRow['event'];
    platform?: AppEventAnalyticsRow['platform'];
    appSurface?: AppEventAnalyticsRow['appSurface'];
    locale: string;
    tenantSlug?: string;
    createdAt: string;
    props?: Record<string, unknown>;
  }>,
): AppEventAnalyticsRow[] {
  return fixtures.map((row) => ({
    anonId: row.anonId,
    event: row.event,
    platform: row.platform ?? 'ios',
    appSurface: row.appSurface ?? 'consumer_app',
    locale: row.locale,
    tenantSlug: row.tenantSlug ?? null,
    createdAt: new Date(row.createdAt),
    props: row.props ?? null,
  }));
}

describe('n99-qualified-activation.util (n99-3)', () => {
  it.each(N99_QUALIFIED_INSTALL_SCENARIOS)(
    '$id intent-qualified install detection',
    (scenario) => {
      expect(isIntentQualifiedInstall(scenario.install)).toBe(
        scenario.expectQualified,
      );
      expect(isColdInstall(scenario.install)).toBe(!scenario.expectQualified);
    },
  );

  it('computeQualifiedActivationMetrics reaches 99% on near-99 fixture', () => {
    const metrics = computeQualifiedActivationMetrics(
      toRows(buildN99QualifiedActivationNear99FixtureRows()),
    );
    expect(metrics.installedCount).toBe(100);
    expect(metrics.activatedCount).toBe(99);
    expect(metrics.activationRate).toBeCloseTo(0.99, 5);
  });

  it('computeColdActivationMetrics tracks cold installs separately', () => {
    const metrics = computeColdActivationMetrics(
      toRows(buildN99ColdActivationFixtureRows()),
    );
    expect(metrics.installedCount).toBe(10);
    expect(metrics.activatedCount).toBe(2);
    expect(metrics.activationRate).toBeCloseTo(0.2, 5);
  });

  it('buildN99QualifiedActivationCohortExport splits qualified vs cold with locale parity (n99-3.7)', () => {
    const rows = toRows([
      ...buildN99QualifiedActivationNear99FixtureRows(),
      ...buildN99ColdActivationFixtureRows(),
    ]);
    const cohort = buildN99QualifiedActivationCohortExport(rows);

    expect(cohort.qualified.installedCount).toBe(100);
    expect(cohort.qualified.activationRate).toBeCloseTo(0.99, 5);
    expect(cohort.cold.installedCount).toBe(10);
    expect(cohort.cold.activationRate).toBeCloseTo(0.2, 5);
    expect(cohort.byLocale).toHaveLength(3);
    expect(cohort.localeSpread).toBeLessThanOrEqual(0.03);
    expect(cohort.byLocale.every((entry) => entry.locale.length === 2)).toBe(
      true,
    );
  });

  it.each(N99_LOCALE_COHORT_SCENARIOS)(
    '$id locale cohort spread',
    ({ rows, expectMaxSpread, expectInsufficient }) => {
      const cohort = buildN99QualifiedActivationCohortExport(toRows(rows));
      if (expectMaxSpread != null) {
        expect(cohort.localeSpread).toBeLessThanOrEqual(expectMaxSpread);
      }
      if (expectInsufficient) {
        expect(cohort.insufficientLocales).toEqual(expectInsufficient);
      }
    },
  );

  it.each(
    N99_QUALIFIED_ACTIVATION_GATE_SCENARIOS.filter((entry) => entry.rows),
  )('$id exit gate from fixture rows', (scenario) => {
    const gate = buildN99QualifiedActivationExitGateFromRows(
      toRows(scenario.rows),
    );
    expect(gate.met).toBe(scenario.expectMet);
    if ('expectRate' in scenario && scenario.expectRate != null) {
      expect(gate.qualifiedActivationRate).toBeCloseTo(scenario.expectRate, 5);
    }
    if (scenario.expectMet) {
      expect(() => assertN99QualifiedActivationExitGate(gate)).not.toThrow();
    }
  });

  it.each(
    N99_QUALIFIED_ACTIVATION_GATE_SCENARIOS.filter((entry) => entry.input),
  )('$id exit gate synthetic input', (scenario) => {
    const gate = buildN99QualifiedActivationExitGate(scenario.input);
    expect(gate.met).toBe(scenario.expectMet);
  });
});
