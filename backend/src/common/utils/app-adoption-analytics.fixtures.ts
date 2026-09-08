import type {
  AppAdoptionEventName,
  AppAdoptionPlatform,
  AppAdoptionSurface,
} from '../../modules/analytics/entities/app-event.entity.js';

export const APP_ADOPTION_EVENTS = [
  'app_installed',
  'app_opened',
  'signed_in',
  'viewed_salon',
  'started_booking',
  'completed_booking',
  'rebooked',
  'referral_sent',
  'referral_accepted',
  'referral_converted',
  'salon_shared',
  'booking_shared',
  'share_reward_claimed',
  'review_prompt_shown',
  'tenant_review_submitted',
  'store_review_opened',
  'onboarding_started',
  'onboarding_step_viewed',
  'booking_abandoned',
  'booking_resumed',
  'push_priming_shown',
  'push_priming_accepted',
  'push_priming_declined',
  'push_reachability_registered',
  'push_permission_upgraded',
  'push_settings_reask_shown',
  'push_provisional_upgrade_shown',
  'post_booking_sign_in_shown',
  'post_booking_sign_in_completed',
  'post_booking_sign_in_skipped',
  'activation_payment_fallback',
  'app_interactive',
  'staff_contacted_customer',
] as const satisfies readonly AppAdoptionEventName[];

export const APP_ADOPTION_FUNNEL_STEPS = [
  'app_installed',
  'app_opened',
  'signed_in',
  'completed_booking',
  'rebooked',
] as const satisfies readonly AppAdoptionEventName[];

/** adopt-3.6 — activation onboarding path wired from consumer app events */
export const APP_ACTIVATION_ONBOARDING_FUNNEL_STEPS = [
  'onboarding_started',
  'viewed_salon',
  'started_booking',
  'completed_booking',
] as const satisfies readonly AppAdoptionEventName[];

export const APP_ADOPTION_PLATFORMS = ['ios', 'android', 'web'] as const;

export const APP_ADOPTION_SURFACES = [
  'consumer_app',
  'provider_app',
  'public_web',
] as const satisfies readonly AppAdoptionSurface[];

/** adopt-1.6 — activated = install + sign-in + completed booking within 7 days */
export const ACTIVATION_WINDOW_DAYS = 7;

/** adopt-1.7 — alert when weekly activation drops more than this (percentage points) */
export const ACTIVATION_WEEKLY_ALERT_DELTA = 0.02;

export const APP_EVENT_RATE_LIMIT_MAX = 100;
export const APP_EVENT_RATE_LIMIT_WINDOW_MS = 60_000;

export const APP_EVENT_PROP_ALLOWLIST = new Set([
  'bookingId',
  'serviceId',
  'referralCode',
  'pushOptIn',
  'pushReachability',
  'pushPermissionState',
  'crashFree',
  'salonViewCount',
  'installSource',
  'campaign',
  'onboardingVariant',
  'onboardingStep',
  'abandonedStep',
  'firstRunRedirect',
  'date',
  'slot',
  'employeeId',
  'startupMs',
  'ttiBudgetMs',
  'lowEndAndroid',
  'intentQualified',
  'signInPlacement',
  'slotPreselection',
  'paymentTiming',
  'contactChannel',
  'templateId',
]);

export interface AppAdoptionFixtureRow {
  id: string;
  anonId: string;
  event: AppAdoptionEventName;
  platform: AppAdoptionPlatform;
  appSurface: AppAdoptionSurface;
  locale: string;
  tenantSlug?: string;
  createdAt: string;
  props?: Record<string, unknown>;
}

/** Synthetic funnel: install → open → sign-in → book → rebook */
export const APP_ADOPTION_FUNNEL_FIXTURE_ROWS: AppAdoptionFixtureRow[] = [
  {
    id: 'f1-install',
    anonId: 'anon-full-funnel',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'f1-open',
    anonId: 'anon-full-funnel',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:01:00.000Z',
  },
  {
    id: 'f1-signin',
    anonId: 'anon-full-funnel',
    event: 'signed_in',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:02:00.000Z',
  },
  {
    id: 'f1-book',
    anonId: 'anon-full-funnel',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T11:00:00.000Z',
    props: { bookingId: 'booking-1' },
  },
  {
    id: 'f1-rebook',
    anonId: 'anon-full-funnel',
    event: 'rebooked',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T10:00:00.000Z',
  },
  {
    id: 'f2-install',
    anonId: 'anon-drop-signin',
    event: 'app_installed',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'hy',
    createdAt: '2026-06-02T09:00:00.000Z',
  },
  {
    id: 'f2-open',
    anonId: 'anon-drop-signin',
    event: 'app_opened',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'hy',
    createdAt: '2026-06-02T09:05:00.000Z',
  },
  {
    id: 'f3-open',
    anonId: 'anon-late-activation',
    event: 'app_opened',
    platform: 'web',
    appSurface: 'public_web',
    locale: 'ru',
    tenantSlug: 'salon-a',
    createdAt: '2026-05-20T08:01:00.000Z',
  },
  {
    id: 'f3-install',
    anonId: 'anon-late-activation',
    event: 'app_installed',
    platform: 'web',
    appSurface: 'public_web',
    locale: 'ru',
    tenantSlug: 'salon-a',
    createdAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'f3-signin',
    anonId: 'anon-late-activation',
    event: 'signed_in',
    platform: 'web',
    appSurface: 'public_web',
    locale: 'ru',
    tenantSlug: 'salon-a',
    createdAt: '2026-05-28T08:00:00.000Z',
  },
  {
    id: 'f3-book-late',
    anonId: 'anon-late-activation',
    event: 'completed_booking',
    platform: 'web',
    appSurface: 'public_web',
    locale: 'ru',
    tenantSlug: 'salon-a',
    createdAt: '2026-05-30T08:00:00.000Z',
  },
];

/** adopt-1.4 — strict funnel expectations for fixture matrix attribution tests */
/** Declared so the array is one type, not a union of literal shapes. */
export type AppAdoptionFunnelAttributionExpectation = {
  id: string;
  dimension: 'aggregate' | 'platform' | 'locale' | 'tenantSlug';
  stepCounts: readonly number[];
  value?: string;
  signInConversion?: number;
  signInDropOff?: number;
  rebookConversion?: number;
  rebookDropOff?: number;
};

export const APP_ADOPTION_FUNNEL_ATTRIBUTION_EXPECTATIONS: readonly AppAdoptionFunnelAttributionExpectation[] = [
  {
    id: 'aggregate-install-to-repeat',
    dimension: 'aggregate' as const,
    stepCounts: [3, 3, 2, 2, 1],
    signInConversion: 2 / 3,
    signInDropOff: 1 / 3,
    rebookConversion: 0.5,
    rebookDropOff: 0.5,
  },
  {
    id: 'platform-android-signin-dropoff',
    dimension: 'platform' as const,
    value: 'android',
    stepCounts: [1, 1, 0, 0, 0],
    signInDropOff: 1,
  },
  {
    id: 'locale-hy-signin-dropoff',
    dimension: 'locale' as const,
    value: 'hy',
    stepCounts: [1, 1, 0, 0, 0],
    signInDropOff: 1,
  },
  {
    id: 'tenant-salon-a-booking-without-repeat',
    dimension: 'tenantSlug' as const,
    value: 'salon-a',
    stepCounts: [1, 1, 1, 1, 0],
    rebookDropOff: 1,
  },
  {
    id: 'platform-ios-full-funnel',
    dimension: 'platform' as const,
    value: 'ios',
    stepCounts: [1, 1, 1, 1, 1],
    rebookConversion: 1,
  },
] as const;

export const APP_ADOPTION_RETENTION_FIXTURE_ROWS: AppAdoptionFixtureRow[] = [
  {
    id: 'r1-install',
    anonId: 'anon-retained',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'r1-d1',
    anonId: 'anon-retained',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-02T10:00:00.000Z',
  },
  {
    id: 'r1-d7',
    anonId: 'anon-retained',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T10:00:00.000Z',
  },
  {
    id: 'r1-first-book',
    anonId: 'anon-retained',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T12:00:00.000Z',
  },
  {
    id: 'r1-rebook-30',
    anonId: 'anon-retained',
    event: 'rebooked',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-25T12:00:00.000Z',
  },
  {
    id: 'r2-install',
    anonId: 'anon-churned',
    event: 'app_installed',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'r2-open-once',
    anonId: 'anon-churned',
    event: 'app_opened',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:05:00.000Z',
  },
  {
    id: 'r3-resurrect-install',
    anonId: 'anon-resurrect',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'r3-resurrect-open-old',
    anonId: 'anon-resurrect',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-05-02T10:00:00.000Z',
  },
  {
    id: 'r3-resurrect-return',
    anonId: 'anon-resurrect',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-10T10:00:00.000Z',
    props: { userType: 'returning' },
  },
];

/** adopt-1.6 — expected activation metrics for funnel fixture matrix */
export const APP_ADOPTION_ACTIVATION_EXPECTED = {
  installedCount: 3,
  activatedCount: 1,
  activationRate: 1 / 3,
  windowDays: ACTIVATION_WINDOW_DAYS,
} as const;

/** Declared so the array is one type, not a union of literal shapes. */
export type AppAdoptionActivationScenario = {
  id: string;
  anonId: string;
  activated: boolean;
};

export const APP_ADOPTION_ACTIVATION_SCENARIOS: readonly AppAdoptionActivationScenario[] = [
  {
    id: 'activated-within-window',
    anonId: 'anon-full-funnel',
    activated: true,
  },
  {
    id: 'missing-sign-in',
    anonId: 'anon-drop-signin',
    activated: false,
  },
  {
    id: 'sign-in-and-booking-outside-window',
    anonId: 'anon-late-activation',
    activated: false,
  },
] as const;

/** adopt-1.5 — expected retention cohort metrics for fixture matrix */
export const APP_ADOPTION_RETENTION_EXPECTED = {
  cohortSize: 3,
  d1ReturnRate: 2 / 3,
  d7ReturnRate: 2 / 3,
  d30ReturnRate: 2 / 3,
  rebookWithin30DaysRate: 1 / 3,
  rebookWithin60DaysRate: 1 / 3,
  rebookWithin90DaysRate: 1 / 3,
  resurrectionRate: 1 / 3,
} as const;

/** adopt-1.7 — headline metric fixtures (push opt-in, crash-free, referral K) */
export const APP_ADOPTION_HEADLINE_FIXTURE_ROWS: AppAdoptionFixtureRow[] = [
  {
    id: 'h1-open-optin',
    anonId: 'anon-headline-a',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:00:00.000Z',
    props: { pushOptIn: true, crashFree: true },
  },
  {
    id: 'h1-open-repeat',
    anonId: 'anon-headline-a',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-02T10:00:00.000Z',
  },
  {
    id: 'h2-open-crash',
    anonId: 'anon-headline-b',
    event: 'app_opened',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T11:00:00.000Z',
    props: { crashFree: false },
  },
  {
    id: 'h2-referral',
    anonId: 'anon-headline-b',
    event: 'referral_sent',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T12:00:00.000Z',
    props: { referralCode: 'FRIEND' },
  },
];

export const APP_ADOPTION_HEADLINE_EXPECTED = {
  pushOptInRate: 0.5,
  crashFreeSessionRate: 2 / 3,
  referralKFactor: 0,
} as const;

/** adopt-3.5 — explicit opt-in after value-first priming (target ≥ 80%) */
export const APP_ADOPTION_PUSH_PRIMING_FIXTURE_ROWS: AppAdoptionFixtureRow[] = [
  {
    id: 'pp-shown-a',
    anonId: 'anon-priming-a',
    event: 'push_priming_shown',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T10:00:00.000Z',
    props: { pushOptIn: false },
  },
  {
    id: 'pp-accepted-a',
    anonId: 'anon-priming-a',
    event: 'push_priming_accepted',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T10:00:05.000Z',
    props: { pushOptIn: true },
  },
  {
    id: 'pp-shown-b',
    anonId: 'anon-priming-b',
    event: 'push_priming_shown',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T11:00:00.000Z',
    props: { pushOptIn: false },
  },
  {
    id: 'pp-accepted-b',
    anonId: 'anon-priming-b',
    event: 'push_priming_accepted',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T11:00:05.000Z',
    props: { pushOptIn: true },
  },
  {
    id: 'pp-shown-c',
    anonId: 'anon-priming-c',
    event: 'push_priming_shown',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T12:00:00.000Z',
    props: { pushOptIn: false },
  },
  {
    id: 'pp-accepted-c',
    anonId: 'anon-priming-c',
    event: 'push_priming_accepted',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T12:00:05.000Z',
    props: { pushOptIn: true },
  },
  {
    id: 'pp-shown-d',
    anonId: 'anon-priming-d',
    event: 'push_priming_shown',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T13:00:00.000Z',
    props: { pushOptIn: false },
  },
  {
    id: 'pp-declined-d',
    anonId: 'anon-priming-d',
    event: 'push_priming_declined',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T13:00:05.000Z',
    props: { pushOptIn: false },
  },
  {
    id: 'pp-shown-e',
    anonId: 'anon-priming-e',
    event: 'push_priming_shown',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T14:00:00.000Z',
    props: { pushOptIn: false },
  },
  {
    id: 'pp-accepted-e',
    anonId: 'anon-priming-e',
    event: 'push_priming_accepted',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T14:00:05.000Z',
    props: { pushOptIn: true },
  },
];

export const APP_ADOPTION_PUSH_PRIMING_EXPECTED = {
  optInRate: 0.8,
} as const;

/** adopt-3.6 — activation onboarding + abandonment recovery fixtures */
export const APP_ACTIVATION_ONBOARDING_FIXTURE_ROWS: AppAdoptionFixtureRow[] = [
  {
    id: 'ao-guided-start',
    anonId: 'anon-guided',
    event: 'onboarding_started',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T10:00:00.000Z',
    props: { onboardingVariant: 'guided' },
  },
  {
    id: 'ao-guided-salon',
    anonId: 'anon-guided',
    event: 'viewed_salon',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T10:05:00.000Z',
    props: { onboardingVariant: 'guided' },
  },
  {
    id: 'ao-guided-started-booking',
    anonId: 'anon-guided',
    event: 'started_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T10:10:00.000Z',
    props: { onboardingVariant: 'guided', serviceId: 'svc-1' },
  },
  {
    id: 'ao-guided-completed',
    anonId: 'anon-guided',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T10:20:00.000Z',
    props: { onboardingVariant: 'guided', bookingId: 'bk-1' },
  },
  {
    id: 'ao-control-start',
    anonId: 'anon-control',
    event: 'onboarding_started',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T11:00:00.000Z',
    props: { onboardingVariant: 'control' },
  },
  {
    id: 'ao-control-abandon',
    anonId: 'anon-control',
    event: 'booking_abandoned',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T11:05:00.000Z',
    props: {
      onboardingVariant: 'control',
      abandonedStep: 'slot',
      serviceId: 'svc-2',
    },
  },
  {
    id: 'ao-control-resume',
    anonId: 'anon-control',
    event: 'booking_resumed',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-08T11:10:00.000Z',
    props: {
      onboardingVariant: 'control',
      abandonedStep: 'slot',
      serviceId: 'svc-2',
    },
  },
];

/** adopt-1.7 — weekly activation alert fires when drop exceeds threshold */
export const APP_ADOPTION_WEEKLY_ALERT_FIXTURE_ROWS: AppAdoptionFixtureRow[] = [
  {
    id: 'wa1-install',
    anonId: 'anon-week-prev',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'wa1-signin',
    anonId: 'anon-week-prev',
    event: 'signed_in',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T11:00:00.000Z',
  },
  {
    id: 'wa1-book',
    anonId: 'anon-week-prev',
    event: 'completed_booking',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T12:00:00.000Z',
  },
  {
    id: 'wa2-install',
    anonId: 'anon-week-current',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-10T10:00:00.000Z',
  },
];

/** adopt-6.8 — fixed "now" for rolling 30-day exit gate fixture builders. */
export const APP_ADOPTION_EXIT_GATE_NOW = '2026-06-15T12:00:00.000Z';

function exitGateDayOffset(nowIso: string, offsetDays: number): string {
  const base = new Date(nowIso).getTime();
  return new Date(base + offsetDays * 86_400_000).toISOString();
}

function pushExitGateRow(
  rows: AppAdoptionFixtureRow[],
  seq: { value: number },
  row: Omit<AppAdoptionFixtureRow, 'id'>,
): void {
  rows.push({ ...row, id: `exit-gate-${seq.value++}` });
}

/** EN/HY/RU activation parity within 3 pts (7/10 activated per locale). */
export function buildAppAdoptionExitGateLocaleFixtureRows(
  nowIso = APP_ADOPTION_EXIT_GATE_NOW,
): AppAdoptionFixtureRow[] {
  const rows: AppAdoptionFixtureRow[] = [];
  const seq = { value: 0 };
  const installAt = exitGateDayOffset(nowIso, -26);

  for (const locale of ['en', 'hy', 'ru'] as const) {
    for (let index = 0; index < 10; index += 1) {
      const anonId = `anon-exit-locale-${locale}-${index}`;
      pushExitGateRow(rows, seq, {
        anonId,
        event: 'app_installed',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale,
        createdAt: installAt,
      });
      if (index < 7) {
        pushExitGateRow(rows, seq, {
          anonId,
          event: 'signed_in',
          platform: 'ios',
          appSurface: 'consumer_app',
          locale,
          createdAt: exitGateDayOffset(nowIso, -25),
        });
        pushExitGateRow(rows, seq, {
          anonId,
          event: 'completed_booking',
          platform: 'ios',
          appSurface: 'consumer_app',
          locale,
          createdAt: exitGateDayOffset(nowIso, -24),
          props: { bookingId: `bk-${locale}-${index}` },
        });
      }
    }
  }

  return rows;
}

/** Prior vs current 30d window for D30 retention and referral K-factor trends. */
export function buildAppAdoptionExitGateTrendFixtureRows(
  nowIso = APP_ADOPTION_EXIT_GATE_NOW,
): AppAdoptionFixtureRow[] {
  const rows: AppAdoptionFixtureRow[] = [];
  const seq = { value: 0 };

  for (let index = 0; index < 10; index += 1) {
    const anonId = `anon-exit-prev-ret-${index}`;
    pushExitGateRow(rows, seq, {
      anonId,
      event: 'app_installed',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -56),
    });
    if (index < 4) {
      pushExitGateRow(rows, seq, {
        anonId,
        event: 'app_opened',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        createdAt: exitGateDayOffset(nowIso, -53),
      });
    }
  }

  for (let index = 0; index < 10; index += 1) {
    const anonId = `anon-exit-cur-ret-${index}`;
    pushExitGateRow(rows, seq, {
      anonId,
      event: 'app_installed',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -26),
    });
    if (index < 8) {
      pushExitGateRow(rows, seq, {
        anonId,
        event: 'app_opened',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        createdAt: exitGateDayOffset(nowIso, -21),
      });
    }
  }

  for (let index = 0; index < 5; index += 1) {
    pushExitGateRow(rows, seq, {
      anonId: `anon-exit-prev-ref-${index}`,
      event: 'referral_sent',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -41),
    });
  }
  pushExitGateRow(rows, seq, {
    anonId: 'anon-exit-prev-ref-cv',
    event: 'referral_converted',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: exitGateDayOffset(nowIso, -40),
  });

  for (let index = 0; index < 5; index += 1) {
    pushExitGateRow(rows, seq, {
      anonId: `anon-exit-cur-ref-${index}`,
      event: 'referral_sent',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -20),
    });
  }
  for (let index = 0; index < 2; index += 1) {
    pushExitGateRow(rows, seq, {
      anonId: `anon-exit-cur-ref-cv-${index}`,
      event: 'referral_converted',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -19),
    });
  }

  return rows;
}

/** Push priming opt-in ≥ 80% and crash-free sessions ≥ 99.5% in current window. */
export function buildAppAdoptionExitGateHeadlineFixtureRows(
  nowIso = APP_ADOPTION_EXIT_GATE_NOW,
): AppAdoptionFixtureRow[] {
  const rows: AppAdoptionFixtureRow[] = [];
  const seq = { value: 0 };

  for (let index = 0; index < 10; index += 1) {
    const anonId = `anon-exit-priming-${index}`;
    pushExitGateRow(rows, seq, {
      anonId,
      event: 'push_priming_shown',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -10),
    });
    if (index < 9) {
      pushExitGateRow(rows, seq, {
        anonId,
        event: 'push_priming_accepted',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        createdAt: exitGateDayOffset(nowIso, -9),
        props: { pushOptIn: true },
      });
    }
  }

  for (let index = 0; index < 199; index += 1) {
    pushExitGateRow(rows, seq, {
      anonId: `anon-exit-crash-${index}`,
      event: 'app_installed',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -12),
    });
    pushExitGateRow(rows, seq, {
      anonId: `anon-exit-crash-${index}`,
      event: 'app_opened',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -11),
      props: { crashFree: true },
    });
  }
  pushExitGateRow(rows, seq, {
    anonId: 'anon-exit-crash-bad',
    event: 'app_installed',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: exitGateDayOffset(nowIso, -12),
  });
  pushExitGateRow(rows, seq, {
    anonId: 'anon-exit-crash-bad',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: exitGateDayOffset(nowIso, -11),
    props: { crashFree: false },
  });

  return rows;
}

export function buildAppAdoptionExitGateMetFixtureRows(
  nowIso = APP_ADOPTION_EXIT_GATE_NOW,
): AppAdoptionFixtureRow[] {
  const rows: AppAdoptionFixtureRow[] = [];
  const seq = { value: 0 };

  for (const locale of ['en', 'hy', 'ru'] as const) {
    for (let index = 0; index < 10; index += 1) {
      const anonId = `anon-exit-met-${locale}-${index}`;
      const installAt = exitGateDayOffset(nowIso, -26);
      pushExitGateRow(rows, seq, {
        anonId,
        event: 'app_installed',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale,
        createdAt: installAt,
      });
      if (index < 7) {
        pushExitGateRow(rows, seq, {
          anonId,
          event: 'signed_in',
          platform: 'ios',
          appSurface: 'consumer_app',
          locale,
          createdAt: exitGateDayOffset(nowIso, -25),
        });
        pushExitGateRow(rows, seq, {
          anonId,
          event: 'completed_booking',
          platform: 'ios',
          appSurface: 'consumer_app',
          locale,
          createdAt: exitGateDayOffset(nowIso, -24),
          props: { bookingId: `bk-met-${locale}-${index}` },
        });
        pushExitGateRow(rows, seq, {
          anonId,
          event: 'app_opened',
          platform: 'ios',
          appSurface: 'consumer_app',
          locale,
          createdAt: exitGateDayOffset(nowIso, -21),
          props: { crashFree: true },
        });
        for (let open = 0; open < 9; open += 1) {
          pushExitGateRow(rows, seq, {
            anonId,
            event: 'app_opened',
            platform: 'ios',
            appSurface: 'consumer_app',
            locale,
            createdAt: exitGateDayOffset(nowIso, -20 + open),
            props: { crashFree: true },
          });
        }
      }
    }
  }

  for (let index = 0; index < 10; index += 1) {
    const anonId = `anon-exit-met-priming-${index}`;
    pushExitGateRow(rows, seq, {
      anonId,
      event: 'push_priming_shown',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -10),
    });
    if (index < 9) {
      pushExitGateRow(rows, seq, {
        anonId,
        event: 'push_priming_accepted',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        createdAt: exitGateDayOffset(nowIso, -9),
        props: { pushOptIn: true },
      });
    }
  }

  pushExitGateRow(rows, seq, {
    anonId: 'anon-exit-met-en-0',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: exitGateDayOffset(nowIso, -18),
    props: { crashFree: false },
  });

  for (let index = 0; index < 10; index += 1) {
    const anonId = `anon-exit-met-prev-ret-${index}`;
    pushExitGateRow(rows, seq, {
      anonId,
      event: 'app_installed',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -56),
    });
    if (index < 4) {
      pushExitGateRow(rows, seq, {
        anonId,
        event: 'app_opened',
        platform: 'ios',
        appSurface: 'consumer_app',
        locale: 'en',
        createdAt: exitGateDayOffset(nowIso, -53),
      });
    }
  }

  for (let index = 0; index < 5; index += 1) {
    pushExitGateRow(rows, seq, {
      anonId: `anon-exit-met-prev-ref-${index}`,
      event: 'referral_sent',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -41),
    });
  }
  pushExitGateRow(rows, seq, {
    anonId: 'anon-exit-met-prev-ref-cv',
    event: 'referral_converted',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: exitGateDayOffset(nowIso, -40),
  });

  for (let index = 0; index < 5; index += 1) {
    pushExitGateRow(rows, seq, {
      anonId: `anon-exit-met-cur-ref-${index}`,
      event: 'referral_sent',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -20),
    });
  }
  for (let index = 0; index < 2; index += 1) {
    pushExitGateRow(rows, seq, {
      anonId: `anon-exit-met-cur-ref-cv-${index}`,
      event: 'referral_converted',
      platform: 'ios',
      appSurface: 'consumer_app',
      locale: 'en',
      createdAt: exitGateDayOffset(nowIso, -19),
    });
  }

  return rows;
}

export const APP_ADOPTION_CLIENT_SCENARIOS = [
  {
    id: 'consumer-installed',
    event: 'app_installed' as const,
    surface: 'consumer_app' as const,
    platform: 'ios' as const,
  },
  {
    id: 'consumer-opened-cold',
    event: 'app_opened' as const,
    surface: 'consumer_app' as const,
    platform: 'ios' as const,
    startType: 'cold' as const,
  },
  {
    id: 'consumer-signed-in',
    event: 'signed_in' as const,
    surface: 'consumer_app' as const,
    platform: 'android' as const,
  },
  {
    id: 'consumer-viewed-salon',
    event: 'viewed_salon' as const,
    surface: 'consumer_app' as const,
    platform: 'ios' as const,
  },
  {
    id: 'consumer-started-booking',
    event: 'started_booking' as const,
    surface: 'consumer_app' as const,
    platform: 'ios' as const,
  },
  {
    id: 'consumer-completed-booking',
    event: 'completed_booking' as const,
    surface: 'consumer_app' as const,
    platform: 'ios' as const,
    props: { bookingId: 'b-1' },
  },
  {
    id: 'consumer-rebooked',
    event: 'rebooked' as const,
    surface: 'consumer_app' as const,
    platform: 'android' as const,
  },
  {
    id: 'consumer-referral',
    event: 'referral_sent' as const,
    surface: 'consumer_app' as const,
    platform: 'ios' as const,
    props: { referralCode: 'FRIEND10' },
  },
  {
    id: 'provider-opened',
    event: 'app_opened' as const,
    surface: 'provider_app' as const,
    platform: 'android' as const,
  },
  {
    id: 'provider-signed-in',
    event: 'signed_in' as const,
    surface: 'provider_app' as const,
    platform: 'ios' as const,
  },
  {
    id: 'public-web-opened',
    event: 'app_opened' as const,
    surface: 'public_web' as const,
    platform: 'web' as const,
  },
  {
    id: 'public-web-completed',
    event: 'completed_booking' as const,
    surface: 'public_web' as const,
    platform: 'web' as const,
  },
] as const;
