import { createHash } from 'crypto';
import type {
  AppAdoptionEventName,
  AppAdoptionPlatform,
  AppAdoptionSurface,
  AppAdoptionStartType,
  AppAdoptionUserType,
} from '../../modules/analytics/entities/app-event.entity.js';
import {
  ACTIVATION_WEEKLY_ALERT_DELTA,
  ACTIVATION_WINDOW_DAYS,
  APP_ADOPTION_EVENTS,
  APP_ADOPTION_FUNNEL_STEPS,
  APP_ACTIVATION_ONBOARDING_FUNNEL_STEPS,
  APP_ADOPTION_PLATFORMS,
  APP_ADOPTION_SURFACES,
  APP_EVENT_PROP_ALLOWLIST,
  APP_EVENT_RATE_LIMIT_MAX,
  APP_EVENT_RATE_LIMIT_WINDOW_MS,
} from './app-adoption-analytics.fixtures.js';
import { meetsCrashFreeSessionSlo } from './crash-free-slo.util.js';
import { meetsStartupTtiWithinBudgetSlo } from './startup-tti-slo.util.js';
import {
  buildWeeklyStartupTtiRegressionAlert,
  computeStartupTtiWithinBudgetRate as computeStartupTtiRate,
  STARTUP_TTI_WEEKLY_REGRESSION_DELTA,
} from './startup-tti-regression.util.js';
import {
  buildAdoptionExitGate,
  computeLocaleActivationSpread,
  type AdoptionExitGateResult,
} from './adoption-exit-gate.util.js';
import {
  buildN99QualifiedActivationExitGateFromRows,
  buildN99QualifiedActivationCohortExport,
  computeColdActivationMetrics,
  computeQualifiedActivationMetrics,
  type N99QualifiedActivationCohortExport,
  type N99QualifiedActivationExitGateResult,
  type QualifiedActivationExport,
} from './n99-qualified-activation.util.js';
import {
  auditQualifiedInstallDeadEnds,
  type N99QualifiedInstallDeadEndAudit,
  type N99QualifiedInstallFunnelExport,
} from './n99-qualified-install-funnel.util.js';
import {
  buildActivationPathAbExport,
  type ActivationPathAbExport,
} from './n99-activation-path-ab.util.js';
import {
  buildPushReachabilityDashboardExport,
  type PushReachabilityDashboardExport,
} from './n99-push-reachability.util.js';

export {
  APP_ADOPTION_EVENTS,
  APP_ADOPTION_FUNNEL_STEPS,
  APP_ACTIVATION_ONBOARDING_FUNNEL_STEPS,
  APP_ADOPTION_PLATFORMS,
  APP_ADOPTION_SURFACES,
  ACTIVATION_WINDOW_DAYS,
  ACTIVATION_WEEKLY_ALERT_DELTA,
  APP_EVENT_RATE_LIMIT_MAX,
  APP_EVENT_RATE_LIMIT_WINDOW_MS,
} from './app-adoption-analytics.fixtures.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const PII_PROP_KEYS = new Set([
  'email',
  'phone',
  'name',
  'firstName',
  'lastName',
  'customerName',
  'address',
]);

export interface AppEventAnalyticsRow {
  anonId: string;
  event: AppAdoptionEventName;
  platform: AppAdoptionPlatform;
  appSurface: AppAdoptionSurface;
  locale: string;
  tenantSlug: string | null;
  createdAt: Date;
  props: Record<string, unknown> | null;
}

export interface AppEventIngestInput {
  event: string;
  anonId: string;
  platform: string;
  appSurface: string;
  appVersion?: string;
  locale?: string;
  tenantSlug?: string;
  sessionId?: string;
  startType?: string;
  userType?: string;
  props?: Record<string, unknown>;
}

export interface AppEventRecordPayload {
  businessId: string;
  anonId: string;
  event: AppAdoptionEventName;
  platform: AppAdoptionPlatform;
  appSurface: AppAdoptionSurface;
  appVersion: string | null;
  locale: string;
  tenantSlug: string | null;
  sessionId: string | null;
  startType: AppAdoptionStartType | null;
  userType: AppAdoptionUserType | null;
  props: Record<string, unknown> | null;
}

export interface AdoptionFunnelStep {
  step: AppAdoptionEventName;
  count: number;
  conversionFromPrevious: number | null;
  dropOffFromPrevious: number | null;
}

export interface AdoptionFunnelBreakdown {
  dimension: 'platform' | 'locale' | 'tenantSlug';
  value: string;
  steps: AdoptionFunnelStep[];
}

export interface AdoptionFunnelExport {
  steps: AdoptionFunnelStep[];
  breakdowns: AdoptionFunnelBreakdown[];
}

export interface RetentionCohortExport {
  cohortSize: number;
  d1ReturnRate: number;
  d7ReturnRate: number;
  d30ReturnRate: number;
  rebookWithin30DaysRate: number;
  rebookWithin60DaysRate: number;
  rebookWithin90DaysRate: number;
  resurrectionRate: number;
}

export interface ActivationExport {
  installedCount: number;
  activatedCount: number;
  activationRate: number;
  windowDays: number;
}

export interface AdoptionHeadlineMetrics {
  pushOptInRate: number | null;
  crashFreeSessionRate: number | null;
  crashFreeSessionSloMet: boolean | null;
  startupTtiWithinBudgetRate: number | null;
  startupTtiSloMet: boolean | null;
  referralKFactor: number | null;
}

export interface AdoptionWeeklyActivationAlert {
  triggered: boolean;
  currentWeekRate: number;
  previousWeekRate: number;
  deltaPoints: number;
  thresholdPoints: number;
}

export interface BookingAbandonmentRecoveryExport {
  abandonedUsers: number;
  resumedUsers: number;
  recoveryRate: number | null;
}

export interface OnboardingVariantActivationExport {
  variant: 'control' | 'guided';
  startedCount: number;
  completedCount: number;
  activationRate: number | null;
}

export interface AdoptionDashboardExport {
  periodDays: number;
  funnel: AdoptionFunnelExport;
  activationOnboarding: AdoptionFunnelExport;
  bookingAbandonment: BookingAbandonmentRecoveryExport;
  onboardingVariants: OnboardingVariantActivationExport[];
  retention: RetentionCohortExport;
  activation: ActivationExport;
  qualifiedActivation: QualifiedActivationExport;
  coldActivation: QualifiedActivationExport;
  qualifiedActivationCohort: N99QualifiedActivationCohortExport;
  n99QualifiedExitGate: N99QualifiedActivationExitGateResult;
  qualifiedInstallFunnel: N99QualifiedInstallFunnelExport;
  qualifiedInstallDeadEndAudit: N99QualifiedInstallDeadEndAudit;
  activationPathAb: ActivationPathAbExport;
  pushReachability: PushReachabilityDashboardExport;
  headlines: AdoptionHeadlineMetrics;
  weeklyActivationAlert: AdoptionWeeklyActivationAlert;
  weeklyStartupTtiRegressionAlert: ReturnType<
    typeof buildWeeklyStartupTtiRegressionAlert
  >;
  exitGate: AdoptionExitGateResult;
}

export function resolveAppAdoptionEvent(
  event: string,
): AppAdoptionEventName | null {
  return (APP_ADOPTION_EVENTS as readonly string[]).includes(event)
    ? (event as AppAdoptionEventName)
    : null;
}

export function resolveAppAdoptionPlatform(
  platform: string,
): AppAdoptionPlatform | null {
  return (APP_ADOPTION_PLATFORMS as readonly string[]).includes(platform)
    ? (platform as AppAdoptionPlatform)
    : null;
}

export function resolveAppAdoptionSurface(
  surface: string,
): AppAdoptionSurface | null {
  return (APP_ADOPTION_SURFACES as readonly string[]).includes(surface)
    ? (surface as AppAdoptionSurface)
    : null;
}

export function resolveAppAdoptionStartType(
  value: string | undefined,
): AppAdoptionStartType | null {
  if (value === 'cold' || value === 'warm') return value;
  return null;
}

export function resolveAppAdoptionUserType(
  value: string | undefined,
): AppAdoptionUserType | null {
  if (value === 'first_open' || value === 'returning') return value;
  return null;
}

export function normalizeAnonId(anonId: string): string | null {
  const trimmed = anonId.trim();
  if (!trimmed || trimmed.length > 64) return null;
  if (/[@+]/.test(trimmed)) return null;
  return trimmed;
}

export function redactAppEventProps(
  props: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!props || typeof props !== 'object') return null;
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (PII_PROP_KEYS.has(key)) continue;
    if (!APP_EVENT_PROP_ALLOWLIST.has(key)) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.length > 128) continue;
      if (/@/.test(trimmed) || /^\+?\d{7,}$/.test(trimmed)) continue;
      redacted[key] = trimmed;
      continue;
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      redacted[key] = value;
    }
  }
  return Object.keys(redacted).length > 0 ? redacted : null;
}

export function buildAppEventRecordPayload(
  businessId: string,
  input: AppEventIngestInput,
): AppEventRecordPayload | null {
  const event = resolveAppAdoptionEvent(input.event);
  const platform = resolveAppAdoptionPlatform(input.platform);
  const appSurface = resolveAppAdoptionSurface(input.appSurface);
  const anonId = normalizeAnonId(input.anonId);
  if (!event || !platform || !appSurface || !anonId) return null;

  const locale = (input.locale?.trim() || 'en').slice(0, 16);
  const tenantSlug = input.tenantSlug?.trim().slice(0, 128) || null;
  const appVersion = input.appVersion?.trim().slice(0, 32) || null;
  const sessionId = input.sessionId?.trim().slice(0, 64) || null;

  return {
    businessId,
    anonId,
    event,
    platform,
    appSurface,
    appVersion,
    locale,
    tenantSlug,
    sessionId,
    startType: resolveAppAdoptionStartType(input.startType ?? undefined),
    userType: resolveAppAdoptionUserType(input.userType ?? undefined),
    props: redactAppEventProps(input.props),
  };
}

export function hashAnonIdSeed(seed: string): string {
  return createHash('sha256').update(seed).digest('hex').slice(0, 32);
}

export interface RateLimitState {
  count: number;
  windowStartedAtMs: number;
}

export function shouldRateLimitAppEvents(
  state: RateLimitState | undefined,
  nowMs: number,
  increment = 1,
): { limited: boolean; next: RateLimitState } {
  const windowStartedAtMs =
    state && nowMs - state.windowStartedAtMs < APP_EVENT_RATE_LIMIT_WINDOW_MS
      ? state.windowStartedAtMs
      : nowMs;
  const count =
    state && nowMs - state.windowStartedAtMs < APP_EVENT_RATE_LIMIT_WINDOW_MS
      ? state.count + increment
      : increment;
  return {
    limited: count > APP_EVENT_RATE_LIMIT_MAX,
    next: { count, windowStartedAtMs },
  };
}

function firstEventAt(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  event: AppAdoptionEventName,
): Date | null {
  let earliest: Date | null = null;
  for (const row of rows) {
    if (row.anonId !== anonId || row.event !== event) continue;
    if (!earliest || row.createdAt < earliest) earliest = row.createdAt;
  }
  return earliest;
}

function reachedStrictFunnelStep(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  stepIndex: number,
  steps: readonly AppAdoptionEventName[] = APP_ADOPTION_FUNNEL_STEPS,
): boolean {
  for (let i = 0; i <= stepIndex; i += 1) {
    const step = steps[i];
    if (!firstEventAt(rows, anonId, step)) return false;
  }
  return true;
}

function countStrictFunnelStep(
  rows: AppEventAnalyticsRow[],
  anonIds: string[],
  stepIndex: number,
  steps: readonly AppAdoptionEventName[] = APP_ADOPTION_FUNNEL_STEPS,
): number {
  let count = 0;
  for (const anonId of anonIds) {
    if (reachedStrictFunnelStep(rows, anonId, stepIndex, steps)) count += 1;
  }
  return count;
}

function uniqueAnonIds(rows: AppEventAnalyticsRow[]): string[] {
  return [...new Set(rows.map((row) => row.anonId))];
}

function buildFunnelStepsForRows(
  rows: AppEventAnalyticsRow[],
  steps: readonly AppAdoptionEventName[] = APP_ADOPTION_FUNNEL_STEPS,
): AdoptionFunnelStep[] {
  const anonIds = uniqueAnonIds(rows);
  const funnelSteps: AdoptionFunnelStep[] = [];
  let previousCount = 0;

  for (let index = 0; index < steps.length; index += 1) {
    const count = countStrictFunnelStep(rows, anonIds, index, steps);
    const conversionFromPrevious =
      index === 0 || previousCount === 0
        ? index === 0
          ? 1
          : null
        : count / previousCount;
    const dropOffFromPrevious =
      index === 0 || previousCount === 0
        ? null
        : (previousCount - count) / previousCount;

    funnelSteps.push({
      step: steps[index],
      count,
      conversionFromPrevious,
      dropOffFromPrevious,
    });
    previousCount = count;
  }

  return funnelSteps;
}

function buildBreakdownValues(
  rows: AppEventAnalyticsRow[],
  dimension: 'platform' | 'locale' | 'tenantSlug',
): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    const value =
      dimension === 'platform'
        ? row.platform
        : dimension === 'locale'
          ? row.locale
          : (row.tenantSlug ?? '(none)');
    values.add(value);
  }
  return [...values].sort();
}

export function buildActivationOnboardingFunnel(
  rows: AppEventAnalyticsRow[],
): AdoptionFunnelExport {
  const steps = buildFunnelStepsForRows(
    rows,
    APP_ACTIVATION_ONBOARDING_FUNNEL_STEPS,
  );
  return { steps, breakdowns: [] };
}

function readOnboardingVariantForRow(
  row: AppEventAnalyticsRow,
): 'control' | 'guided' | null {
  const value = row.props?.onboardingVariant;
  return value === 'control' || value === 'guided' ? value : null;
}

function resolveAnonOnboardingVariant(
  rows: AppEventAnalyticsRow[],
  anonId: string,
): 'control' | 'guided' | null {
  for (const row of rows) {
    if (row.anonId !== anonId) continue;
    const variant = readOnboardingVariantForRow(row);
    if (variant) return variant;
  }
  return null;
}

export function computeOnboardingVariantActivation(
  rows: AppEventAnalyticsRow[],
): OnboardingVariantActivationExport[] {
  const variants: Array<'control' | 'guided'> = ['control', 'guided'];
  return variants.map((variant) => {
    const anonIds = uniqueAnonIds(rows).filter(
      (anonId) => resolveAnonOnboardingVariant(rows, anonId) === variant,
    );
    const startedCount = anonIds.filter((anonId) =>
      firstEventAt(rows, anonId, 'onboarding_started'),
    ).length;
    const completedCount = anonIds.filter((anonId) =>
      firstEventAt(rows, anonId, 'completed_booking'),
    ).length;
    return {
      variant,
      startedCount,
      completedCount,
      activationRate: startedCount === 0 ? null : completedCount / startedCount,
    };
  });
}

export function computeBookingAbandonmentRecovery(
  rows: AppEventAnalyticsRow[],
): BookingAbandonmentRecoveryExport {
  const abandonedUsers = uniqueAnonIds(
    rows.filter((row) => row.event === 'booking_abandoned'),
  ).length;
  const resumedUsers = uniqueAnonIds(
    rows.filter((row) => row.event === 'booking_resumed'),
  ).length;
  return {
    abandonedUsers,
    resumedUsers,
    recoveryRate: abandonedUsers === 0 ? null : resumedUsers / abandonedUsers,
  };
}

export function buildAdoptionFunnel(
  rows: AppEventAnalyticsRow[],
): AdoptionFunnelExport {
  const steps = buildFunnelStepsForRows(rows);
  const breakdowns: AdoptionFunnelBreakdown[] = [];

  for (const dimension of ['platform', 'locale', 'tenantSlug'] as const) {
    for (const value of buildBreakdownValues(rows, dimension)) {
      const filtered = rows.filter((row) => {
        if (dimension === 'platform') return row.platform === value;
        if (dimension === 'locale') return row.locale === value;
        const slug = row.tenantSlug ?? '(none)';
        return slug === value;
      });
      if (filtered.length === 0) continue;
      breakdowns.push({
        dimension,
        value,
        steps: buildFunnelStepsForRows(filtered),
      });
    }
  }

  return { steps, breakdowns };
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

export function buildRetentionCohorts(
  rows: AppEventAnalyticsRow[],
): RetentionCohortExport {
  const cohortAnonIds = uniqueAnonIds(
    rows.filter(
      (row) => row.event === 'app_installed' || row.event === 'app_opened',
    ),
  );

  let d1Returns = 0;
  let d7Returns = 0;
  let d30Returns = 0;
  let rebook30 = 0;
  let rebook60 = 0;
  let rebook90 = 0;
  let resurrected = 0;

  for (const anonId of cohortAnonIds) {
    const cohortStart =
      firstEventAt(rows, anonId, 'app_installed') ??
      firstEventAt(rows, anonId, 'app_opened');
    if (!cohortStart) continue;

    const opens = rows
      .filter((row) => row.anonId === anonId && row.event === 'app_opened')
      .map((row) => row.createdAt)
      .sort((a, b) => a.getTime() - b.getTime());

    const returnOpens = opens.filter(
      (at) => at.getTime() > cohortStart.getTime() + 60_000,
    );

    let returnedD1 = false;
    let returnedD7 = false;
    let returnedD30 = false;
    for (const openAt of returnOpens) {
      const day = daysBetween(cohortStart, openAt);
      if (day === 1) returnedD1 = true;
      if (day >= 1 && day <= 7) returnedD7 = true;
      if (day >= 1 && day <= 30) returnedD30 = true;
    }
    if (returnedD1) d1Returns += 1;
    if (returnedD7) d7Returns += 1;
    if (returnedD30) d30Returns += 1;

    const firstBooking = firstEventAt(rows, anonId, 'completed_booking');
    if (firstBooking) {
      const laterBookings = rows.filter(
        (row) =>
          row.anonId === anonId &&
          (row.event === 'rebooked' || row.event === 'completed_booking') &&
          row.createdAt > firstBooking,
      );
      let rebookedWithin30 = false;
      let rebookedWithin60 = false;
      let rebookedWithin90 = false;
      for (const booking of laterBookings) {
        const delta = daysBetween(firstBooking, booking.createdAt);
        if (delta <= 30) rebookedWithin30 = true;
        if (delta <= 60) rebookedWithin60 = true;
        if (delta <= 90) rebookedWithin90 = true;
      }
      if (rebookedWithin30) rebook30 += 1;
      if (rebookedWithin60) rebook60 += 1;
      if (rebookedWithin90) rebook90 += 1;
    }

    if (returnOpens.length >= 2) {
      let winBack = false;
      for (let index = 1; index < returnOpens.length; index += 1) {
        const gap = daysBetween(returnOpens[index - 1], returnOpens[index]);
        if (gap >= 30) {
          winBack = true;
          break;
        }
      }
      if (winBack) resurrected += 1;
    }
  }

  const cohortSize = cohortAnonIds.length;
  const rate = (count: number) => (cohortSize === 0 ? 0 : count / cohortSize);

  return {
    cohortSize,
    d1ReturnRate: rate(d1Returns),
    d7ReturnRate: rate(d7Returns),
    d30ReturnRate: rate(d30Returns),
    rebookWithin30DaysRate: rate(rebook30),
    rebookWithin60DaysRate: rate(rebook60),
    rebookWithin90DaysRate: rate(rebook90),
    resurrectionRate: rate(resurrected),
  };
}

export function isActivatedUser(
  rows: AppEventAnalyticsRow[],
  anonId: string,
  windowDays = ACTIVATION_WINDOW_DAYS,
): boolean {
  const installedAt = firstEventAt(rows, anonId, 'app_installed');
  const signedInAt = firstEventAt(rows, anonId, 'signed_in');
  const bookedAt = firstEventAt(rows, anonId, 'completed_booking');
  if (!installedAt || !signedInAt || !bookedAt) return false;

  return (
    daysBetween(installedAt, signedInAt) <= windowDays &&
    daysBetween(installedAt, bookedAt) <= windowDays
  );
}

export function computeActivationMetrics(
  rows: AppEventAnalyticsRow[],
  windowDays = ACTIVATION_WINDOW_DAYS,
): ActivationExport {
  const installedAnonIds = uniqueAnonIds(
    rows.filter((row) => row.event === 'app_installed'),
  );
  let activatedCount = 0;

  for (const anonId of installedAnonIds) {
    if (isActivatedUser(rows, anonId, windowDays)) activatedCount += 1;
  }

  const installedCount = installedAnonIds.length;
  return {
    installedCount,
    activatedCount,
    activationRate: installedCount === 0 ? 0 : activatedCount / installedCount,
    windowDays,
  };
}

function computeActivationRateForWindow(
  rows: AppEventAnalyticsRow[],
  windowStart: Date,
  windowEnd: Date,
): number {
  const windowRows = rows.filter(
    (row) => row.createdAt >= windowStart && row.createdAt < windowEnd,
  );
  return computeActivationMetrics(windowRows).activationRate;
}

export function buildWeeklyActivationAlert(
  rows: AppEventAnalyticsRow[],
  now: Date,
): AdoptionWeeklyActivationAlert {
  const end = now;
  const currentStart = new Date(end.getTime() - 7 * DAY_MS);
  const previousStart = new Date(end.getTime() - 14 * DAY_MS);
  const currentWeekRate = computeActivationRateForWindow(
    rows,
    currentStart,
    end,
  );
  const previousWeekRate = computeActivationRateForWindow(
    rows,
    previousStart,
    currentStart,
  );
  const deltaPoints = previousWeekRate - currentWeekRate;

  return {
    triggered: deltaPoints > ACTIVATION_WEEKLY_ALERT_DELTA,
    currentWeekRate,
    previousWeekRate,
    deltaPoints,
    thresholdPoints: ACTIVATION_WEEKLY_ALERT_DELTA,
  };
}

export function computePushPrimingOptInRate(
  rows: AppEventAnalyticsRow[],
): number | null {
  const shownAnonIds = uniqueAnonIds(
    rows.filter((row) => row.event === 'push_priming_shown'),
  );
  if (shownAnonIds.length === 0) return null;

  let acceptedUsers = 0;
  for (const anonId of shownAnonIds) {
    const userRows = rows.filter((row) => row.anonId === anonId);
    if (
      userRows.some(
        (row) =>
          row.event === 'push_priming_accepted' &&
          row.props?.pushOptIn === true,
      )
    ) {
      acceptedUsers += 1;
    }
  }

  return acceptedUsers / shownAnonIds.length;
}

export function computeStartupTtiWithinBudgetRate(
  rows: AppEventAnalyticsRow[],
): number | null {
  return computeStartupTtiRate(rows);
}

export { STARTUP_TTI_WEEKLY_REGRESSION_DELTA };

export function computeAdoptionHeadlineMetrics(
  rows: AppEventAnalyticsRow[],
): AdoptionHeadlineMetrics {
  const openRows = rows.filter((row) => row.event === 'app_opened');
  const openAnonIds = uniqueAnonIds(openRows);

  let pushOptInUsers = 0;
  let crashFreeSessions = 0;
  for (const anonId of openAnonIds) {
    const userOpens = openRows.filter((row) => row.anonId === anonId);
    if (userOpens.some((row) => row.props?.pushOptIn === true))
      pushOptInUsers += 1;
  }
  for (const open of openRows) {
    if (open.props?.crashFree !== false) crashFreeSessions += 1;
  }

  const referralSent = rows.filter(
    (row) => row.event === 'referral_sent',
  ).length;
  const referralConverted = rows.filter(
    (row) => row.event === 'referral_converted',
  ).length;
  const primingOptInRate = computePushPrimingOptInRate(rows);

  const crashFreeSessionRate =
    openRows.length === 0 ? null : crashFreeSessions / openRows.length;
  const startupTtiWithinBudgetRate = computeStartupTtiWithinBudgetRate(rows);

  return {
    pushOptInRate:
      primingOptInRate ??
      (openAnonIds.length === 0 ? null : pushOptInUsers / openAnonIds.length),
    crashFreeSessionRate,
    crashFreeSessionSloMet: meetsCrashFreeSessionSlo(crashFreeSessionRate),
    startupTtiWithinBudgetRate,
    startupTtiSloMet: meetsStartupTtiWithinBudgetSlo(
      startupTtiWithinBudgetRate,
    ),
    referralKFactor:
      referralSent === 0 ? null : referralConverted / referralSent,
  };
}

export function buildAdoptionExitGateFromRows(
  rows: AppEventAnalyticsRow[],
  now = new Date(),
): AdoptionExitGateResult {
  const currentStart = new Date(now.getTime() - 30 * DAY_MS);
  const previousStart = new Date(now.getTime() - 60 * DAY_MS);
  const currentRows = rows.filter((row) => row.createdAt >= currentStart);
  const previousRows = rows.filter(
    (row) => row.createdAt >= previousStart && row.createdAt < currentStart,
  );

  const activation = computeActivationMetrics(currentRows);
  const headlines = computeAdoptionHeadlineMetrics(currentRows);
  const previousRetention = buildRetentionCohorts(previousRows);
  const currentRetention = buildRetentionCohorts(currentRows);
  const previousHeadlines = computeAdoptionHeadlineMetrics(previousRows);

  const localeRates: Record<
    string,
    { activationRate: number; installs: number }
  > = {};
  for (const locale of ['en', 'hy', 'ru']) {
    const localeRows = currentRows.filter((row) => row.locale === locale);
    const installs = uniqueAnonIds(
      localeRows.filter((row) => row.event === 'app_installed'),
    ).length;
    localeRates[locale] = {
      installs,
      activationRate: computeActivationMetrics(localeRows).activationRate,
    };
  }

  return buildAdoptionExitGate({
    activationRate: activation.activationRate,
    pushOptInRate: headlines.pushOptInRate ?? 0,
    crashFreeSessionRate: headlines.crashFreeSessionRate ?? 0,
    d30RetentionTrendDelta:
      currentRetention.d30ReturnRate - previousRetention.d30ReturnRate,
    referralKFactorTrendDelta:
      (headlines.referralKFactor ?? 0) -
      (previousHeadlines.referralKFactor ?? 0),
    localeSpread: computeLocaleActivationSpread(localeRates),
    referralKFactor: headlines.referralKFactor ?? 0,
  });
}

export function buildAdoptionDashboardExport(
  rows: AppEventAnalyticsRow[],
  periodDays: number,
  now = new Date(),
  deliverabilityAggregate?: Parameters<
    typeof buildPushReachabilityDashboardExport
  >[1],
): AdoptionDashboardExport {
  return {
    periodDays,
    funnel: buildAdoptionFunnel(rows),
    activationOnboarding: buildActivationOnboardingFunnel(rows),
    bookingAbandonment: computeBookingAbandonmentRecovery(rows),
    onboardingVariants: computeOnboardingVariantActivation(rows),
    retention: buildRetentionCohorts(rows),
    activation: computeActivationMetrics(rows),
    qualifiedActivation: computeQualifiedActivationMetrics(rows),
    coldActivation: computeColdActivationMetrics(rows),
    qualifiedActivationCohort: buildN99QualifiedActivationCohortExport(rows),
    n99QualifiedExitGate: buildN99QualifiedActivationExitGateFromRows(rows),
    ...(() => {
      const deadEndAudit = auditQualifiedInstallDeadEnds(rows);
      return {
        qualifiedInstallFunnel: deadEndAudit.funnel,
        qualifiedInstallDeadEndAudit: deadEndAudit,
      };
    })(),
    activationPathAb: buildActivationPathAbExport(rows),
    pushReachability: buildPushReachabilityDashboardExport(
      rows,
      deliverabilityAggregate,
      now,
    ),
    headlines: computeAdoptionHeadlineMetrics(rows),
    weeklyActivationAlert: buildWeeklyActivationAlert(rows, now),
    weeklyStartupTtiRegressionAlert: buildWeeklyStartupTtiRegressionAlert(
      rows,
      now,
    ),
    exitGate: buildAdoptionExitGateFromRows(rows, now),
  };
}

export function filterRowsByPeriod(
  rows: AppEventAnalyticsRow[],
  periodDays: number,
  now = new Date(),
): AppEventAnalyticsRow[] {
  const cutoff = new Date(now.getTime() - periodDays * DAY_MS);
  return rows.filter((row) => row.createdAt >= cutoff);
}
