import {
  buildPushReachabilityAnalyticsProps,
  hasRegisteredPushReachability,
  markPushReachabilityRegistered,
  persistIosProvisionalPermissionState,
  readStoredIosProvisionalPermissionState,
} from './push-reachability.util.js';

export interface IosProvisionalReachabilityInput {
  platform: string;
  isNative: boolean;
  isFcmBuild: boolean;
  alreadyRegistered: boolean;
  permissionReceive: 'granted' | 'denied' | 'prompt';
}

/** n99-4.1 — should we establish iOS provisional reachability on this app open? */
export function shouldEnsureIosProvisionalReachabilityOnFirstOpen(
  input: IosProvisionalReachabilityInput,
): boolean {
  if (!input.isNative || !input.isFcmBuild) return false;
  if (input.platform !== 'ios') return false;
  if (input.alreadyRegistered) return false;
  if (input.permissionReceive === 'denied') return false;
  return true;
}

/** n99-4.1 — map Capacitor permission to provisional reachability after native auth. */
export function resolveIosProvisionalPermissionState(
  permissionReceive: 'granted' | 'denied' | 'prompt' | string | undefined,
): 'provisional' | 'denied' | 'prompt' {
  if (permissionReceive === 'denied') return 'denied';
  if (permissionReceive === 'prompt') return 'prompt';
  return 'provisional';
}

export function buildIosProvisionalReachabilityAnalyticsProps() {
  return buildPushReachabilityAnalyticsProps({ permissionState: 'provisional' });
}

export {
  hasRegisteredPushReachability,
  markPushReachabilityRegistered,
  persistIosProvisionalPermissionState,
  readStoredIosProvisionalPermissionState,
};
