import type { RecentSalon } from './recent-salons.js';

export const REMEMBER_SALON_SCENARIOS = [
  {
    id: 'visit-only',
    entry: { slug: 'salon-a', name: 'Salon A' },
    booked: false,
  },
  {
    id: 'booked',
    entry: { slug: 'salon-b', name: 'Salon B', logoUrl: 'https://cdn/logo.png' },
    booked: true,
  },
] as const;

export const WELCOME_SECTION_SCENARIOS = [
  {
    id: 'saved-and-recent',
    salons: [
      { slug: 'saved', name: 'Saved Salon', visitedAt: '2026-06-01T10:00:00.000Z', lastBookedAt: '2026-06-05T10:00:00.000Z' },
      { slug: 'recent', name: 'Recent Salon', visitedAt: '2026-06-04T10:00:00.000Z' },
    ],
    pinned: ['saved'],
    quickReturnSlugs: ['saved', 'recent'],
    savedSlugs: ['saved'],
    recentSlugs: ['recent'],
  },
  {
    id: 'booked-ranks-first',
    salons: [
      { slug: 'old-visit', name: 'Old', visitedAt: '2026-06-06T10:00:00.000Z' },
      { slug: 'booked', name: 'Booked', visitedAt: '2026-06-01T10:00:00.000Z', lastBookedAt: '2026-06-06T09:00:00.000Z' },
    ],
    pinned: [],
    quickReturnSlugs: ['old-visit', 'booked'],
    savedSlugs: [],
    recentSlugs: ['old-visit', 'booked'],
  },
  {
    id: 'e2e-bug.21-pinned-survives-recent-cap',
    salons: [
      { slug: 'old-pinned', name: 'Pinned', visitedAt: '2026-01-01T10:00:00.000Z' },
      ...Array.from({ length: 8 }, (_, index) => ({
        slug: `r${index}`,
        name: `Recent ${index}`,
        visitedAt: `2026-06-0${Math.min(index + 1, 8)}T10:00:00.000Z`,
      })),
    ],
    pinned: ['old-pinned'],
    // Pinned stays first even though 8 newer visits would have pushed it off a recency-only cap.
    quickReturnSlugs: [
      'old-pinned',
      'r7',
      'r6',
      'r5',
      'r4',
      'r3',
      'r2',
      'r1',
      'r0',
    ],
    savedSlugs: ['old-pinned'],
    recentSlugs: ['r7', 'r6', 'r5', 'r4', 'r3', 'r2', 'r1', 'r0'],
  },
] as const;

export const RECENCY_SUBTITLE_SCENARIOS = [
  {
    id: 'booked-today',
    salon: {
      slug: 'a',
      name: 'A',
      visitedAt: '2026-06-01T00:00:00.000Z',
      lastBookedAt: '2026-06-08T12:00:00.000Z',
    },
    now: '2026-06-08T14:00:00.000Z',
    expected: 'Booked today',
  },
  {
    id: 'visited-yesterday',
    salon: { slug: 'b', name: 'B', visitedAt: '2026-06-07T12:00:00.000Z' },
    now: '2026-06-08T14:00:00.000Z',
    expected: 'Visited yesterday',
  },
] as const;

export type FixtureRecentSalon = RecentSalon;
