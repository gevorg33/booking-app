import { describe, expect, it } from 'vitest';
import {
  formatTourDifficulty,
  isDayLevelTourService,
  isPublicTourService,
  isTourVerticalBusinessType,
  tourPriceLabel,
} from './tour-service.util.js';

describe('tour-service.util', () => {
  it('detects public tour services', () => {
    expect(isPublicTourService({ isTour: true })).toBe(true);
    expect(isPublicTourService({ isTour: false })).toBe(false);
  });

  it('detects tour vertical business types', () => {
    expect(isTourVerticalBusinessType('tour_operator')).toBe(true);
    expect(isTourVerticalBusinessType('clinic')).toBe(false);
    expect(isTourVerticalBusinessType(null)).toBe(false);
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
    const t = (key: string) => (key === 'tourDifficultyEasy' ? 'Easy' : key);
    expect(formatTourDifficulty('easy', t)).toBe('Easy');
    expect(formatTourDifficulty(undefined, t)).toBeNull();
    expect(
      tourPriceLabel(
        '$85',
        { pricePerPerson: true },
        (key, params) =>
          key === 'tourPricePerPerson'
            ? `${(params as { price?: string })?.price ?? ''} / person`
            : key,
      ),
    ).toBe('$85 / person');
    expect(tourPriceLabel('$85', {}, (k) => k)).toBe('$85');
  });
});
