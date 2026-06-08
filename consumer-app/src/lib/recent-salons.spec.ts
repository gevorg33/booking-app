import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RECENCY_SUBTITLE_SCENARIOS,
  REMEMBER_SALON_SCENARIOS,
  WELCOME_SECTION_SCENARIOS,
} from './recent-salons.fixtures.js';
import {
  buildWelcomeSalonSections,
  formatSalonRecencySubtitle,
  isSalonPinned,
  loadRecentSalons,
  loadSavedSalons,
  pinSalon,
  rememberBookedSalon,
  rememberSalon,
  sortSalonsByRecency,
  toggleSalonPin,
  unpinSalon,
} from './recent-salons.js';

describe('recent-salons', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00.000Z'));
  });

  it.each(REMEMBER_SALON_SCENARIOS)('rememberSalon $id', ({ entry, booked }) => {
    if (booked) {
      rememberBookedSalon(entry);
    } else {
      rememberSalon(entry);
    }
    const list = loadRecentSalons();
    expect(list[0]?.slug).toBe(entry.slug);
    if (booked) {
      expect(list[0]?.lastBookedAt).toBe('2026-06-08T12:00:00.000Z');
    } else {
      expect(list[0]?.lastBookedAt).toBeUndefined();
    }
  });

  it('returns empty list when storage is corrupt', () => {
    localStorage.setItem('consumer_recent_salons', 'not-json');
    expect(loadRecentSalons()).toEqual([]);
  });

  it('pins, toggles, and loads saved salons including pinned-only slug', () => {
    pinSalon('saved-only');
    expect(isSalonPinned('saved-only')).toBe(true);
    expect(loadSavedSalons()[0]?.slug).toBe('saved-only');

    rememberSalon({ slug: 'a', name: 'Salon A' });
    rememberSalon({ slug: 'b', name: 'Salon B' });
    pinSalon('a');
    expect(loadSavedSalons().map((salon) => salon.slug)).toEqual(['a', 'saved-only']);

    expect(toggleSalonPin('a')).toBe(false);
    expect(isSalonPinned('a')).toBe(false);
    unpinSalon('saved-only');
    expect(loadSavedSalons().map((salon) => salon.slug)).toEqual([]);
  });

  it.each(WELCOME_SECTION_SCENARIOS)(
    'buildWelcomeSalonSections $id',
    ({ salons, pinned, quickReturnSlugs, savedSlugs, recentSlugs }) => {
      localStorage.setItem('consumer_recent_salons', JSON.stringify(salons));
      localStorage.setItem('consumer_pinned_salons', JSON.stringify(pinned));
      const sections = buildWelcomeSalonSections(new Date('2026-06-08T12:00:00.000Z'));
      expect(sections.quickReturn.map((salon) => salon.slug)).toEqual(quickReturnSlugs);
      expect(sections.saved.map((salon) => salon.slug)).toEqual(savedSlugs);
      expect(sections.recent.map((salon) => salon.slug)).toEqual(recentSlugs);
    },
  );

  it('sortSalonsByRecency prefers lastBookedAt over visitedAt', () => {
    expect(
      sortSalonsByRecency([
        { slug: 'a', name: 'A', visitedAt: '2026-06-07T00:00:00.000Z' },
        {
          slug: 'b',
          name: 'B',
          visitedAt: '2026-06-01T00:00:00.000Z',
          lastBookedAt: '2026-06-08T00:00:00.000Z',
        },
      ]).map((salon) => salon.slug),
    ).toEqual(['b', 'a']);
  });

  it.each(RECENCY_SUBTITLE_SCENARIOS)(
    'formatSalonRecencySubtitle $id',
    ({ salon, now, expected }) => {
      expect(formatSalonRecencySubtitle(salon, new Date(now))).toBe(expected);
    },
  );
});
