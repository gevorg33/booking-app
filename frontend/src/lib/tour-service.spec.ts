import { describe, expect, it } from 'vitest';
import {
  formatTourDifficulty,
  isDayLevelTourService,
  isPublicTourService,
  tourPriceLabel,
} from './tour-service';

describe('tour-service', () => {
  it('detects public tour services', () => {
    expect(isPublicTourService({ isTour: true })).toBe(true);
    expect(isPublicTourService({ isTour: false })).toBe(false);
  });

  it('detects day-level tour booking', () => {
    expect(
      isDayLevelTourService({
        durationMinutes: 1440,
        isTour: true,
      }),
    ).toBe(true);
    expect(
      isDayLevelTourService({
        durationMinutes: 480,
        isTour: true,
        durationDays: 2,
      }),
    ).toBe(true);
    expect(
      isDayLevelTourService({
        durationMinutes: 60,
        isTour: true,
      }),
    ).toBe(false);
  });

  it('formats difficulty and per-person price labels', () => {
    const t = (key: string) =>
      key === 'tours.difficulty.easy' ? 'Easy' : key;
    expect(formatTourDifficulty('easy', t)).toBe('Easy');
    expect(formatTourDifficulty(undefined, t)).toBeNull();
    expect(
      tourPriceLabel(
        '$85',
        { pricePerPerson: true },
        (key, params) =>
          key === 'tours.pricePerPerson'
            ? `${(params as { price?: string })?.price ?? ''} / person`
            : key,
      ),
    ).toBe('$85 / person');
    expect(tourPriceLabel('$85', {}, (k) => k)).toBe('$85');
  });

  it('honors dayLevelBooking flag', () => {
    expect(
      isDayLevelTourService({
        durationMinutes: 60,
        isTour: false,
        dayLevelBooking: true,
      }),
    ).toBe(true);
    expect(
      isDayLevelTourService({
        durationMinutes: 480,
        isTour: true,
        durationDays: 1,
      }),
    ).toBe(true);
  });

  it('falls back to raw difficulty when translation missing', () => {
    expect(formatTourDifficulty('moderate', (key) => key)).toBe('moderate');
  });

  it('returns false for non-tour day-level checks', () => {
    expect(
      isDayLevelTourService({
        durationMinutes: 1440,
        isTour: false,
      }),
    ).toBe(false);
  });
});
