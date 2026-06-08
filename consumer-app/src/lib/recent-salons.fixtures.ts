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
