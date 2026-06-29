import { describe, expect, it } from 'vitest';
import {
  groupSlotsByTimeOfDay,
  resolveBookingTimeOfDayGroup,
} from './booking-slot-groups.util';

describe('resolveBookingTimeOfDayGroup', () => {
  it('groups before 12:00 as morning', () => {
    expect(resolveBookingTimeOfDayGroup('2026-06-10T11:59:00.000Z')).toBe('morning');
  });

  it('groups 12:00 through 16:59 as afternoon', () => {
    expect(resolveBookingTimeOfDayGroup('2026-06-10T12:00:00.000Z')).toBe('afternoon');
    expect(resolveBookingTimeOfDayGroup('2026-06-10T16:59:00.000Z')).toBe('afternoon');
  });

  it('groups 17:00 and later as evening', () => {
    expect(resolveBookingTimeOfDayGroup('2026-06-10T17:00:00.000Z')).toBe('evening');
  });
});

describe('groupSlotsByTimeOfDay', () => {
  it('returns only non-empty groups in morning → afternoon → evening order', () => {
    expect(
      groupSlotsByTimeOfDay([
        { startTime: '2026-06-10T09:00:00.000Z' },
        { startTime: '2026-06-10T14:00:00.000Z' },
        { startTime: '2026-06-10T17:30:00.000Z' },
      ]).map((entry) => entry.group),
    ).toEqual(['morning', 'afternoon', 'evening']);
  });
});
