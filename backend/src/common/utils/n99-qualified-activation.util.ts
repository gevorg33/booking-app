import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';
import {
  N99_COLD_INSTALL_SOURCES,
  N99_INTENT_QUALIFIED_INSTALL_SOURCES,
  N99_QUALIFIED_ACTIVATION_EVAL_FLOOR,
  N99_QUALIFIED_ACTIVATION_TARGET,
  N99_QUALIFIED_ACTIVATION_WINDOW_DAYS,
  N99_QUALIFIED_LOCALE_SPREAD_MAX,
  N99_QUALIFIED_MIN_PER_LOCALE,
  N99_QUALIFIED_MIN_SAMPLE,
  N99_QUALIFIED_PRIMARY_LOCALES,
} from './n99-qualified-activation.fixtures.js';

export {
  N99_COLD_INSTALL_SOURCES,
  N99_INTENT_QUALIFIED_INSTALL_SOURCES,
  N99_QUALIFIED_ACTIVATION_EVAL_FLOOR,
  N99_QUALIFIED_ACTIVATION_GATE_SCENARIOS,
  N99_QUALIFIED_ACTIVATION_TARGET,
  N99_QUALIFIED_ACTIVATION_WINDOW_DAYS,
  N99_QUALIFIED_INSTALL_SCENARIOS,
  N99_QUALIFIED_LOCALE_SPREAD_MAX,
  N99_QUALIFIED_MIN_PER_LOCALE,
  N99_QUALIFIED_MIN_SAMPLE,
  N99_QUALIFIED_PRIMARY_LOCALES,
  buildN99ColdActivationFixtureRows,
  buildN99QualifiedActivationNear99FixtureRows,
} from './n99-qualified-activation.fixtures.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface QualifiedActivationExport {
  installedCount: number;
  activatedCount: number;
  activationRate: number;
  windowDays: number;
}

export interface N99LocaleCohortMetric {
  locale: string;
  qualified: QualifiedActivationExport;
  cold: QualifiedActivationExport;
  sufficientSample: boolean;
}

export interface N99QualifiedActivationCohortExport {
  qualified: QualifiedActivationExport;
  cold: QualifiedActivationExport;
  localeSpread: number;
  insufficientLocales: string[];
  byLocale: N99LocaleCohortMetric[];
}

export interface N99QualifiedActivationExitGateInput {
  qualifiedActivationRate: number;
  sampleSize: number;
  localeSpread: number;
  insufficientLocales?: string[];
}

export interface N99QualifiedActivationExitGateCriterion {
  id: 'qualified_activation' | 'locale_parity' | 'sample_size';
  label: string;
  value: number;
  target: number;
  comparator: 'gte' | 'lte';
  met: boolean;
  unit: 'percent' | 'points' | 'count';
  detail?: string;
}

export interface N99QualifiedActivationExitGateResult extends N99QualifiedActivationExitGateInput {
  periodDays: number;
  target: number;
  floor: number;
  met: boolean;
  failures: string[];
  criteria: N99QualifiedActivationExitGateCriterion[];
}

function daysBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / DAY_MS;
}

function uniqueAnonIds(rows: AppEventAnalyticsRow[]): string[] {
  return [...new Set(rows.map((row) => row.anonId))];
}

function firstEventAt(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  event: AppEventAnalyticsRow['event'],
): Date | null {
  const matches = rows
    .filter((row) => row.anonId === anonId && row.event === event)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return matches[0]?.createdAt ?? null;
}

function installRowForUser(
  rows: AppEventAnalyticsRow[],
  anonId: string,
): AppEventAnalyticsRow | null {
  return (
    rows.find(
      (row) => row.anonId === anonId && row.event === 'app_installed',
    ) ?? null
  );
}

/** n99-3 / adopt-2.4 — deferred deep link or salon+service intent qualifies the install. */
export function isIntentQualifiedInstall(input: {
  tenantSlug?: string | null;
  props?: Record<string, unknown> | null;
}): boolean {
  if (input.props?.intentQualified === true) return true;

  const slug = (input.tenantSlug ?? input.props?.tenantSlug)?.toString().trim();
  if (!slug) return false;

  const serviceId = input.props?.serviceId?.toString().trim();
  if (serviceId) return true;

  const source = input.props?.installSource?.toString().trim().toLowerCase();
  if (source && N99_INTENT_QUALIFIED_INSTALL_SOURCES.has(source)) return true;

  return false;
}

export function isColdInstall(input: {
  tenantSlug?: string | null;
  props?: Record<string, unknown> | null;
}): boolean {
  return !isIntentQualifiedInstall(input);
}

/** n99-3 — first completed booking within 7d; sign-in not required (guest path). */
export function isQualifiedActivatedUser(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  windowDays = N99_QUALIFIED_ACTIVATION_WINDOW_DAYS,
): boolean {
  const install = installRowForUser(rows, anonId);
  if (!install || !isIntentQualifiedInstall(install)) return false;

  const installedAt = install.createdAt;
  const bookedAt = firstEventAt(rows, anonId, 'completed_booking');
  if (!bookedAt) return false;

  return daysBetween(installedAt, bookedAt) <= windowDays;
}

export function isColdActivatedUser(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  windowDays = N99_QUALIFIED_ACTIVATION_WINDOW_DAYS,
): boolean {
  const install = installRowForUser(rows, anonId);
  if (!install || !isColdInstall(install)) return false;

  const installedAt = install.createdAt;
  const signedInAt = firstEventAt(rows, anonId, 'signed_in');
  const bookedAt = firstEventAt(rows, anonId, 'completed_booking');
  if (!signedInAt || !bookedAt) return false;

  return (
    daysBetween(installedAt, signedInAt) <= windowDays &&
    daysBetween(installedAt, bookedAt) <= windowDays
  );
}

export function computeQualifiedActivationMetrics(
  rows: AppEventAnalyticsRow[],
  windowDays = N99_QUALIFIED_ACTIVATION_WINDOW_DAYS,
): QualifiedActivationExport {
  const qualifiedInstalls = uniqueAnonIds(
    rows.filter(
      (row) => row.event === 'app_installed' && isIntentQualifiedInstall(row),
    ),
  );
  let activatedCount = 0;
  for (const anonId of qualifiedInstalls) {
    if (isQualifiedActivatedUser(rows, anonId, windowDays)) activatedCount += 1;
  }

  const installedCount = qualifiedInstalls.length;
  return {
    installedCount,
    activatedCount,
    activationRate: installedCount === 0 ? 0 : activatedCount / installedCount,
    windowDays,
  };
}

export function computeColdActivationMetrics(
  rows: AppEventAnalyticsRow[],
  windowDays = N99_QUALIFIED_ACTIVATION_WINDOW_DAYS,
): QualifiedActivationExport {
  const coldInstalls = uniqueAnonIds(
    rows.filter((row) => row.event === 'app_installed' && isColdInstall(row)),
  );
  let activatedCount = 0;
  for (const anonId of coldInstalls) {
    if (isColdActivatedUser(rows, anonId, windowDays)) activatedCount += 1;
  }

  const installedCount = coldInstalls.length;
  return {
    installedCount,
    activatedCount,
    activationRate: installedCount === 0 ? 0 : activatedCount / installedCount,
    windowDays,
  };
}

export function computeQualifiedActivationLocaleSpread(
  rows: AppEventAnalyticsRow[],
  minPerLocale = N99_QUALIFIED_MIN_PER_LOCALE,
): { localeSpread: number; insufficientLocales: string[] } {
  const insufficientLocales: string[] = [];
  const rates: number[] = [];

  for (const locale of N99_QUALIFIED_PRIMARY_LOCALES) {
    const localeRows = rows.filter((row) => row.locale === locale);
    const metrics = computeQualifiedActivationMetrics(localeRows);
    if (metrics.installedCount < minPerLocale) {
      insufficientLocales.push(locale);
      continue;
    }
    rates.push(metrics.activationRate);
  }

  const localeSpread =
    rates.length < 2 ? 0 : Math.max(...rates) - Math.min(...rates);

  return { localeSpread, insufficientLocales };
}

export function buildN99QualifiedActivationCohortExport(
  rows: AppEventAnalyticsRow[],
  windowDays = N99_QUALIFIED_ACTIVATION_WINDOW_DAYS,
): N99QualifiedActivationCohortExport {
  const { localeSpread, insufficientLocales } =
    computeQualifiedActivationLocaleSpread(rows);
  const byLocale = N99_QUALIFIED_PRIMARY_LOCALES.map((locale) => {
    const localeRows = rows.filter((row) => row.locale === locale);
    const qualified = computeQualifiedActivationMetrics(localeRows, windowDays);
    return {
      locale,
      qualified,
      cold: computeColdActivationMetrics(localeRows, windowDays),
      sufficientSample:
        qualified.installedCount >= N99_QUALIFIED_MIN_PER_LOCALE,
    };
  });

  return {
    qualified: computeQualifiedActivationMetrics(rows, windowDays),
    cold: computeColdActivationMetrics(rows, windowDays),
    localeSpread,
    insufficientLocales,
    byLocale,
  };
}

export function buildN99QualifiedActivationExitGate(
  input: N99QualifiedActivationExitGateInput,
  periodDays = N99_QUALIFIED_ACTIVATION_WINDOW_DAYS,
): N99QualifiedActivationExitGateResult {
  const failures: string[] = [];
  const criteria: N99QualifiedActivationExitGateCriterion[] = [
    {
      id: 'qualified_activation',
      label: 'Intent-qualified install → activation (7d)',
      value: input.qualifiedActivationRate,
      target: N99_QUALIFIED_ACTIVATION_EVAL_FLOOR,
      comparator: 'gte',
      met:
        input.qualifiedActivationRate + 1e-9 >=
        N99_QUALIFIED_ACTIVATION_EVAL_FLOOR,
      unit: 'percent',
      detail: `target ${(N99_QUALIFIED_ACTIVATION_TARGET * 100).toFixed(0)}%`,
    },
    {
      id: 'locale_parity',
      label: 'Qualified activation locale spread (EN/HY/RU)',
      value: input.localeSpread,
      target: N99_QUALIFIED_LOCALE_SPREAD_MAX,
      comparator: 'lte',
      met: input.localeSpread <= N99_QUALIFIED_LOCALE_SPREAD_MAX + 1e-9,
      unit: 'points',
    },
    {
      id: 'sample_size',
      label: 'Qualified install sample',
      value: input.sampleSize,
      target: N99_QUALIFIED_MIN_SAMPLE,
      comparator: 'gte',
      met: input.sampleSize >= N99_QUALIFIED_MIN_SAMPLE,
      unit: 'count',
    },
  ];

  for (const criterion of criteria) {
    if (!criterion.met) failures.push(`${criterion.label} not met`);
  }
  if (input.insufficientLocales?.length) {
    failures.push(
      `insufficient qualified installs for locales: ${input.insufficientLocales.join(', ')}`,
    );
  }

  return {
    ...input,
    periodDays,
    target: N99_QUALIFIED_ACTIVATION_TARGET,
    floor: N99_QUALIFIED_ACTIVATION_EVAL_FLOOR,
    met: failures.length === 0,
    failures,
    criteria,
  };
}

export function buildN99QualifiedActivationExitGateFromRows(
  rows: AppEventAnalyticsRow[],
  periodDays = N99_QUALIFIED_ACTIVATION_WINDOW_DAYS,
): N99QualifiedActivationExitGateResult {
  const metrics = computeQualifiedActivationMetrics(rows, periodDays);
  const { localeSpread, insufficientLocales } =
    computeQualifiedActivationLocaleSpread(rows);

  return buildN99QualifiedActivationExitGate(
    {
      qualifiedActivationRate: metrics.activationRate,
      sampleSize: metrics.installedCount,
      localeSpread,
      insufficientLocales,
    },
    periodDays,
  );
}

export function assertN99QualifiedActivationExitGate(
  gate: N99QualifiedActivationExitGateResult,
): void {
  if (gate.met) return;
  throw new Error(
    `n99-3 — qualified activation exit gate failed:\n${gate.failures.map((line) => `  - ${line}`).join('\n')}`,
  );
}

export function formatN99QualifiedActivationExitGate(
  gate: N99QualifiedActivationExitGateResult,
): string {
  return [
    `qualified activation: ${(gate.qualifiedActivationRate * 100).toFixed(2)}% (${gate.sampleSize} installs)`,
    `floor: ${(gate.floor * 100).toFixed(0)}% → target ${(gate.target * 100).toFixed(0)}%`,
    `locale spread: ${(gate.localeSpread * 100).toFixed(1)} pts (max ${(N99_QUALIFIED_LOCALE_SPREAD_MAX * 100).toFixed(0)} pts)`,
    `gate: ${gate.met ? 'PASS' : 'FAIL'}`,
  ].join('\n');
}
