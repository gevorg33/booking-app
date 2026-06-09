import { describe, expect, it, beforeEach } from 'vitest';
import type { PublicService } from './types.js';
import {
  clampTourPaxCount,
  formatRemainingTourSpots,
  formatTourLineTotalCopy,
  formatTourSlotLabel,
  multiplyTourPrice,
  resolveTourFallbackSubtotal,
  resolveTourMaxPax,
} from './tour-booking.util.js';
import { setActiveBusinessDateFormats } from './business-date-format.js';

const cityTour: PublicService = {
  id: 'tour-1',
  name: 'City Tour',
  durationMinutes: 480,
  price: 85,
  isTour: true,
  pricePerPerson: true,
  maxGroupSize: 12,
};

const copy = {
  tourLineTotal: '{unit} × {count} = {total}',
  tourPerPersonSuffix: 'per person',
  tourRemainingSpots: '{count} spots left',
};

describe('tour-booking.util', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
  });

  it('resolves max pax and clamps group size', () => {
    expect(resolveTourMaxPax(cityTour)).toBe(12);
    expect(resolveTourMaxPax({ maxGroupSize: 0 } as PublicService)).toBe(99);
    expect(clampTourPaxCount(20, cityTour.maxGroupSize)).toBe(12);
    expect(clampTourPaxCount(0, cityTour.maxGroupSize)).toBe(1);
  });

  it('multiplies tour pricing by pax', () => {
    expect(multiplyTourPrice(85, 3, true)).toBe(255);
    expect(multiplyTourPrice(85, 3, false)).toBe(85);
    expect(resolveTourFallbackSubtotal(cityTour, 3)).toBe(255);
  });

  it('formats line total copy', () => {
    expect(
      formatTourLineTotalCopy(copy, {
        unitLabel: '$85',
        paxCount: 3,
        totalLabel: '$255',
        pricePerPerson: true,
      }),
    ).toBe('$85 × 3 = $255 per person');
    expect(
      formatTourLineTotalCopy(copy, {
        unitLabel: '$85',
        paxCount: 1,
        totalLabel: '$85',
        pricePerPerson: true,
      }),
    ).toBe('$85 per person');
  });

  it('formats day-level slot labels and remaining spots', () => {
    setActiveBusinessDateFormats('DD/MM/YYYY', '24h');
    expect(formatTourSlotLabel('2026-06-15T09:00:00.000Z', cityTour, 'en-US')).toBe(
      '09:00',
    );
    expect(
      formatTourSlotLabel('2026-06-15T09:00:00.000Z', {
        ...cityTour,
        dayLevelBooking: true,
        durationDays: 3,
      }, 'en-US'),
    ).toMatch(/Jun/);
    expect(formatRemainingTourSpots(copy, 4)).toBe('4 spots left');
    expect(formatRemainingTourSpots(copy, null)).toBeNull();
  });
});
