import type { PushPermissionState } from './push-reachability.util.js';

export const PROVISIONAL_TO_FULL_UPGRADE_SCENARIOS = [
  {
    id: 'after-provisional-engagement',
    platform: 'ios' as const,
    permission: 'provisional' as PushPermissionState,
    engaged: true,
    upgradeShown: false,
    expected: true,
  },
  {
    id: 'skip-without-engagement',
    platform: 'ios' as const,
    permission: 'provisional' as PushPermissionState,
    engaged: false,
    upgradeShown: false,
    expected: false,
  },
  {
    id: 'skip-after-upgrade-shown',
    platform: 'ios' as const,
    permission: 'provisional' as PushPermissionState,
    engaged: true,
    upgradeShown: true,
    expected: false,
  },
  {
    id: 'skip-android-default-on',
    platform: 'android' as const,
    permission: 'default_on' as PushPermissionState,
    engaged: true,
    upgradeShown: false,
    expected: false,
  },
  {
    id: 'skip-already-full',
    platform: 'ios' as const,
    permission: 'full' as PushPermissionState,
    engaged: true,
    upgradeShown: false,
    expected: false,
  },
] as const;

export const PROVISIONAL_ENGAGEMENT_MARK_SCENARIOS = [
  {
    id: 'ios-provisional',
    platform: 'ios' as const,
    permission: 'provisional' as PushPermissionState,
    expected: true,
  },
  {
    id: 'ios-full',
    platform: 'ios' as const,
    permission: 'full' as PushPermissionState,
    expected: false,
  },
  {
    id: 'android-default-on',
    platform: 'android' as const,
    permission: 'default_on' as PushPermissionState,
    expected: false,
  },
] as const;

export const PROVISIONAL_UPGRADE_SLUG_SCENARIOS = [
  {
    id: 'event-slug-wins',
    eventSlug: 'salon-a',
    pathname: '/s/salon-b/book/svc-1',
    activePushSlug: 'salon-c',
    expected: 'salon-a',
  },
  {
    id: 'pathname-fallback',
    eventSlug: null,
    pathname: '/s/salon-b/manage',
    activePushSlug: null,
    expected: 'salon-b',
  },
  {
    id: 'active-push-slug-fallback',
    eventSlug: null,
    pathname: '/',
    activePushSlug: 'salon-c',
    expected: 'salon-c',
  },
] as const;
