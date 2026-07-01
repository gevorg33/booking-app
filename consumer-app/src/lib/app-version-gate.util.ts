/** adopt-5.5 — semver compare for min-supported-version gates. */

export function parseSemver(version: string): [number, number, number] | null {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function compareSemver(a: string, b: string): number | null {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (!parsedA || !parsedB) return null;
  for (let i = 0; i < 3; i += 1) {
    if (parsedA[i] > parsedB[i]) return 1;
    if (parsedA[i] < parsedB[i]) return -1;
  }
  return 0;
}

export function isVersionBelowMinimum(current: string, minimum: string): boolean {
  const cmp = compareSemver(current, minimum);
  if (cmp == null) return false;
  return cmp < 0;
}

export interface MobileAppConfigView {
  minSupportedVersion: string;
  latestVersion: string;
  updateRequired: boolean;
  killSwitch: boolean;
  message: string | null;
  storeUrl: string | null;
  activationPathAb?: {
    signInPlacement?: 'post_booking' | 'pre_confirm' | null;
    slotPreselection?: 'nearest_auto' | 'manual_pick' | null;
    paymentTiming?: 'pay_at_venue_default' | 'online_first' | null;
  };
}

export function evaluateMobileAppGate(input: {
  currentVersion: string;
  config: MobileAppConfigView;
}): {
  blocked: boolean;
  reason: 'kill_switch' | 'update_required' | null;
} {
  if (input.config.killSwitch) {
    return { blocked: true, reason: 'kill_switch' };
  }
  if (
    input.config.updateRequired ||
    isVersionBelowMinimum(input.currentVersion, input.config.minSupportedVersion)
  ) {
    return { blocked: true, reason: 'update_required' };
  }
  return { blocked: false, reason: null };
}

export function buildUpdateNudgeDismissKey(
  surface: 'consumer_app' | 'provider_app',
  latestVersion: string,
): string {
  return `app-update-nudge:${surface}:${latestVersion.trim()}`;
}

export function isUpdateNudgeDismissed(key: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(key) === '1';
}

export const CONSUMER_DISMISS_APP_UPDATE_NUDGE_EVENT =
  'consumer:dismiss-app-update-nudge';

export function dispatchDismissConsumerAppUpdateNudge(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONSUMER_DISMISS_APP_UPDATE_NUDGE_EVENT));
}

export function dismissUpdateNudge(key: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(key, '1');
}

/** Soft prompt when a newer build exists but the current one is still supported. */
export function shouldShowUpdateNudge(input: {
  currentVersion: string;
  config: MobileAppConfigView;
  dismissKey: string;
}): boolean {
  if (input.config.killSwitch || input.config.updateRequired) return false;
  if (isVersionBelowMinimum(input.currentVersion, input.config.minSupportedVersion)) {
    return false;
  }
  if (!isVersionBelowMinimum(input.currentVersion, input.config.latestVersion)) {
    return false;
  }
  return !isUpdateNudgeDismissed(input.dismissKey);
}
