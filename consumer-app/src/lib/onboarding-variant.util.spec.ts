import { beforeEach, describe, expect, it } from 'vitest';
import {
  assignOnboardingVariant,
  resolveOnboardingVariant,
  shouldShowGuidedOnboardingHero,
} from './onboarding-variant.util.js';

describe('onboarding-variant.util', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('assigns stable variants from anon id', () => {
    expect(assignOnboardingVariant('anon-abc0')).toBe('control');
    expect(assignOnboardingVariant('anon-abc1')).toBe('guided');
  });

  it('persists resolved variant', () => {
    const variant = resolveOnboardingVariant('anon-test1');
    expect(variant).toBe('guided');
    expect(resolveOnboardingVariant('anon-other')).toBe('guided');
    expect(shouldShowGuidedOnboardingHero('guided')).toBe(true);
  });
});
