import { beforeEach, describe, expect, it } from 'vitest';
import {
  ABANDONED_STEP_SCENARIOS,
  RESUMABLE_DRAFT_SCENARIOS,
} from './activation-instrumentation.fixtures.js';
import {
  buildBookingAbandonmentProps,
  buildBookingResumeEventProps,
  enrichActivationEventProps,
  peekResumableBookingDraft,
  readOnboardingVariantForAnalytics,
} from './activation-instrumentation.util.js';
import {
  hasResumableBookingProgress,
  resolveAbandonedStepFromDraft,
  saveBookingDraft,
} from './booking-draft.util.js';
import { persistOnboardingVariant } from './onboarding-variant.util.js';

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

describe('activation-instrumentation.util', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  it.each(ABANDONED_STEP_SCENARIOS)(
    'resolveAbandonedStepFromDraft $id',
    ({ draft, expected }) => {
      expect(resolveAbandonedStepFromDraft(draft)).toBe(expected);
    },
  );

  it.each(RESUMABLE_DRAFT_SCENARIOS)(
    'hasResumableBookingProgress $id',
    ({ draft, expected }) => {
      expect(hasResumableBookingProgress(draft)).toBe(expected);
    },
  );

  it('enriches analytics props with stored onboarding variant', () => {
    persistOnboardingVariant('guided');
    expect(enrichActivationEventProps({ serviceId: 'svc-1' })).toEqual({
      serviceId: 'svc-1',
      onboardingVariant: 'guided',
    });
    expect(readOnboardingVariantForAnalytics()).toBe('guided');
  });

  it('builds booking resume and abandonment props', () => {
    persistOnboardingVariant('control');
    const draft = {
      slug: 'salon-a',
      serviceId: 'svc-1',
      slot: '2026-06-10T09:00:00.000Z',
      updatedAt: '2026-06-08T12:00:00.000Z',
    };
    expect(buildBookingResumeEventProps(draft)).toEqual({
      serviceId: 'svc-1',
      abandonedStep: 'confirm',
      onboardingVariant: 'control',
    });
    expect(
      buildBookingAbandonmentProps({ serviceId: 'svc-1', abandonedStep: 'slot' }),
    ).toMatchObject({
      serviceId: 'svc-1',
      abandonedStep: 'slot',
      onboardingVariant: 'control',
    });
  });

  it('peeks resumable booking drafts', () => {
    saveBookingDraft({
      slug: 'salon-a',
      serviceId: 'svc-1',
      date: '2026-06-10',
    });
    expect(peekResumableBookingDraft()?.serviceId).toBe('svc-1');
  });
});
