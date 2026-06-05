import {
  formatDateKeyAppointmentLabel,
  formatDateKeyPublicLabel,
  formatDateKeyStripParts,
  formatNearestSlotDateLabel,
  formatWeekdayShortByDayIndex,
  intlLocaleTag,
} from './locale-date.util.js';

describe('intlLocaleTag', () => {
  it('maps app locales', () => {
    expect(intlLocaleTag('en')).toBe('en-GB');
    expect(intlLocaleTag('hy')).toBe('hy-AM');
    expect(intlLocaleTag('ru')).toBe('ru-RU');
  });
});

describe('locale-date.util formatters', () => {
  const tz = 'UTC';

  it('formats date key in Armenian and Russian', () => {
    expect(formatDateKeyPublicLabel('2026-06-04', tz, 'hy')).toMatch(/հունիս/i);
    expect(formatDateKeyPublicLabel('2026-06-04', tz, 'ru')).toMatch(/июн/i);
    expect(formatDateKeyPublicLabel('2026-06-04', tz, 'en')).toMatch(/June/i);
  });

  it('formats appointment label with weekday and month', () => {
    const label = formatDateKeyAppointmentLabel('2026-06-04', tz, 'hy');
    expect(label).toMatch(/հունիս/i);
    expect(label).toMatch(/հինգ/i);
  });

  it('formats weekday short by day index in all locales', () => {
    expect(formatWeekdayShortByDayIndex(0, 'en')).toMatch(/Sun/i);
    expect(formatWeekdayShortByDayIndex(4, 'hy')).toMatch(/հնգ/i);
    expect(formatWeekdayShortByDayIndex(6, 'ru')).toBeTruthy();
  });

  it('formats strip parts for booking day picker', () => {
    const parts = formatDateKeyStripParts('2026-06-04', 'UTC', 'hy');
    expect(parts.dayNum).toBeTruthy();
    expect(parts.month).toMatch(/հնս/i);
    expect(parts.weekday).toMatch(/հնգ/i);
  });

  it('prefixes today in the requested locale', () => {
    expect(
      formatNearestSlotDateLabel('2026-06-04', '2026-06-04', tz, 'en'),
    ).toMatch(/^today,/);
    expect(
      formatNearestSlotDateLabel('2026-06-04', '2026-06-04', tz, 'hy'),
    ).toMatch(/^այսօր,/);
    expect(
      formatNearestSlotDateLabel('2026-06-04', '2026-06-04', tz, 'ru'),
    ).toMatch(/^сегодня,/);
    expect(
      formatNearestSlotDateLabel('2026-06-05', '2026-06-04', tz, 'ru'),
    ).not.toMatch(/^сегодня,/);
  });

  it('uses business timezone for strip parts', () => {
    const parts = formatDateKeyStripParts(
      '2026-06-04',
      'America/New_York',
      'en',
    );
    expect(parts.dayNum).toBeTruthy();
  });
});
