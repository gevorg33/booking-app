import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { PublicBusinessProfile, PublicService } from '@/lib/public-api';
import {
  extractPublicServiceCategoryTeasers,
  hasHomeLandingTeaserContent,
} from './home-landing-teaser.util';
import { HomeLandingTeaser } from '@/components/public-booking/home-landing-teaser';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => createElement('a', { href, ...rest }, children),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'public.hours': 'Hours',
        'public.serviceCategories': 'Service categories',
        'public.seeProfile': 'See profile',
        'public.homeLandingTeaserLabel': 'Salon hours and service categories',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('@/lib/tenant-host', () => ({
  bookPath: (slug: string, path = '') => `/book/${slug}${path}`,
}));

function service(
  id: string,
  category: { id: string; name: string; sortOrder: number } | null,
): PublicService {
  return {
    id,
    name: `Service ${id}`,
    durationMinutes: 60,
    bufferMinutes: 0,
    price: 50,
    currency: 'USD',
    category,
  };
}

const baseTenant = {
  slug: 'demo-salon',
  name: 'Demo Salon',
  branding: { primaryColor: '#ff00dd' },
  openingHours: {
    days: [],
    summaryLines: ['Mon–Sat 09:00–18:00', 'Sun Closed'],
  },
} as unknown as PublicBusinessProfile;

describe('home-landing-teaser.util (e2e-bug.207)', () => {
  it('extracts unique categories sorted by sortOrder then name', () => {
    const teasers = extractPublicServiceCategoryTeasers([
      service('s1', { id: 'c2', name: 'Massage', sortOrder: 2 }),
      service('s2', { id: 'c1', name: 'Hair Care', sortOrder: 1 }),
      service('s3', { id: 'c2', name: 'Massage', sortOrder: 2 }),
      service('s4', { id: 'c3', name: 'Face Care', sortOrder: 1 }),
      service('s5', null),
    ]);
    expect(teasers.map((c) => c.name)).toEqual([
      'Face Care',
      'Hair Care',
      'Massage',
    ]);
  });

  it('respects limit and skips blank category names', () => {
    const teasers = extractPublicServiceCategoryTeasers(
      [
        service('s1', { id: 'c1', name: 'A', sortOrder: 1 }),
        service('s2', { id: 'c2', name: '   ', sortOrder: 2 }),
        service('s3', { id: 'c3', name: 'B', sortOrder: 3 }),
        service('s4', { id: 'c4', name: 'C', sortOrder: 4 }),
      ],
      2,
    );
    expect(teasers.map((c) => c.name)).toEqual(['A', 'B']);
  });

  it('returns empty for empty catalog', () => {
    expect(extractPublicServiceCategoryTeasers([])).toEqual([]);
  });

  it.each([
    {
      id: 'hours-only',
      input: { summaryLines: ['Mon–Sat 09:00–18:00'], categories: [] },
      expected: true,
    },
    {
      id: 'categories-only',
      input: {
        summaryLines: [],
        categories: [{ id: '1', name: 'Massage', sortOrder: 1 }],
      },
      expected: true,
    },
    {
      id: 'blank-hours-no-categories',
      input: { summaryLines: ['  ', ''], categories: [] },
      expected: false,
    },
    {
      id: 'empty',
      input: { summaryLines: null, categories: null },
      expected: false,
    },
  ] as const)('hasHomeLandingTeaserContent $id → $expected', ({ input, expected }) => {
    expect(hasHomeLandingTeaserContent(input)).toBe(expected);
  });

  it('HomeLandingTeaser renders hours and category chips', () => {
    const html = renderToString(
      createElement(HomeLandingTeaser, {
        slug: 'demo-salon',
        tenant: baseTenant,
        categories: [
          { id: 'c1', name: 'Massage', sortOrder: 1 },
          { id: 'c2', name: 'Hair Care', sortOrder: 2 },
        ],
      }),
    );
    expect(html).toContain('data-testid="home-landing-teaser"');
    expect(html).toContain('Mon–Sat 09:00–18:00');
    expect(html).toContain('Sun Closed');
    expect(html).toContain('Massage');
    expect(html).toContain('Hair Care');
    expect(html).toContain('/book/demo-salon/profile');
    expect(html).toContain('/book/demo-salon/services?category=');
  });

  it('HomeLandingTeaser returns null with no hours or categories', () => {
    const html = renderToString(
      createElement(HomeLandingTeaser, {
        slug: 'demo-salon',
        tenant: {
          ...baseTenant,
          openingHours: { days: [], summaryLines: [] },
        } as PublicBusinessProfile,
        categories: [],
      }),
    );
    expect(html).toBe('');
  });

  it('HomeLandingTeaser renders categories-only when hours missing', () => {
    const html = renderToString(
      createElement(HomeLandingTeaser, {
        slug: 'demo-salon',
        tenant: {
          ...baseTenant,
          openingHours: undefined,
        } as PublicBusinessProfile,
        categories: [{ id: 'c1', name: 'Face Care', sortOrder: 1 }],
      }),
    );
    expect(html).toContain('Face Care');
    expect(html).not.toContain('Mon–Sat');
  });
});
