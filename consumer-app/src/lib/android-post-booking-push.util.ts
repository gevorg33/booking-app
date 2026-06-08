import type { AppAnalyticsEventProps } from './app-analytics.js';
import { ANDROID_POST_NOTIFICATIONS_MIN_SDK } from './push-reachability.fixtures.js';
import {
  buildPushReachabilityAnalyticsProps,
  hasRegisteredPushReachability,
  hasRequestedAndroidPostBookingPermission,
  isAndroidDefaultOnReachable,
  markAndroidPostBookingPermissionRequested,
  markPushReachabilityRegistered,
  shouldRequestAndroidPostBookingPermission,
} from './push-reachability.util.js';

export {
  ANDROID_POST_NOTIFICATIONS_MIN_SDK,
  hasRegisteredPushReachability,
  hasRequestedAndroidPostBookingPermission,
  isAndroidDefaultOnReachable,
  markAndroidPostBookingPermissionRequested,
  markPushReachabilityRegistered,
  shouldRequestAndroidPostBookingPermission,
};

export interface AndroidDefaultOnFirstOpenInput {
  platform: string;
  isNative: boolean;
  isFcmBuild: boolean;
  alreadyRegistered: boolean;
  permissionReceive: 'granted' | 'denied' | 'prompt';
  sdkInt?: number;
}

/** n99-4.2 — establish default-on reachability on first open for pre-13 Android. */
export function shouldEnsureAndroidDefaultOnReachabilityOnFirstOpen(
  input: AndroidDefaultOnFirstOpenInput,
): boolean {
  if (!input.isNative || !input.isFcmBuild) return false;
  if (input.platform !== 'android') return false;
  if (input.alreadyRegistered) return false;
  if (input.permissionReceive !== 'granted') return false;
  if (input.sdkInt != null && input.sdkInt >= ANDROID_POST_NOTIFICATIONS_MIN_SDK) return false;
  return true;
}

export function persistAndroidDefaultOnPermissionState(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('consumer-push-permission-state', 'default_on');
}

export function buildAndroidDefaultOnReachabilityAnalyticsProps(): AppAnalyticsEventProps {
  return buildPushReachabilityAnalyticsProps({ permissionState: 'default_on' });
}
