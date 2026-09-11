import {
  addDaysToDateKey,
  formatZonedDateLabel,
  formatZonedTime,
  getDateKeyInTimezone,
  getUtcBoundsForDateKey,
  getWallClockNow,
  isWallClockSlotBookable,
  isWallClockStartInPast,
  pickTimezone,
  resolveBusinessWallClockTimezone,
  resolveTimezone,
} from './timezone.util.js';

/*
 * Three tests below read the *current* wall clock and assert against it, which
 * makes them fail on a clock, not on a change:
 *
 *  - `isWallClockSlotBookable respects day and notBefore` asserts that slot
 *    '23:59' today is bookable. In the final minute of the day that is
 *    `1439 > 1439` — false. Observed failing in a sweep spanning
 *    2026-09-09 23:59 UTC.
 *  - The other two are pinned for the same structural reason rather than a
 *    demonstrated failure: each reads the clock once for `dateKey` and again
 *    inside the function under test, so a midnight rollover between the two
 *    reads makes them disagree. Pinning to 00:00:00 does *not* fail them, so
 *    that window is reasoned about, not reproduced.
 *
 * Pinning to a mid-morning instant removes the window without weakening a
 * single assertion — verified by re-pinning to 23:59:30, where the first test
 * fails exactly as the sweep saw it.
 */
function pinClock() {
  jest.useFakeTimers().setSystemTime(new Date('2026-06-15T09:30:00.000Z'));
}

afterEach(() => {
  jest.useRealTimers();
});

describe('resolveTimezone', () => {
  it('defaults invalid or empty to UTC', () => {
    expect(resolveTimezone()).toBe('UTC');
    expect(resolveTimezone('')).toBe('UTC');
    expect(resolveTimezone('Not/AZone')).toBe('UTC');
  });

  it('keeps valid zones', () => {
    expect(resolveTimezone('America/New_York')).toBe('America/New_York');
  });
});

describe('pickTimezone', () => {
  it('returns first valid candidate', () => {
    expect(pickTimezone(null, '', 'Europe/Berlin')).toBe('Europe/Berlin');
    expect(pickTimezone()).toBe('UTC');
  });
});

describe('resolveBusinessWallClockTimezone', () => {
  it('keeps explicit non-UTC timezone', () => {
    expect(resolveBusinessWallClockTimezone('Europe/Berlin', 'en')).toBe(
      'Europe/Berlin',
    );
  });

  it('infers Asia/Yerevan for hy locale when timezone is UTC', () => {
    expect(resolveBusinessWallClockTimezone('UTC', 'hy')).toBe('Asia/Yerevan');
  });

  it('filters past slots with inferred timezone', () => {
    pinClock();
    const tz = resolveBusinessWallClockTimezone('UTC', 'hy');
    const now = getWallClockNow(tz);
    const pastHour = Math.max(0, Math.floor(now.minutes / 60) - 2);
    const pastSlot = `${String(pastHour).padStart(2, '0')}:00`;
    expect(isWallClockSlotBookable(now.dateKey, pastSlot, tz)).toBe(false);
  });
});

describe('date keys and bounds', () => {
  it('getDateKeyInTimezone formats YYYY-MM-DD', () => {
    const key = getDateKeyInTimezone(
      new Date('2026-06-04T18:00:00.000Z'),
      'UTC',
    );
    expect(key).toBe('2026-06-04');
  });

  it('addDaysToDateKey shifts days', () => {
    expect(addDaysToDateKey('2026-06-04', 1, 'UTC')).toBe('2026-06-05');
  });

  it('getUtcBoundsForDateKey returns start and end', () => {
    const { start, end } = getUtcBoundsForDateKey('2026-06-04', 'UTC');
    expect(start).toBeInstanceOf(Date);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });
});

describe('formatZonedDateLabel', () => {
  it('formats localized labels', () => {
    expect(formatZonedDateLabel('2026-06-04', 'UTC', 'en')).toMatch(/June/i);
    expect(formatZonedDateLabel('2026-06-04', 'UTC', 'hy')).toMatch(/հունիս/i);
    expect(formatZonedDateLabel('2026-06-04', 'UTC', 'ru')).toMatch(/июн/i);
    expect(formatZonedDateLabel('2026-06-04', 'UTC')).toMatch(/June/i);
  });
});

describe('formatZonedTime', () => {
  it('formats HH:mm in timezone', () => {
    expect(formatZonedTime('2026-06-04T15:30:00.000Z', 'UTC')).toBe('15:30');
  });
});

describe('wall clock helpers', () => {
  it('getWallClockNow returns dateKey and minutes', () => {
    const now = getWallClockNow('UTC');
    expect(now.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(now.minutes).toBeGreaterThanOrEqual(0);
  });

  it('isWallClockStartInPast compares calendar day and minutes', () => {
    pinClock();
    const past = new Date('2020-01-01T10:00:00.000Z');
    expect(isWallClockStartInPast(past, 'UTC')).toBe(true);
    const future = new Date('2099-01-01T10:00:00.000Z');
    expect(isWallClockStartInPast(future, 'UTC')).toBe(false);
    const now = getWallClockNow('UTC');
    const sameDayPastSlot = new Date(`${now.dateKey}T00:00:00.000Z`);
    sameDayPastSlot.setUTCHours(0, 0, 0, 0);
    expect(isWallClockStartInPast(sameDayPastSlot, 'UTC')).toBe(true);
  });

  it('isWallClockSlotBookable respects day and notBefore', () => {
    pinClock();
    expect(isWallClockSlotBookable('2099-01-01', '10:00', 'UTC')).toBe(true);
    expect(isWallClockSlotBookable('2020-01-01', '10:00', 'UTC')).toBe(false);
    const today = getWallClockNow('UTC').dateKey;
    expect(isWallClockSlotBookable(today, '23:59', 'UTC', '12:00')).toBe(true);
    expect(isWallClockSlotBookable('2099-06-01', '09:00', 'UTC', '10:00')).toBe(
      false,
    );
    expect(isWallClockSlotBookable('2099-06-01', '11:00', 'UTC', '10:00')).toBe(
      true,
    );
    const now = getWallClockNow('UTC');
    const pastHour = Math.max(0, Math.floor(now.minutes / 60) - 1);
    const pastSlot = `${String(pastHour).padStart(2, '0')}:00`;
    expect(isWallClockSlotBookable(now.dateKey, pastSlot, 'UTC')).toBe(false);
    expect(isWallClockSlotBookable(now.dateKey, '23:59', 'UTC', '9')).toBe(
      true,
    );
  });
});
