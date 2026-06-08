import { beforeEach, describe, expect, it } from 'vitest';
import {
  assignOnboardingVariant,
  resolveOnboardingVariant,
  shouldShowGuidedOnboardingHero,
} from './onboarding-variant.util.js';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    },
  });
}

describe('onboarding-variant.util', () => {
  beforeEach(() => {
    installLocalStorageMock();
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
