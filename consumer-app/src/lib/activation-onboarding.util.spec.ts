import { beforeEach, describe, expect, it } from 'vitest';
import {
  BOOK_IN_THREE_TAPS_SCENARIOS,
  FIRST_RUN_REDIRECT_SCENARIOS,
} from './activation-onboarding.fixtures.js';
import {
  buildBookInThreeTapsCopy,
  markFirstRunComplete,
  resolveActivationMilestone,
  resolveFirstRunWelcomeRedirect,
  shouldShowBookInThreeTapsHero,
} from './activation-onboarding.util.js';

describe('activation-onboarding.util', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(FIRST_RUN_REDIRECT_SCENARIOS)(
    'resolveFirstRunWelcomeRedirect $id',
    ({ deferredLink, quickReturnSlugs, expectedPath, reason }) => {
      const redirect = resolveFirstRunWelcomeRedirect({ deferredLink, quickReturnSlugs });
      if (!expectedPath) {
        expect(redirect).toBeNull();
        return;
      }
      expect(redirect?.path).toBe(expectedPath);
      expect(redirect?.reason).toBe(reason);
    },
  );

  it.each(BOOK_IN_THREE_TAPS_SCENARIOS)(
    'shouldShowBookInThreeTapsHero $id',
    ({ firstRunComplete, onboardingVariant, expected }) => {
      if (firstRunComplete) markFirstRunComplete();
      expect(shouldShowBookInThreeTapsHero({ onboardingVariant })).toBe(expected);
    },
  );

  it('builds book-in-3-taps copy', () => {
    expect(buildBookInThreeTapsCopy()).toMatchObject({
      headline: 'Book in 3 taps',
      steps: ['Pick a salon', 'Choose a service', 'Confirm your time'],
    });
  });

  it('resolves activation milestones', () => {
    localStorage.setItem('consumer_completed_booking_count', '1');
    expect(resolveActivationMilestone()).toBe('activated');
  });

  it('does not redirect after first run is complete', () => {
    markFirstRunComplete();
    expect(
      resolveFirstRunWelcomeRedirect({
        deferredLink: { slug: 'salon-a', capturedAt: '2026-06-08T00:00:00.000Z' },
        quickReturnSlugs: ['salon-a'],
      }),
    ).toBeNull();
  });
});
