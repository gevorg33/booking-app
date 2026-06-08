export interface AdoptionActivationView {
  installedCount: number;
  activatedCount: number;
  activationRate: number;
  windowDays: number;
}

export function formatActivationRate(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function buildActivationNorthStarSummary(
  activation: AdoptionActivationView,
): {
  rateLabel: string;
  progressLabel: string;
  windowDays: number;
} {
  return {
    rateLabel: formatActivationRate(activation.activationRate),
    progressLabel: `${activation.activatedCount}/${activation.installedCount}`,
    windowDays: activation.windowDays,
  };
}

export function isNorthStarActivationHealthy(
  activation: AdoptionActivationView,
  targetRate = 0.25,
): boolean {
  return activation.activationRate >= targetRate;
}

export function buildQualifiedActivationSummary(
  activation: AdoptionActivationView,
  targetRate = 0.99,
): {
  rateLabel: string;
  progressLabel: string;
  windowDays: number;
  targetLabel: string;
  healthy: boolean;
} {
  const base = buildActivationNorthStarSummary(activation);
  return {
    ...base,
    targetLabel: formatActivationRate(targetRate, 0),
    healthy: activation.activationRate + 1e-9 >= targetRate,
  };
}

export function isQualifiedActivationGateHealthy(
  gate: { met: boolean } | undefined,
): boolean {
  return gate?.met === true;
}

export interface QualifiedLocaleCohortRow {
  locale: string;
  qualifiedRate: number;
  qualifiedProgress: string;
  coldRate: number;
  coldInstalled: number;
  sufficientSample: boolean;
}

export function buildQualifiedLocaleCohortRows(
  cohort: {
    byLocale: Array<{
      locale: string;
      qualified: AdoptionActivationView;
      cold: AdoptionActivationView;
      sufficientSample: boolean;
    }>;
  },
): QualifiedLocaleCohortRow[] {
  return cohort.byLocale.map((entry) => ({
    locale: entry.locale.toUpperCase(),
    qualifiedRate: entry.qualified.activationRate,
    qualifiedProgress: `${entry.qualified.activatedCount}/${entry.qualified.installedCount}`,
    coldRate: entry.cold.activationRate,
    coldInstalled: entry.cold.installedCount,
    sufficientSample: entry.sufficientSample,
  }));
}

export function formatLocaleSpreadPoints(spread: number): string {
  return `${(spread * 100).toFixed(1)} pts`;
}

export function isLocaleSpreadHealthy(
  spread: number,
  maxSpread = 0.03,
): boolean {
  return spread <= maxSpread + 1e-9;
}
