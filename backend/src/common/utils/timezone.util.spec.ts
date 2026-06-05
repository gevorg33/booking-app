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
  resolveTimezone,
} from './timezone.util.js';

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
