import type { PushPermissionState } from './push-reachability.util.js';

/** n99-4.6 — one re-ask after the first booking (2nd+ high-value moment). */
export const PUSH_DENIED_REASK_MIN_BOOKINGS = 2;
export const PUSH_DENIED_MAX_REASK_COUNT = 1;

export const PUSH_DENIED_REASK_SCENARIOS = [
  {
    id: 'denied-second-booking',
    permission: 'denied' as PushPermissionState,
    completedBookingCount: 2,
    isNative: true,
    isFcmBuild: true,
    reaskShown: false,
    expected: true,
  },
  {
    id: 'denied-first-booking-no-reask',
    permission: 'denied' as PushPermissionState,
    completedBookingCount: 1,
    isNative: true,
    isFcmBuild: true,
    reaskShown: false,
    expected: false,
  },
  {
    id: 'denied-already-reasked',
    permission: 'denied' as PushPermissionState,
    completedBookingCount: 3,
    isNative: true,
    isFcmBuild: true,
    reaskShown: true,
    expected: false,
  },
  {
    id: 'prompt-no-reask',
    permission: 'prompt' as PushPermissionState,
    completedBookingCount: 2,
    isNative: true,
    isFcmBuild: true,
    reaskShown: false,
    expected: false,
  },
  {
    id: 'skip-web',
    permission: 'denied' as PushPermissionState,
    completedBookingCount: 2,
    isNative: false,
    isFcmBuild: true,
    reaskShown: false,
    expected: false,
  },
] as const;

export const HIGH_VALUE_PUSH_MOMENT_SCENARIOS = [
  { id: 'first-booking', completedBookingCount: 1, expected: false },
  { id: 'second-booking', completedBookingCount: 2, expected: true },
  { id: 'repeat-booking', completedBookingCount: 5, expected: true },
] as const;
