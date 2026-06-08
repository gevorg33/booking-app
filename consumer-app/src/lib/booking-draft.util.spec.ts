import { beforeEach, describe, expect, it } from 'vitest';
import { BOOKING_DRAFT_SCENARIOS } from './booking-draft.fixtures.js';
import {
  ABANDONED_STEP_SCENARIOS,
} from './activation-instrumentation.fixtures.js';
import {
  buildBookingDraftResumePath,
  clearBookingDraft,
  hasResumableBookingProgress,
  isBookingDraftResumePath,
  isBookingDraftStale,
  loadBookingDraft,
  resolveAbandonedStepFromDraft,
  saveBookingDraft,
} from './booking-draft.util.js';

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

describe('booking-draft.util', () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearBookingDraft();
  });

  it.each(BOOKING_DRAFT_SCENARIOS)(
    'buildBookingDraftResumePath $id',
    ({ draft, expectedPath, stale }) => {
      expect(buildBookingDraftResumePath(draft)).toBe(expectedPath);
      expect(isBookingDraftStale(draft, new Date('2026-06-08T12:00:00.000Z'))).toBe(stale);
    },
  );

  it('persists and loads booking drafts', () => {
    saveBookingDraft({ slug: 'salon-a', serviceId: 'svc-1', date: '2026-06-10' });
    expect(loadBookingDraft()?.slug).toBe('salon-a');
    clearBookingDraft();
    expect(loadBookingDraft()).toBeNull();
  });

  it('returns null for invalid stored drafts', () => {
    localStorage.setItem('consumer_booking_draft', '{bad-json');
    expect(loadBookingDraft()).toBeNull();
  });

  it.each(ABANDONED_STEP_SCENARIOS)(
    'resolveAbandonedStepFromDraft $id',
    ({ draft, expected }) => {
      expect(resolveAbandonedStepFromDraft(draft)).toBe(expected);
    },
  );

  it('detects resume path for the active draft', () => {
    const draft = {
      slug: 'salon-a',
      serviceId: 'svc-1',
      updatedAt: '2026-06-08T12:00:00.000Z',
    };
    expect(isBookingDraftResumePath('/s/salon-a/book/svc-1?resume=1', draft)).toBe(true);
    expect(isBookingDraftResumePath('/s/salon-a/services', draft)).toBe(false);
    expect(hasResumableBookingProgress({ ...draft, date: '2026-06-10' })).toBe(true);
  });
});
