import type { AppAnalyticsEventProps } from './app-analytics.js';
import {
  ANDROID_POST_BOOKING_REQUESTED_KEY,
  ANDROID_POST_NOTIFICATIONS_MIN_SDK,
  PUSH_PROVISIONAL_ENGAGED_KEY,
  PUSH_PROVISIONAL_UPGRADE_SHOWN_KEY,
  PUSH_REACHABILITY_REGISTERED_KEY,
  PUSH_PERMISSION_STATE_KEY,
  PUSH_REACHABLE_STATES,
  PUSH_SETTINGS_REASK_KEY,
  type PushPermissionState,
} from './push-reachability.fixtures.js';

export {
  ANDROID_POST_NOTIFICATIONS_MIN_SDK,
  PROVISIONAL_UPGRADE_SCENARIOS,
  PUSH_PERMISSION_STATES,
  PUSH_REACHABILITY_SCENARIOS,
  PUSH_REASK_SCENARIOS,
  type PushPermissionState,
} from './push-reachability.fixtures.js';

export function isPushReachableState(state: PushPermissionState): boolean {
  return PUSH_REACHABLE_STATES.has(state);
}

export function mapCapacitorPermission(
  receive: 'granted' | 'denied' | 'prompt' | string | undefined,
  options?: { provisional?: boolean; defaultOn?: boolean },
): PushPermissionState {
  if (options?.defaultOn) return 'default_on';
  if (options?.provisional && receive === 'granted') return 'provisional';
  if (receive === 'granted') return 'full';
  if (receive === 'denied') return 'denied';
  if (receive === 'prompt') return 'prompt';
  return 'unknown';
}

export function hasRegisteredPushReachability(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PUSH_REACHABILITY_REGISTERED_KEY) === '1';
}

export function markPushReachabilityRegistered(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PUSH_REACHABILITY_REGISTERED_KEY, '1');
}

export function persistIosProvisionalPermissionState(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PUSH_PERMISSION_STATE_KEY, 'provisional');
}

export function readStoredIosProvisionalPermissionState(): 'provisional' | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(PUSH_PERMISSION_STATE_KEY) === 'provisional'
    ? 'provisional'
    : null;
}

export function markProvisionalPushEngaged(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PUSH_PROVISIONAL_ENGAGED_KEY, '1');
}

export function hasProvisionalPushEngaged(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PUSH_PROVISIONAL_ENGAGED_KEY) === '1';
}

export function markPushSettingsReaskShown(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PUSH_SETTINGS_REASK_KEY, '1');
}

export function hasShownPushSettingsReask(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PUSH_SETTINGS_REASK_KEY) === '1';
}

export function markProvisionalUpgradeShown(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PUSH_PROVISIONAL_UPGRADE_SHOWN_KEY, '1');
}

export function hasShownProvisionalUpgrade(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PUSH_PROVISIONAL_UPGRADE_SHOWN_KEY) === '1';
}

export function hasRequestedAndroidPostBookingPermission(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(ANDROID_POST_BOOKING_REQUESTED_KEY) === '1';
}

export function markAndroidPostBookingPermissionRequested(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ANDROID_POST_BOOKING_REQUESTED_KEY, '1');
}

/** n99-4.2 — POST_NOTIFICATIONS after first booking on Android 13+ (not on launch). */
export function shouldRequestAndroidPostBookingPermission(input: {
  platform: 'ios' | 'android' | 'web' | string;
  sdkInt?: number;
  completedBookingCount: number;
  permission: PushPermissionState;
  alreadyRequested?: boolean;
}): boolean {
  if (input.platform !== 'android') return false;
  if (input.completedBookingCount !== 1) return false;
  if (input.alreadyRequested ?? hasRequestedAndroidPostBookingPermission()) return false;
  if (input.sdkInt != null && input.sdkInt < ANDROID_POST_NOTIFICATIONS_MIN_SDK) return false;
  return input.permission === 'prompt' || input.permission === 'unknown';
}

/** n99-4.2 — pre-13 notifications default-on without runtime POST_NOTIFICATIONS. */
export function isAndroidDefaultOnReachable(input: {
  platform: 'ios' | 'android' | 'web' | string;
  sdkInt?: number;
  permissionReceive?: 'granted' | 'denied' | 'prompt';
}): boolean {
  if (input.platform !== 'android') return false;
  if (input.sdkInt != null && input.sdkInt >= ANDROID_POST_NOTIFICATIONS_MIN_SDK) return false;
  if (input.permissionReceive === 'prompt') return false;
  if (input.permissionReceive === 'granted') return true;
  return input.sdkInt != null && input.sdkInt < ANDROID_POST_NOTIFICATIONS_MIN_SDK;
}

export function shouldShowProvisionalUpgradePrompt(input: {
  permission: PushPermissionState;
  engaged?: boolean;
  upgradeShown?: boolean;
}): boolean {
  if (input.permission !== 'provisional') return false;
  if (input.upgradeShown ?? hasShownProvisionalUpgrade()) return false;
  return input.engaged ?? hasProvisionalPushEngaged();
}

export function shouldReaskPushPermission(input: {
  permission: PushPermissionState;
  completedBookingCount: number;
  reaskShown?: boolean;
}): boolean {
  if (input.permission !== 'denied') return false;
  if (input.completedBookingCount < 2) return false;
  return !(input.reaskShown ?? hasShownPushSettingsReask());
}

export function buildPushReachabilityAnalyticsProps(input: {
  permissionState: PushPermissionState;
  pushOptIn?: boolean;
  pushReminders?: boolean;
}): AppAnalyticsEventProps {
  return {
    pushReachability: isPushReachableState(input.permissionState) && input.pushReminders !== false,
    pushReachabilityScope: 'transactional',
    pushPermissionState: input.permissionState,
    ...(input.pushOptIn != null ? { pushOptIn: input.pushOptIn } : {}),
    ...(input.pushReminders != null ? { pushReminders: input.pushReminders } : {}),
  };
}

export async function openNotificationSettings(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const { App } = await import('@capacitor/app');
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return false;
    if (Capacitor.getPlatform() === 'ios') {
      await App.openUrl({ url: 'app-settings:' });
      return true;
    }
    if (Capacitor.getPlatform() === 'android') {
      const info = await App.getInfo();
      await App.openUrl({
        url: `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${info.id};end`,
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
