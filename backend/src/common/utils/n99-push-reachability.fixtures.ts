import type { AppAdoptionFixtureRow } from './app-adoption-analytics.fixtures.js';

export const N99_PUSH_REACHABILITY_TARGET = 0.99;
export const N99_PUSH_EXPLICIT_OPT_IN_TARGET = 0.8;
export const N99_PUSH_DELIVERABILITY_TARGET = 0.99;
export const N99_PUSH_REACHABILITY_ALERT_DELTA = 0.02;

export const N99_PUSH_PERMISSION_STATES = [
  'full',
  'provisional',
  'default_on',
  'denied',
  'prompt',
] as const;

export type N99PushPermissionState = (typeof N99_PUSH_PERMISSION_STATES)[number];

export const N99_PUSH_REACHABLE_STATES = new Set<N99PushPermissionState>([
  'full',
  'provisional',
  'default_on',
]);

export const N99_PUSH_REACHABILITY_FIXTURE_ROWS: AppAdoptionFixtureRow[] = [
  {
    id: 'reach-ios-open',
    anonId: 'reach-ios-1',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'reach-ios-register',
    anonId: 'reach-ios-1',
    event: 'push_reachability_registered',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:01:00.000Z',
    props: {
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'provisional',
    },
  },
  {
    id: 'reach-ios-open-2',
    anonId: 'reach-ios-2',
    event: 'app_opened',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'reach-android-open',
    anonId: 'reach-android-1',
    event: 'app_opened',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'reach-android-register',
    anonId: 'reach-android-1',
    event: 'push_reachability_registered',
    platform: 'android',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-01T10:01:00.000Z',
    props: {
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'default_on',
    },
  },
  {
    id: 'explicit-priming-shown',
    anonId: 'explicit-1',
    event: 'push_priming_shown',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-02T10:00:00.000Z',
    props: { pushOptIn: false },
  },
  {
    id: 'explicit-priming-accepted',
    anonId: 'explicit-1',
    event: 'push_priming_accepted',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-02T10:01:00.000Z',
    props: { pushOptIn: true, pushPermissionState: 'full' },
  },
  {
    id: 'explicit-priming-shown-2',
    anonId: 'explicit-2',
    event: 'push_priming_shown',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-02T10:00:00.000Z',
    props: { pushOptIn: false },
  },
  {
    id: 'explicit-priming-declined',
    anonId: 'explicit-2',
    event: 'push_priming_declined',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'en',
    createdAt: '2026-06-02T10:01:00.000Z',
    props: { pushOptIn: false },
  },
  {
    id: 'explicit-provisional-upgrade-shown',
    anonId: 'explicit-3',
    event: 'push_provisional_upgrade_shown',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'hy',
    createdAt: '2026-06-03T10:00:00.000Z',
    props: { pushPermissionState: 'provisional' },
  },
  {
    id: 'explicit-permission-upgraded',
    anonId: 'explicit-3',
    event: 'push_permission_upgraded',
    platform: 'ios',
    appSurface: 'consumer_app',
    locale: 'hy',
    createdAt: '2026-06-03T10:01:00.000Z',
    props: { pushOptIn: true, pushPermissionState: 'full' },
  },
];

export const N99_PUSH_REACHABILITY_DASHBOARD_SCENARIOS = [
  {
    id: 'ios-reachability-split',
    platform: 'ios' as const,
    expectedReachabilityRate: 0.5,
    expectedOpenedUsers: 2,
  },
  {
    id: 'android-reachability-split',
    platform: 'android' as const,
    expectedReachabilityRate: 1,
    expectedOpenedUsers: 1,
  },
  {
    id: 'locale-en-explicit-opt-in',
    locale: 'en' as const,
    expectedExplicitOptInRate: 0.5,
  },
  {
    id: 'locale-hy-explicit-opt-in',
    locale: 'hy' as const,
    expectedExplicitOptInRate: 1,
  },
] as const;

export const N99_PUSH_DELIVERABILITY_TOKEN_SNAPSHOT = {
  deliverySuccessCount: 99,
  deliveryFailureCount: 0,
  silentFailureCount: 1,
};
