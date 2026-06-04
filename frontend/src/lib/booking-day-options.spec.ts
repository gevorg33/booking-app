import { describe, it, expect } from 'vitest';
import { buildBookingDayOptions, BOOKING_DAY_SCAN_DAYS } from './booking-day-options';

describe('buildBookingDayOptions', () => {
  it('builds scanDays entries with localized parts', () => {
    const options = buildBookingDayOptions('UTC', 3, 'hy');
    expect(options).toHaveLength(3);
    expect(options[0].dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(options[0].weekday).toBeTruthy();
    expect(options[0].dayNum).toBeTruthy();
    expect(options[0].month).toBeTruthy();
    expect(options[0].isToday).toBe(true);
    expect(options[1].isToday).toBe(false);
  });

  it('defaults scan window to BOOKING_DAY_SCAN_DAYS', () => {
    const options = buildBookingDayOptions('UTC');
    expect(options).toHaveLength(BOOKING_DAY_SCAN_DAYS);
  });

  it('formats weekdays in English when locale omitted', () => {
    const options = buildBookingDayOptions('UTC', 1);
    expect(options[0].weekday).toMatch(/^[A-Za-z]/);
  });

  it('formats strip parts in Russian when locale is ru', () => {
    const options = buildBookingDayOptions('UTC', 1, 'ru');
    expect(options[0].month).toMatch(/июн|янв|фев|мар|апр|мая|июл|авг|сен|окт|ноя|дек/i);
  });
});
