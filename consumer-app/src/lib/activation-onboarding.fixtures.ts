import type { DeferredInstallLink } from './deferred-install-link.util.js';

export const FIRST_RUN_REDIRECT_SCENARIOS = [
  {
    id: 'deferred-service-link',
    deferredLink: { slug: 'glow-nails', serviceId: 'svc-1', capturedAt: '2026-06-08T00:00:00.000Z' },
    quickReturnSlugs: ['other-salon'],
    expectedPath: '/s/glow-nails/book/svc-1',
    reason: 'deferred_link' as const,
  },
  {
    id: 'deferred-service-slot-link',
    deferredLink: {
      slug: 'glow-nails',
      serviceId: 'svc-1',
      date: '2026-06-10',
      slot: '2026-06-10T14:00:00.000Z',
      capturedAt: '2026-06-08T00:00:00.000Z',
    },
    quickReturnSlugs: ['other-salon'],
    expectedPath:
      '/s/glow-nails/book/svc-1?date=2026-06-10&slot=2026-06-10T14%3A00%3A00.000Z&deferredResume=1',
    reason: 'deferred_link' as const,
  },
  {
    id: 'deferred-salon-only',
    deferredLink: { slug: 'glow-nails', capturedAt: '2026-06-08T00:00:00.000Z' },
    quickReturnSlugs: [],
    expectedPath: '/s/glow-nails',
    reason: 'deferred_link' as const,
  },
  {
    id: 'single-recent-salon',
    deferredLink: null as DeferredInstallLink | null,
    quickReturnSlugs: ['booked-salon'],
    expectedPath: '/s/booked-salon',
    reason: 'single_recent_salon' as const,
  },
  {
    id: 'multiple-recent-stay',
    deferredLink: null,
    quickReturnSlugs: ['salon-a', 'salon-b'],
    expectedPath: null,
    reason: null,
  },
  {
    id: 'empty-stay-on-welcome',
    deferredLink: null,
    quickReturnSlugs: [],
    expectedPath: null,
    reason: null,
  },
] as const;

export const BOOK_IN_THREE_TAPS_SCENARIOS = [
  {
    id: 'guided-first-run',
    firstRunComplete: false,
    onboardingVariant: 'guided' as const,
    expected: true,
  },
  {
    id: 'control-hidden',
    firstRunComplete: false,
    onboardingVariant: 'control' as const,
    expected: false,
  },
  {
    id: 'completed-first-run-hidden',
    firstRunComplete: true,
    onboardingVariant: 'guided' as const,
    expected: false,
  },
] as const;
