import { getCompletedBookingCount } from './store-review-prompt.util.js';
import { getConsumerCopy } from './consumer-copy-catalog.js';
import { normalizeConsumerLocale } from './tenant-locale.js';
import type { PushPermissionState } from './push-reachability.util.js';
import { buildProvisionalToFullUpgradeCopy } from './provisional-to-full-push.util.js';
import { buildPushDeniedReaskCopy, shouldShowPushDeniedReask } from './push-denied-reask.util.js';

const PRIMING_SHOWN_KEY = 'consumer_push_priming_shown';
const PRIMING_DECISION_KEY = 'consumer_push_priming_decision';

/** adopt-3.5 — dashboard target for explicit opt-in after value-first priming */
export const PUSH_PRIMING_OPT_IN_TARGET = 0.8;

export type PushPrimingDecision = 'accepted' | 'declined' | 'dismissed';

export function shouldShowPushOptInPriming(completedBookingCount?: number): boolean {
  if (typeof localStorage === 'undefined') return false;
  if (localStorage.getItem(PRIMING_SHOWN_KEY) === '1') return false;
  const count = completedBookingCount ?? getCompletedBookingCount();
  return count === 1;
}

export function canPresentPushOptInPriming(input: {
  completedBookingCount: number;
  isNative: boolean;
  isFcmBuild: boolean;
  permission?: PushPermissionState;
}): boolean {
  if (input.permission === 'full' || input.permission === 'denied') return false;
  return (
    input.isNative &&
    input.isFcmBuild &&
    shouldShowPushOptInPriming(input.completedBookingCount)
  );
}

export function canPresentPushSettingsReask(input: {
  completedBookingCount: number;
  permission: PushPermissionState;
  isNative: boolean;
  isFcmBuild: boolean;
}): boolean {
  return shouldShowPushDeniedReask(input);
}

export function markPushOptInPrimingShown(): void {
  localStorage?.setItem(PRIMING_SHOWN_KEY, '1');
}

export function recordPushPrimingDecision(decision: PushPrimingDecision): void {
  localStorage?.setItem(PRIMING_DECISION_KEY, decision);
  markPushOptInPrimingShown();
}

export function readPushPrimingDecision(): PushPrimingDecision | null {
  const raw = localStorage?.getItem(PRIMING_DECISION_KEY);
  if (raw === 'accepted' || raw === 'declined' || raw === 'dismissed') return raw;
  return null;
}

export function computePushPrimingOptInRate(input: {
  shown: number;
  accepted: number;
}): number | null {
  if (input.shown <= 0) return null;
  return input.accepted / input.shown;
}

export function meetsPushPrimingOptInTarget(rate: number | null): boolean {
  return rate != null && rate >= PUSH_PRIMING_OPT_IN_TARGET;
}

export function buildPushOptInPrimingCopy(locale?: string | null): {
  title: string;
  body: string;
  accept: string;
  decline: string;
} {
  const copy = getConsumerCopy(normalizeConsumerLocale(locale) ?? 'en');
  return {
    title: copy.pushPrimingTitle,
    body: copy.pushPrimingBody,
    accept: copy.pushPrimingAccept,
    decline: copy.pushPrimingDecline,
  };
}

export function buildPushSettingsReaskCopy(locale?: string | null) {
  return buildPushDeniedReaskCopy(locale);
}

export function buildProvisionalUpgradeCopy(locale?: string | null) {
  return buildProvisionalToFullUpgradeCopy(locale);
}
