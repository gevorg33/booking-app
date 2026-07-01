import {
  APP_ADOPTION_ACTIVATION_EXPECTED,
  APP_ADOPTION_ACTIVATION_SCENARIOS,
  APP_ADOPTION_FUNNEL_ATTRIBUTION_EXPECTATIONS,
  APP_ADOPTION_FUNNEL_FIXTURE_ROWS,
  APP_ADOPTION_HEADLINE_EXPECTED,
  APP_ADOPTION_HEADLINE_FIXTURE_ROWS,
  APP_ADOPTION_PUSH_PRIMING_EXPECTED,
  APP_ADOPTION_PUSH_PRIMING_FIXTURE_ROWS,
  APP_ACTIVATION_ONBOARDING_FIXTURE_ROWS,
  APP_ADOPTION_RETENTION_EXPECTED,
  APP_ADOPTION_RETENTION_FIXTURE_ROWS,
  APP_ADOPTION_WEEKLY_ALERT_FIXTURE_ROWS,
  ACTIVATION_WEEKLY_ALERT_DELTA,
  ACTIVATION_WINDOW_DAYS,
  APP_ADOPTION_EXIT_GATE_NOW,
  buildAppAdoptionExitGateLocaleFixtureRows,
  buildAppAdoptionExitGateMetFixtureRows,
  buildAppAdoptionExitGateTrendFixtureRows,
} from './app-adoption-analytics.fixtures.js';
import { ADOPTION_EXIT_PERIOD_DAYS } from './adoption-exit-gate.util.js';
import { buildN99QualifiedFunnelHealthyRows } from './n99-qualified-install-funnel.fixtures.js';
import { N99_ACTIVATION_PATH_AB_FIXTURE_ROWS } from './n99-activation-path-ab.fixtures.js';
import { N99_PUSH_REACHABILITY_FIXTURE_ROWS } from './n99-push-reachability.fixtures.js';
import {
  buildAdoptionDashboardExport,
  buildAdoptionExitGateFromRows,
  buildAdoptionFunnel,
  buildAppEventRecordPayload,
  buildRetentionCohorts,
  buildWeeklyActivationAlert,
  computeActivationMetrics,
  computeAdoptionHeadlineMetrics,
  computeStartupTtiWithinBudgetRate,
  computeBookingAbandonmentRecovery,
  computeOnboardingVariantActivation,
  computePushPrimingOptInRate,
  buildActivationOnboardingFunnel,
  hashAnonIdSeed,
  isActivatedUser,
  normalizeAnonId,
  redactAppEventProps,
  resolveAppAdoptionEvent,
  shouldRateLimitAppEvents,
  type RateLimitState,
} from './app-adoption-analytics.util.js';
import {
  APP_EVENT_RATE_LIMIT_MAX,
  APP_EVENT_RATE_LIMIT_WINDOW_MS,
} from './app-adoption-analytics.fixtures.js';
import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';

function toRows(
  fixtures: typeof APP_ADOPTION_FUNNEL_FIXTURE_ROWS,
): AppEventAnalyticsRow[] {
  return fixtures.map((row) => ({
    anonId: row.anonId,
    event: row.event,
    platform: row.platform,
    appSurface: row.appSurface,
    locale: row.locale,
    tenantSlug: row.tenantSlug ?? null,
    createdAt: new Date(row.createdAt),
    props: row.props ?? null,
  }));
}

describe('app-adoption-analytics.util', () => {
  it('resolves known adoption events', () => {
    expect(resolveAppAdoptionEvent('app_opened')).toBe('app_opened');
    expect(resolveAppAdoptionEvent('unknown')).toBeNull();
    expect(
      buildAppEventRecordPayload('biz', {
        event: 'bad',
        anonId: 'a',
        platform: 'ios',
        appSurface: 'consumer_app',
      }),
    ).toBeNull();
  });

  it('validates platform, surface, and prop redaction edge cases', () => {
    expect(
      buildAppEventRecordPayload('biz', {
        event: 'app_opened',
        anonId: 'anon',
        platform: 'desktop',
        appSurface: 'consumer_app',
      }),
    ).toBeNull();
    expect(
      buildAppEventRecordPayload('biz', {
        event: 'app_opened',
        anonId: 'anon',
        platform: 'ios',
        appSurface: 'unknown',
      }),
    ).toBeNull();
    expect(
      redactAppEventProps({
        bookingId: 'x'.repeat(200),
        pushOptIn: true,
        ignored: 'value',
      }),
    ).toEqual({ pushOptIn: true });
    expect(computeActivationMetrics([]).activationRate).toBe(0);
    expect(computeAdoptionHeadlineMetrics([])).toEqual({
      pushOptInRate: null,
      crashFreeSessionRate: null,
      crashFreeSessionSloMet: null,
      startupTtiWithinBudgetRate: null,
      startupTtiSloMet: null,
      referralKFactor: null,
    });
    expect(normalizeAnonId('user@example.com')).toBeNull();
    expect(
      redactAppEventProps({
        email: 'a@b.com',
        bookingId: 'uuid-1',
        pushOptIn: true,
        contactChannel: 'whatsapp',
        messageBody: 'secret text',
      }),
    ).toEqual({
      bookingId: 'uuid-1',
      pushOptIn: true,
      contactChannel: 'whatsapp',
    });
    expect(
      buildAppEventRecordPayload('biz-1', {
        event: 'staff_contacted_customer',
        anonId: 'anon-abc',
        platform: 'ios',
        appSurface: 'provider_app',
        props: { bookingId: 'bk-1', contactChannel: 'call' },
      })?.event,
    ).toBe('staff_contacted_customer');
  });

  it('builds validated ingest payloads', () => {
    const payload = buildAppEventRecordPayload('biz-1', {
      event: 'app_opened',
      anonId: 'anon-abc',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      props: { name: 'secret', bookingId: 'b-1' },
    });
    expect(payload?.businessId).toBe('biz-1');
    expect(payload?.props).toEqual({ bookingId: 'b-1' });
  });

  it('persists session + device context on ingest payload (adopt-1.2)', () => {
    const payload = buildAppEventRecordPayload('biz-1', {
      event: 'app_opened',
      anonId: 'anon-abc',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'hy',
      tenantSlug: 'salon-a',
      sessionId: 'sess-abc',
      startType: 'cold',
      userType: 'first_open',
      appVersion: '1.0.0',
    });
    expect(payload?.sessionId).toBe('sess-abc');
    expect(payload?.startType).toBe('cold');
    expect(payload?.userType).toBe('first_open');
    expect(payload?.appVersion).toBe('1.0.0');
    expect(payload?.locale).toBe('hy');
    expect(payload?.tenantSlug).toBe('salon-a');
    expect(payload?.platform).toBe('ios');
  });

  it('computes strict funnel conversion for fixture matrix', () => {
    const funnel = buildAdoptionFunnel(
      toRows(APP_ADOPTION_FUNNEL_FIXTURE_ROWS),
    );
    expect(funnel.steps[0]?.count).toBe(3);
    expect(funnel.steps[1]?.count).toBe(3);
    expect(funnel.steps[2]?.count).toBe(2);
    expect(funnel.steps[3]?.count).toBe(2);
    expect(funnel.steps[4]?.count).toBe(1);
    expect(funnel.breakdowns.some((b) => b.dimension === 'platform')).toBe(
      true,
    );
  });

  it('computes per-step conversion and drop-off on aggregate funnel (adopt-1.4)', () => {
    const funnel = buildAdoptionFunnel(
      toRows(APP_ADOPTION_FUNNEL_FIXTURE_ROWS),
    );
    const signIn = funnel.steps[2];
    const rebook = funnel.steps[4];

    expect(signIn?.conversionFromPrevious).toBeCloseTo(2 / 3, 5);
    expect(signIn?.dropOffFromPrevious).toBeCloseTo(1 / 3, 5);
    expect(rebook?.conversionFromPrevious).toBeCloseTo(0.5, 5);
    expect(rebook?.dropOffFromPrevious).toBeCloseTo(0.5, 5);
  });

  it.each(APP_ADOPTION_FUNNEL_ATTRIBUTION_EXPECTATIONS)(
    'attributes drop-off for scenario $id (adopt-1.4)',
    (scenario) => {
      const funnel = buildAdoptionFunnel(
        toRows(APP_ADOPTION_FUNNEL_FIXTURE_ROWS),
      );
      const steps =
        scenario.dimension === 'aggregate'
          ? funnel.steps
          : funnel.breakdowns.find(
              (entry) =>
                entry.dimension === scenario.dimension &&
                entry.value === scenario.value,
            )?.steps;

      expect(steps).toBeDefined();
      expect(steps?.map((step) => step.count)).toEqual([
        ...scenario.stepCounts,
      ]);

      if (scenario.signInConversion != null) {
        expect(steps?.[2]?.conversionFromPrevious).toBeCloseTo(
          scenario.signInConversion,
          5,
        );
      }
      if (scenario.signInDropOff != null) {
        expect(steps?.[2]?.dropOffFromPrevious).toBeCloseTo(
          scenario.signInDropOff,
          5,
        );
      }
      if (scenario.rebookConversion != null) {
        expect(steps?.[4]?.conversionFromPrevious).toBeCloseTo(
          scenario.rebookConversion,
          5,
        );
      }
      if (scenario.rebookDropOff != null) {
        expect(steps?.[4]?.dropOffFromPrevious).toBeCloseTo(
          scenario.rebookDropOff,
          5,
        );
      }
    },
  );

  it('includes platform, locale, and tenant breakdown dimensions (adopt-1.4)', () => {
    const funnel = buildAdoptionFunnel(
      toRows(APP_ADOPTION_FUNNEL_FIXTURE_ROWS),
    );
    expect(funnel.breakdowns.some((b) => b.dimension === 'platform')).toBe(
      true,
    );
    expect(funnel.breakdowns.some((b) => b.dimension === 'locale')).toBe(true);
    expect(funnel.breakdowns.some((b) => b.dimension === 'tenantSlug')).toBe(
      true,
    );
  });

  it('computes activation within 7-day window (adopt-1.6)', () => {
    const activation = computeActivationMetrics(
      toRows(APP_ADOPTION_FUNNEL_FIXTURE_ROWS),
    );
    expect(activation.installedCount).toBe(
      APP_ADOPTION_ACTIVATION_EXPECTED.installedCount,
    );
    expect(activation.activatedCount).toBe(
      APP_ADOPTION_ACTIVATION_EXPECTED.activatedCount,
    );
    expect(activation.activationRate).toBeCloseTo(
      APP_ADOPTION_ACTIVATION_EXPECTED.activationRate,
      5,
    );
    expect(activation.windowDays).toBe(
      APP_ADOPTION_ACTIVATION_EXPECTED.windowDays,
    );
  });

  it.each(APP_ADOPTION_ACTIVATION_SCENARIOS)(
    'classifies activated users for scenario $id (adopt-1.6)',
    (scenario) => {
      const rows = toRows(APP_ADOPTION_FUNNEL_FIXTURE_ROWS);
      expect(isActivatedUser(rows, scenario.anonId)).toBe(scenario.activated);
    },
  );

  it('requires install, sign-in, and completed booking within the window (adopt-1.6)', () => {
    const baseInstall = new Date('2026-06-01T10:00:00.000Z');
    const rows: AppEventAnalyticsRow[] = [
      {
        anonId: 'anon-partial',
        event: 'app_installed',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: baseInstall,
        props: null,
      },
      {
        anonId: 'anon-partial',
        event: 'signed_in',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-02T10:00:00.000Z'),
        props: null,
      },
    ];
    expect(isActivatedUser(rows, 'anon-partial')).toBe(false);

    rows.push({
      anonId: 'anon-partial',
      event: 'completed_booking',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      tenantSlug: null,
      createdAt: new Date('2026-06-09T10:00:00.000Z'),
      props: null,
    });
    expect(isActivatedUser(rows, 'anon-partial')).toBe(false);

    rows[2] = {
      ...rows[2],
      createdAt: new Date('2026-06-07T10:00:00.000Z'),
    };
    expect(isActivatedUser(rows, 'anon-partial')).toBe(true);
  });

  it('supports custom activation windows (adopt-1.6)', () => {
    const rows = toRows(APP_ADOPTION_FUNNEL_FIXTURE_ROWS);
    expect(isActivatedUser(rows, 'anon-late-activation', 14)).toBe(true);
    expect(computeActivationMetrics(rows, 14).activatedCount).toBe(2);
  });

  it('returns zero activation metrics when no installs exist (adopt-1.6)', () => {
    expect(computeActivationMetrics([])).toEqual({
      installedCount: 0,
      activatedCount: 0,
      activationRate: 0,
      windowDays: ACTIVATION_WINDOW_DAYS,
    });
  });

  it('computes retention and resurrection cohorts (adopt-1.5)', () => {
    const retention = buildRetentionCohorts(
      toRows(APP_ADOPTION_RETENTION_FIXTURE_ROWS),
    );
    expect(retention.cohortSize).toBe(
      APP_ADOPTION_RETENTION_EXPECTED.cohortSize,
    );
    expect(retention.d1ReturnRate).toBeCloseTo(
      APP_ADOPTION_RETENTION_EXPECTED.d1ReturnRate,
      5,
    );
    expect(retention.d7ReturnRate).toBeCloseTo(
      APP_ADOPTION_RETENTION_EXPECTED.d7ReturnRate,
      5,
    );
    expect(retention.d30ReturnRate).toBeCloseTo(
      APP_ADOPTION_RETENTION_EXPECTED.d30ReturnRate,
      5,
    );
    expect(retention.rebookWithin30DaysRate).toBeCloseTo(
      APP_ADOPTION_RETENTION_EXPECTED.rebookWithin30DaysRate,
      5,
    );
    expect(retention.rebookWithin60DaysRate).toBeCloseTo(
      APP_ADOPTION_RETENTION_EXPECTED.rebookWithin60DaysRate,
      5,
    );
    expect(retention.rebookWithin90DaysRate).toBeCloseTo(
      APP_ADOPTION_RETENTION_EXPECTED.rebookWithin90DaysRate,
      5,
    );
    expect(retention.resurrectionRate).toBeCloseTo(
      APP_ADOPTION_RETENTION_EXPECTED.resurrectionRate,
      5,
    );
  });

  it('counts return and rebook retention per user not per event (adopt-1.5)', () => {
    const retention = buildRetentionCohorts([
      {
        anonId: 'anon-multi-open',
        event: 'app_installed',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        props: null,
      },
      {
        anonId: 'anon-multi-open',
        event: 'app_opened',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-02T10:00:00.000Z'),
        props: null,
      },
      {
        anonId: 'anon-multi-open',
        event: 'app_opened',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-03T10:00:00.000Z'),
        props: null,
      },
      {
        anonId: 'anon-multi-open',
        event: 'completed_booking',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-01T12:00:00.000Z'),
        props: null,
      },
      {
        anonId: 'anon-multi-open',
        event: 'rebooked',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-10T12:00:00.000Z'),
        props: null,
      },
      {
        anonId: 'anon-multi-open',
        event: 'rebooked',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-15T12:00:00.000Z'),
        props: null,
      },
    ]);

    expect(retention.cohortSize).toBe(1);
    expect(retention.d1ReturnRate).toBe(1);
    expect(retention.d7ReturnRate).toBe(1);
    expect(retention.rebookWithin30DaysRate).toBe(1);
  });

  it('returns zero retention rates for an empty cohort (adopt-1.5)', () => {
    const retention = buildRetentionCohorts([]);
    expect(retention).toEqual({
      cohortSize: 0,
      d1ReturnRate: 0,
      d7ReturnRate: 0,
      d30ReturnRate: 0,
      rebookWithin30DaysRate: 0,
      rebookWithin60DaysRate: 0,
      rebookWithin90DaysRate: 0,
      resurrectionRate: 0,
    });
  });

  it('computes headline metrics from optional props (adopt-1.7)', () => {
    const headlines = computeAdoptionHeadlineMetrics(
      toRows(APP_ADOPTION_HEADLINE_FIXTURE_ROWS),
    );
    expect(headlines.pushOptInRate).toBeCloseTo(
      APP_ADOPTION_HEADLINE_EXPECTED.pushOptInRate,
      5,
    );
    expect(headlines.crashFreeSessionRate).toBeCloseTo(
      APP_ADOPTION_HEADLINE_EXPECTED.crashFreeSessionRate,
      5,
    );
    expect(headlines.crashFreeSessionSloMet).toBe(false);
    expect(headlines.referralKFactor).toBeCloseTo(
      APP_ADOPTION_HEADLINE_EXPECTED.referralKFactor,
      5,
    );
  });

  it('computes startup TTI within-budget rate from app_interactive (adopt-5.2)', () => {
    const rate = computeStartupTtiWithinBudgetRate(
      toRows([
        {
          id: 'tti-ok',
          anonId: 'anon-a',
          event: 'app_interactive',
          platform: 'android',
          appSurface: 'consumer_app',
          locale: 'en',
          createdAt: '2026-06-01T12:00:00.000Z',
          props: {
            startupMs: 1200,
            crashFree: true,
            lowEndAndroid: true,
            ttiBudgetMs: 4500,
          },
        },
        {
          id: 'tti-slow',
          anonId: 'anon-b',
          event: 'app_interactive',
          platform: 'android',
          appSurface: 'consumer_app',
          locale: 'en',
          createdAt: '2026-06-01T12:01:00.000Z',
          props: {
            startupMs: 5200,
            crashFree: false,
            lowEndAndroid: true,
            ttiBudgetMs: 4500,
          },
        },
      ]),
    );
    expect(rate).toBeCloseTo(0.5, 5);
    expect(
      computeAdoptionHeadlineMetrics(
        toRows([
          {
            id: 'tti-ok',
            anonId: 'anon-a',
            event: 'app_interactive',
            platform: 'android',
            appSurface: 'consumer_app',
            locale: 'en',
            createdAt: '2026-06-01T12:00:00.000Z',
            props: { startupMs: 1200, crashFree: true },
          },
          {
            id: 'tti-slow',
            anonId: 'anon-b',
            event: 'app_interactive',
            platform: 'android',
            appSurface: 'consumer_app',
            locale: 'en',
            createdAt: '2026-06-01T12:01:00.000Z',
            props: { startupMs: 5200, crashFree: false },
          },
        ]),
      ).startupTtiSloMet,
    ).toBe(false);
  });

  it('computes push opt-in rate from priming funnel (adopt-3.5)', () => {
    const rows = toRows(APP_ADOPTION_PUSH_PRIMING_FIXTURE_ROWS);
    expect(computePushPrimingOptInRate(rows)).toBeCloseTo(
      APP_ADOPTION_PUSH_PRIMING_EXPECTED.optInRate,
      5,
    );
    expect(computeAdoptionHeadlineMetrics(rows).pushOptInRate).toBeCloseTo(
      APP_ADOPTION_PUSH_PRIMING_EXPECTED.optInRate,
      5,
    );
  });

  it('wires activation onboarding funnel, variants, and abandonment recovery (adopt-3.6)', () => {
    const rows = toRows(APP_ACTIVATION_ONBOARDING_FIXTURE_ROWS);
    const activationOnboarding = buildActivationOnboardingFunnel(rows);
    expect(activationOnboarding.steps[0]?.step).toBe('onboarding_started');
    expect(activationOnboarding.steps.at(-1)?.step).toBe('completed_booking');
    expect(activationOnboarding.steps.at(-1)?.count).toBe(1);

    const abandonment = computeBookingAbandonmentRecovery(rows);
    expect(abandonment.abandonedUsers).toBe(1);
    expect(abandonment.resumedUsers).toBe(1);
    expect(abandonment.recoveryRate).toBe(1);

    const variants = computeOnboardingVariantActivation(rows);
    expect(
      variants.find((entry) => entry.variant === 'guided')?.activationRate,
    ).toBe(1);
    expect(
      variants.find((entry) => entry.variant === 'control')?.completedCount,
    ).toBe(0);
  });

  it('computes push opt-in per user even with repeated opens (adopt-1.7)', () => {
    const headlines = computeAdoptionHeadlineMetrics([
      {
        anonId: 'anon-repeat',
        event: 'app_opened',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        props: { pushOptIn: true },
      },
      {
        anonId: 'anon-repeat',
        event: 'app_opened',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-02T10:00:00.000Z'),
        props: null,
      },
    ]);
    expect(headlines.pushOptInRate).toBe(1);
  });

  it('flags weekly activation drop alert when delta exceeds 2 pts (adopt-1.7)', () => {
    const alert = buildWeeklyActivationAlert(
      toRows(APP_ADOPTION_WEEKLY_ALERT_FIXTURE_ROWS),
      new Date('2026-06-15T10:00:00.000Z'),
    );
    expect(alert.previousWeekRate).toBeGreaterThan(alert.currentWeekRate);
    expect(alert.deltaPoints).toBeGreaterThan(ACTIVATION_WEEKLY_ALERT_DELTA);
    expect(alert.triggered).toBe(true);
    expect(alert.thresholdPoints).toBe(ACTIVATION_WEEKLY_ALERT_DELTA);
  });

  it('does not trigger weekly alert when activation is stable (adopt-1.7)', () => {
    const alert = buildWeeklyActivationAlert(
      [],
      new Date('2026-06-15T10:00:00.000Z'),
    );
    expect(alert.triggered).toBe(false);
    expect(alert.deltaPoints).toBe(0);
  });

  it('flags weekly activation drop alert (adopt-1.7 legacy)', () => {
    const rows: AppEventAnalyticsRow[] = [
      {
        anonId: 'a1',
        event: 'app_installed',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        props: null,
      },
      {
        anonId: 'a1',
        event: 'signed_in',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-01T11:00:00.000Z'),
        props: null,
      },
      {
        anonId: 'a1',
        event: 'completed_booking',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-01T12:00:00.000Z'),
        props: null,
      },
      {
        anonId: 'a2',
        event: 'app_installed',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        tenantSlug: null,
        createdAt: new Date('2026-06-10T10:00:00.000Z'),
        props: null,
      },
    ];
    const alert = buildWeeklyActivationAlert(
      rows,
      new Date('2026-06-15T10:00:00.000Z'),
    );
    expect(alert.previousWeekRate).toBeGreaterThan(alert.currentWeekRate);
    expect(typeof alert.triggered).toBe('boolean');
  });

  it('rate limits burst ingest per anon id', () => {
    let state: RateLimitState | undefined;
    for (let i = 0; i < APP_EVENT_RATE_LIMIT_MAX; i += 1) {
      const result = shouldRateLimitAppEvents(state, 1000);
      expect(result.limited).toBe(false);
      state = result.next;
    }
    expect(shouldRateLimitAppEvents(state, 1000).limited).toBe(true);
  });

  it('resets rate limit window after expiry', () => {
    const first = shouldRateLimitAppEvents(undefined, 0);
    const afterWindow = shouldRateLimitAppEvents(
      first.next,
      APP_EVENT_RATE_LIMIT_WINDOW_MS + 1,
    );
    expect(afterWindow.limited).toBe(false);
    expect(afterWindow.next.count).toBe(1);
  });

  it('hashes anon id seeds deterministically', () => {
    expect(hashAnonIdSeed('device-1')).toHaveLength(32);
    expect(hashAnonIdSeed('device-1')).toBe(hashAnonIdSeed('device-1'));
  });

  it('builds full dashboard export with funnel, cohorts, headlines, and alert (adopt-1.7)', () => {
    const dashboard = buildAdoptionDashboardExport(
      toRows([
        ...APP_ADOPTION_FUNNEL_FIXTURE_ROWS,
        ...APP_ADOPTION_RETENTION_FIXTURE_ROWS,
        ...APP_ADOPTION_HEADLINE_FIXTURE_ROWS,
      ]),
      30,
      new Date('2026-06-15T00:00:00.000Z'),
    );
    expect(dashboard.periodDays).toBe(30);
    expect(dashboard.funnel.steps.length).toBe(5);
    expect(dashboard.retention.cohortSize).toBeGreaterThan(0);
    expect(dashboard.activation.windowDays).toBe(7);
    expect(dashboard.qualifiedActivation.windowDays).toBe(7);
    expect(dashboard.coldActivation.windowDays).toBe(7);
    expect(dashboard.qualifiedActivationCohort.byLocale).toHaveLength(3);
    expect(dashboard.n99QualifiedExitGate.periodDays).toBe(7);
    expect(typeof dashboard.n99QualifiedExitGate.met).toBe('boolean');
    expect(dashboard.headlines.pushOptInRate).not.toBeNull();
    expect(dashboard.headlines.crashFreeSessionRate).not.toBeNull();
    expect(dashboard.headlines.referralKFactor).not.toBeNull();
    expect(dashboard.weeklyActivationAlert.thresholdPoints).toBe(
      ACTIVATION_WEEKLY_ALERT_DELTA,
    );
    expect(typeof dashboard.weeklyActivationAlert.triggered).toBe('boolean');
    expect(dashboard.weeklyStartupTtiRegressionAlert.thresholdPoints).toBe(
      0.03,
    );
    expect(dashboard.exitGate.periodDays).toBe(ADOPTION_EXIT_PERIOD_DAYS);
    expect(dashboard.exitGate.criteria).toHaveLength(7);
  });

  it('includes qualified-install dead-end audit in dashboard export (n99-3.6)', () => {
    const dashboard = buildAdoptionDashboardExport(
      buildN99QualifiedFunnelHealthyRows(),
      30,
    );
    expect(dashboard.qualifiedInstallFunnel.steps).toHaveLength(7);
    expect(dashboard.qualifiedInstallDeadEndAudit.passed).toBe(true);
    expect(dashboard.qualifiedInstallDeadEndAudit.fixTickets).toEqual([]);
  });

  it('includes activation path A/B export in dashboard (n99-3.8)', () => {
    const dashboard = buildAdoptionDashboardExport(
      toRows(N99_ACTIVATION_PATH_AB_FIXTURE_ROWS),
      30,
    );
    expect(dashboard.activationPathAb.scores).toHaveLength(6);
    expect(dashboard.activationPathAb.dimensions).toHaveLength(3);
    const preConfirm = dashboard.activationPathAb.scores.find(
      (entry) =>
        entry.dimension === 'signInPlacement' &&
        entry.variant === 'pre_confirm',
    );
    expect(preConfirm?.qualifiedActivationRate).toBe(1);
  });

  it('includes push reachability dashboard export (n99-4)', () => {
    const dashboard = buildAdoptionDashboardExport(
      toRows(N99_PUSH_REACHABILITY_FIXTURE_ROWS),
      30,
      new Date('2026-06-15T00:00:00.000Z'),
      { deliverySuccessCount: 99, deliveryFailureCount: 1 },
    );
    expect(dashboard.pushReachability.reachability.reachableUsers).toBe(2);
    expect(dashboard.pushReachability.explicitOptIn.explicitOptInUsers).toBe(2);
    expect(
      dashboard.pushReachability.deliverability.deliverabilityRate,
    ).toBeCloseTo(0.99, 5);
  });

  it('buildAdoptionExitGateFromRows enforces locale activation parity (adopt-6.8)', () => {
    const now = new Date(APP_ADOPTION_EXIT_GATE_NOW);
    const gate = buildAdoptionExitGateFromRows(
      toRows(buildAppAdoptionExitGateLocaleFixtureRows()),
      now,
    );
    expect(gate.activationRate).toBeGreaterThanOrEqual(0.6);
    expect(gate.localeSpread).toBeLessThanOrEqual(0.03);
  });

  it('buildAdoptionExitGateFromRows compares prior vs current retention and K-factor (adopt-6.8)', () => {
    const now = new Date(APP_ADOPTION_EXIT_GATE_NOW);
    const gate = buildAdoptionExitGateFromRows(
      toRows(buildAppAdoptionExitGateTrendFixtureRows()),
      now,
    );
    expect(gate.d30RetentionTrendDelta).toBeGreaterThan(0);
    expect(gate.referralKFactorTrendDelta).toBeGreaterThan(0);
  });

  it('buildAdoptionExitGateFromRows passes rolling 30-day exit gate when all criteria met (adopt-6.8)', () => {
    const now = new Date(APP_ADOPTION_EXIT_GATE_NOW);
    const gate = buildAdoptionExitGateFromRows(
      toRows(buildAppAdoptionExitGateMetFixtureRows()),
      now,
    );
    expect(gate.met).toBe(true);
    expect(gate.failures).toHaveLength(0);
  });
});
