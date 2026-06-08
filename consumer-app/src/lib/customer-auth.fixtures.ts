import type { RecentSalon } from './recent-salons.js';

export const REMEMBERED_TENANT_SCENARIOS = [
  {
    id: 'active-session-first',
    activeSlug: 'salon-a',
    sessions: [
      { slug: 'salon-a', token: 'tok-a', profileName: 'Alex at A' },
      { slug: 'salon-b', token: 'tok-b', profileName: 'Alex at B' },
    ],
    recent: [
      {
        slug: 'salon-b',
        name: 'Salon B',
        visitedAt: '2026-06-07T10:00:00.000Z',
        lastBookedAt: '2026-06-07T11:00:00.000Z',
      },
      {
        slug: 'salon-a',
        name: 'Salon A',
        visitedAt: '2026-06-06T10:00:00.000Z',
      },
    ] satisfies RecentSalon[],
    storedLocales: { 'salon-a': 'hy', 'salon-b': 'en' } as Record<string, string>,
    expectedOrder: ['salon-a', 'salon-b'],
    expectedActive: 'salon-a',
  },
  {
    id: 'signed-in-before-visit-only',
    activeSlug: null,
    sessions: [{ slug: 'signed-in', token: 'tok', profileName: 'Sam' }],
    recent: [
      {
        slug: 'visited-only',
        name: 'Visited Only',
        visitedAt: '2026-06-08T10:00:00.000Z',
      },
      {
        slug: 'signed-in',
        name: 'Signed In Salon',
        visitedAt: '2026-06-01T10:00:00.000Z',
      },
    ] satisfies RecentSalon[],
    storedLocales: {},
    expectedOrder: ['signed-in', 'visited-only'],
    expectedActive: null,
  },
] as const;
