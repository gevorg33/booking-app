import {
  canPresentPushOptInPriming,
} from './push-opt-in-priming.util.js';
import { shouldShowPushDeniedReask } from './push-denied-reask.util.js';
import { shouldShowProvisionalToFullUpgradePrompt } from './provisional-to-full-push.util.js';
import {
  shouldRequestAndroidPostBookingPermission,
  type PushPermissionState,
} from './push-reachability.util.js';

export type PostBookingPushFlowStep =
  | 'none'
  | 'settings_reask'
  | 'provisional_upgrade'
  | 'value_first_priming'
  | 'android_post_booking_permission';

export interface PostBookingPushFlowInput {
  platform: 'ios' | 'android' | 'web' | string;
  completedBookingCount: number;
  isNative: boolean;
  isFcmBuild: boolean;
  permission: PushPermissionState;
  engagedProvisional?: boolean;
  reaskShown?: boolean;
}

/** n99-4.4 — soft priming only after the first completed booking (peak happiness). */
export function isValueFirstPrimingEligible(input: {
  completedBookingCount: number;
  isNative: boolean;
  isFcmBuild: boolean;
  permission?: PushPermissionState;
  primingShown?: boolean;
}): boolean {
  if (input.primingShown === true) return false;
  return canPresentPushOptInPriming({
    completedBookingCount: input.completedBookingCount,
    isNative: input.isNative,
    isFcmBuild: input.isFcmBuild,
    permission: input.permission,
  });
}

/** n99-4.4 — OS permission dialog only after the user accepts value-first priming. */
export function shouldDeferOsPushPermissionUntilPrimingAccept(input: {
  primingEligible: boolean;
}): boolean {
  return input.primingEligible;
}

export function shouldRequestOsPushPermissionBeforePriming(input: {
  platform: string;
  completedBookingCount: number;
  permission: PushPermissionState;
  isNative: boolean;
  isFcmBuild: boolean;
  primingEligible: boolean;
}): boolean {
  if (shouldDeferOsPushPermissionUntilPrimingAccept({ primingEligible: input.primingEligible })) {
    return false;
  }
  if (input.platform !== 'android' || !input.isNative) return false;
  return shouldRequestAndroidPostBookingPermission({
    platform: 'android',
    completedBookingCount: input.completedBookingCount,
    permission: input.permission,
  });
}

/** n99-4.4 — ordered post-booking push UX (re-ask → provisional upgrade → value-first priming). */
export function resolvePostBookingPushFlow(input: PostBookingPushFlowInput): PostBookingPushFlowStep {
  if (
    shouldShowPushDeniedReask({
      permission: input.permission,
      completedBookingCount: input.completedBookingCount,
      isNative: input.isNative,
      isFcmBuild: input.isFcmBuild,
      reaskShown: input.reaskShown,
    })
  ) {
    return 'settings_reask';
  }

  if (
    shouldShowProvisionalToFullUpgradePrompt({
      platform: input.platform,
      permission: input.permission,
      engaged: input.engagedProvisional,
    })
  ) {
    return 'provisional_upgrade';
  }

  if (
    isValueFirstPrimingEligible({
      completedBookingCount: input.completedBookingCount,
      isNative: input.isNative,
      isFcmBuild: input.isFcmBuild,
      permission: input.permission,
    })
  ) {
    return 'value_first_priming';
  }

  if (
    shouldRequestOsPushPermissionBeforePriming({
      platform: input.platform,
      completedBookingCount: input.completedBookingCount,
      permission: input.permission,
      isNative: input.isNative,
      isFcmBuild: input.isFcmBuild,
      primingEligible: false,
    })
  ) {
    return 'android_post_booking_permission';
  }

  return 'none';
}

export function shouldTriggerOsPushPermissionOnPrimingAccept(): boolean {
  return true;
}

export { buildPushOptInPrimingCopy, shouldShowPushOptInPriming } from './push-opt-in-priming.util.js';
