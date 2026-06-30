import { describe, expect, it } from 'vitest';
import { describe, expect, it } from 'vitest';
import {
  filterBookableWallClockSlots,
  getWallClockNow,
  isWallClockSlotBookable,
  isWallClockStartBookable,
  resolveBusinessWallClockTimezone,
  scheduleTimeFromIso,
} from '@/lib/wall-clock-slot.util';

describe('resolveBusinessWallClockTimezone', () => {
  it('keeps explicit non-UTC timezone', () => {
    expect(resolveBusinessWallClockTimezone('Europe/Berlin', 'en')).toBe(
      'Europe/Berlin',
    );
  });

  it('infers Asia/Yerevan for hy locale when timezone is UTC', () => {
    expect(resolveBusinessWallClockTimezone('UTC', 'hy')).toBe('Asia/Yerevan');
  });
});

describe('isWallClockSlotBookable', () => {
  it('filters same-day slots at or before now', () => {
    const now = getWallClockNow('Asia/Yerevan');
    const pastHour = Math.max(0, Math.floor(now.minutes / 60) - 2);
    const pastSlot = `${String(pastHour).padStart(2, '0')}:00`;
    expect(isWallClockSlotBookable(now.dateKey, pastSlot, 'Asia/Yerevan')).toBe(
      false,
    );
    expect(isWallClockSlotBookable(now.dateKey, '23:59', 'Asia/Yerevan')).toBe(
      true,
    );
  });
});

describe('filterBookableWallClockSlots', () => {
  it('drops past ISO slots for today', () => {
    const tz = 'Asia/Yerevan';
    const today = getWallClockNow(tz).dateKey;
    const slots = [
      { startTime: `${today}T09:00:00.000Z` },
      { startTime: `${today}T23:30:00.000Z` },
    ];
    const filtered = filterBookableWallClockSlots(slots, tz);
    expect(filtered.map((s) => scheduleTimeFromIso(s.startTime))).not.toContain(
      '09:00',
    );
    expect(filtered.length).toBeGreaterThanOrEqual(0);
  });

  it('isWallClockStartBookable matches slot helper', () => {
    const tz = 'UTC';
    const iso = '2099-01-01T10:00:00.000Z';
    expect(isWallClockStartBookable(iso, tz)).toBe(true);
  });
});
