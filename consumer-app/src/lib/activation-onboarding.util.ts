import type { DeferredInstallLink } from './deferred-install-link.util.js';
import { buildSalonPath } from './deep-link.js';
import { resolveDeferredNavigationPath } from './deferred-install-link.util.js';
import { getCompletedBookingCount } from './store-review-prompt.util.js';

const FIRST_RUN_KEY = 'consumer_activation_first_run_complete';

export type FirstRunRedirectReason = 'deferred_link' | 'single_recent_salon';

export interface FirstRunWelcomeRedirect {
  path: string;
  reason: FirstRunRedirectReason;
}

export function hasCompletedFirstRun(): boolean {
  return localStorage?.getItem(FIRST_RUN_KEY) === '1';
}

export function markFirstRunComplete(): void {
  localStorage?.setItem(FIRST_RUN_KEY, '1');
}

export function shouldShowBookInThreeTapsHero(options?: {
  onboardingVariant?: 'control' | 'guided';
}): boolean {
  if (hasCompletedFirstRun()) return false;
  if (options?.onboardingVariant === 'control') return false;
  return true;
}

export function resolveFirstRunWelcomeRedirect(input: {
  deferredLink?: DeferredInstallLink | null;
  quickReturnSlugs?: string[];
}): FirstRunWelcomeRedirect | null {
  if (hasCompletedFirstRun()) return null;

  if (input.deferredLink?.slug) {
    return {
      path: resolveDeferredNavigationPath(input.deferredLink),
      reason: 'deferred_link',
    };
  }

  const quickReturn = (input.quickReturnSlugs ?? []).filter(Boolean);
  if (quickReturn.length === 1) {
    return {
      path: buildSalonPath(quickReturn[0]!),
      reason: 'single_recent_salon',
    };
  }

  return null;
}

export function buildBookInThreeTapsCopy(): { headline: string; steps: string[] } {
  return {
    headline: 'Book in 3 taps',
    steps: ['Pick a salon', 'Choose a service', 'Confirm your time'],
  };
}

export function resolveActivationMilestone(): 'new_install' | 'returning' | 'activated' {
  const completed = getCompletedBookingCount();
  if (completed > 0) return 'activated';
  if (hasCompletedFirstRun()) return 'returning';
  return 'new_install';
}
