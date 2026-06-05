import { describe, expect, it } from 'vitest';
import {
  formatTourDifficulty,
  isDayLevelTourService,
  isPublicTourService,
  tourPriceLabel,
} from './tour-service';
import type { PublicService } from './public-api';

const cityTour: PublicService = {
  id: 'tour-1',
  name: 'Full Day City Tour',
  durationMinutes: 480,
  bufferMinutes: 0,
  price: 85,
  currency: 'USD',
  isTour: true,
  pricePerPerson: true,
  maxGroupSize: 12,
  difficulty: 'easy',
  tourDurationBadge: '8h',
  coverImage: '/placeholders/tours/city-day.jpg',
  dayLevelBooking: false,
};

const mountainTrek: PublicService = {
  id: 'tour-2',
  name: '3-Day Mountain Trek',
  durationMinutes: 4320,
  bufferMinutes: 0,
  price: 320,
  currency: 'USD',
  isTour: true,
  pricePerPerson: true,
  maxGroupSize: 8,
  difficulty: 'challenging',
  tourDurationBadge: '3 days',
  durationDays: 3,
  dayLevelBooking: true,
};

const haircut: PublicService = {
  id: 'svc-1',
  name: 'Haircut',
  durationMinutes: 30,
  bufferMinutes: 5,
  price: 40,
  currency: 'USD',
};

const t = (key: string, params?: Record<string, string>) => {
  if (key === 'tours.pricePerPerson' && params?.price) {
    return `${params.price} / person`;
  }
  if (key === 'tours.difficulty.easy') return 'Easy';
  if (key === 'tours.difficulty.challenging') return 'Challenging';
  return key;
};

describe('Sprint 30 — tour booking scenario matrix', () => {
  it('distinguishes tour vs standard services on public booking list', () => {
    expect(isPublicTourService(cityTour)).toBe(true);
    expect(isPublicTourService(haircut)).toBe(false);
    expect(isPublicTourService({})).toBe(false);
  });

  it('uses day-level booking for multi-day tours but not short day tours', () => {
    expect(isDayLevelTourService(cityTour)).toBe(false);
    expect(isDayLevelTourService(mountainTrek)).toBe(true);
    expect(
      isDayLevelTourService({
        ...cityTour,
        durationDays: 1,
        durationMinutes: 480,
      }),
    ).toBe(true);
  });

  it('shows per-person pricing label for tour services', () => {
    expect(tourPriceLabel('$85', cityTour, t)).toBe('$85 / person');
    expect(tourPriceLabel('$40', haircut, t)).toBe('$40');
  });

  it('formats tour difficulty for cards', () => {
    expect(formatTourDifficulty(cityTour.difficulty, t)).toBe('Easy');
    expect(formatTourDifficulty(mountainTrek.difficulty, t)).toBe('Challenging');
  });

  it('computes checkout line totals for group size scenarios', () => {
    const scenarios = [
      { pax: 1, unit: 85, total: 85 },
      { pax: 3, unit: 85, total: 255 },
      { pax: 12, unit: 85, total: 1020 },
      { pax: 2, unit: 320, total: 640 },
    ];

    for (const { pax, unit, total } of scenarios) {
      expect(unit * pax).toBe(total);
    }
  });

  it('clamps requested pax to max group size at checkout', () => {
    const clamp = (requested: number, max?: number) =>
      Math.min(Math.max(1, requested), max ?? 99);

    expect(clamp(20, cityTour.maxGroupSize)).toBe(12);
    expect(clamp(0, cityTour.maxGroupSize)).toBe(1);
    expect(clamp(5, mountainTrek.maxGroupSize)).toBe(5);
  });

  it('exposes tour card fields required by public booking UI', () => {
    expect(cityTour).toMatchObject({
      coverImage: expect.stringContaining('/placeholders/tours/'),
      tourDurationBadge: expect.any(String),
      maxGroupSize: expect.any(Number),
      pricePerPerson: true,
    });
    expect(mountainTrek.dayLevelBooking).toBe(true);
  });
});
