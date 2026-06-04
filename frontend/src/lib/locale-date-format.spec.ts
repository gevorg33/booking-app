import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import * as calendarDate from './calendar-date.util';
import * as dateKeyParse from './date-key-parse.util';
import {
  formatAppointmentDateLabel,
  formatDateKeyPublicLabel,
  formatDateKeyStripParts,
  formatNearestSlotDateLabel,
  formatWeekdayShortByDayIndex,
  resolveNearestSlotDateLabel,
} from './locale-date-format';

describe('locale-date-format', () => {
  const doc = { documentElement: { lang: 'en' } };

  beforeAll(() => {
    vi.stubGlobal('document', doc);
  });

  afterEach(() => {
    doc.documentElement.lang = 'en';
    vi.restoreAllMocks();
  });

  it('formatDateKeyPublicLabel returns key when parse fails', () => {
    expect(formatDateKeyPublicLabel('not-a-key', 'en')).toBe('not-a-key');
  });

  it('formats long labels per locale', () => {
    const hy = formatDateKeyPublicLabel('2026-06-04', 'hy', 'UTC');
    expect(hy).toMatch(/հունիս/i);
    const ru = formatDateKeyPublicLabel('2026-06-04', 'ru', 'UTC');
    expect(ru).toMatch(/июн/i);
    const en = formatDateKeyPublicLabel('2026-06-04', 'en', 'UTC');
    expect(en).toMatch(/June/i);
  });

  it('formatWeekdayShortByDayIndex returns empty when anchor missing', () => {
    vi.spyOn(dateKeyParse, 'parseDateKey').mockReturnValueOnce(null);
    expect(formatWeekdayShortByDayIndex(0, 'en')).toBe('');
  });

  it('formatWeekdayShortByDayIndex formats Sunday in Russian', () => {
    expect(formatWeekdayShortByDayIndex(0, 'ru').length).toBeGreaterThan(0);
  });

  it('formatWeekdayShortByDayIndex uses document.lang when locale omitted', () => {
    doc.documentElement.lang = 'hy';
    expect(formatWeekdayShortByDayIndex(0)).toMatch(/կիր/i);
    doc.documentElement.lang = 'xx';
    expect(formatWeekdayShortByDayIndex(0)).toMatch(/Sun/i);
  });

  it('formatWeekdayShortByDayIndex formats all weekday indices', () => {
    for (let day = 0; day < 7; day += 1) {
      expect(formatWeekdayShortByDayIndex(day, 'en').length).toBeGreaterThan(0);
    }
  });

  it('formatDateKeyPublicLabel uses document.lang when locale omitted', () => {
    doc.documentElement.lang = 'hy';
    expect(formatDateKeyPublicLabel('2026-06-04', undefined, 'UTC')).toMatch(/հունիս/i);
    doc.documentElement.lang = 'xx';
    expect(formatDateKeyPublicLabel('2026-06-04', undefined, 'UTC')).toMatch(/June/i);
  });

  it('formatDateKeyStripParts formats ru strip labels', () => {
    const parts = formatDateKeyStripParts('2026-06-04', 'ru', 'UTC');
    expect(parts.weekday).toMatch(/чт/i);
    expect(parts.month).toMatch(/июн/i);
  });

  it('formatDateKeyStripParts handles invalid keys', () => {
    expect(formatDateKeyStripParts('nope', 'en')).toEqual({
      weekday: '',
      dayNum: '',
      month: '',
    });
  });

  it('formatAppointmentDateLabel returns input when invalid', () => {
    expect(formatAppointmentDateLabel('bad-date', 'en')).toBe('bad-date');
  });

  it('formatAppointmentDateLabel formats hy appointment header', () => {
    const label = formatAppointmentDateLabel('2026-06-04T12:00:00.000Z', 'hy', 'UTC');
    expect(label).toMatch(/հունիս/i);
  });

  it('formatAppointmentDateLabel uses document.lang when locale omitted', () => {
    doc.documentElement.lang = 'hy';
    const label = formatAppointmentDateLabel('2026-06-04T12:00:00.000Z', undefined, 'UTC');
    expect(label).toMatch(/հունիս/i);
    doc.documentElement.lang = 'xx';
    expect(formatAppointmentDateLabel('2026-06-04T12:00:00.000Z', undefined, 'UTC')).toMatch(/June/i);
  });

  it('formatAppointmentDateLabel formats explicit en and ru locales', () => {
    expect(formatAppointmentDateLabel('2026-06-04T12:00:00.000Z', 'en', 'UTC')).toMatch(/June/i);
    expect(formatAppointmentDateLabel('2026-06-04T12:00:00.000Z', 'ru', 'UTC')).toMatch(/июн/i);
  });

  it('formatAppointmentDateLabel accepts Date instances', () => {
    const d = new Date('2026-06-04T12:00:00.000Z');
    expect(formatAppointmentDateLabel(d, 'en', 'UTC')).toMatch(/June/i);
  });

  it('falls back to en-GB for unsupported locale codes', () => {
    expect(formatDateKeyPublicLabel('2026-06-04', 'de')).toMatch(/June/i);
    expect(formatDateKeyStripParts('2026-06-04', 'de').weekday).toMatch(/Thu/i);
    expect(formatAppointmentDateLabel('2026-06-04T12:00:00.000Z', 'de')).toMatch(/June/i);
  });

  it('formatAppointmentDateLabel returns input for unparseable values', () => {
    expect(formatAppointmentDateLabel('not-valid', 'en')).toBe('not-valid');
    expect(formatAppointmentDateLabel(new Date('invalid'), 'en')).toContain('Invalid');
  });

  it('resolveNearestSlotDateLabel prefers API label for hydration', () => {
    expect(
      resolveNearestSlotDateLabel({
        nearestDate: '2026-06-04',
        nearestDateLabel: 'այսօր, հունիսի 4, հինգշաբթի',
      }),
    ).toBe('այսօր, հունիսի 4, հինգշաբթի');
  });

  it('resolveNearestSlotDateLabel formats date when label missing', () => {
    const label = resolveNearestSlotDateLabel(
      { nearestDate: '2026-06-10' },
      'en',
      'UTC',
      'today',
    );
    expect(label).toContain('10');
    expect(label).not.toContain('today');
  });

  it('resolveNearestSlotDateLabel returns null when no date', () => {
    expect(resolveNearestSlotDateLabel({})).toBeNull();
  });

  it('resolveNearestSlotDateLabel ignores empty API label', () => {
    const label = resolveNearestSlotDateLabel(
      { nearestDate: '2026-06-10', nearestDateLabel: '' },
      'en',
      'UTC',
      'today',
    );
    expect(label).toContain('10');
  });

  it('formatNearestSlotDateLabel prefixes today per locale', () => {
    const today = calendarDate.getTodayDateKey('UTC');
    expect(formatNearestSlotDateLabel(today, 'en', 'UTC', 'today')).toMatch(/^today,/);
    expect(formatNearestSlotDateLabel(today, 'hy', 'UTC', 'այսօր')).toMatch(/^այսօր,/);
    expect(formatNearestSlotDateLabel('2099-01-01', 'ru', 'UTC', 'сегодня')).not.toMatch(/^сегодня,/);
  });

  it('formatNearestSlotDateLabel defaults todayInline to "today"', () => {
    const today = calendarDate.getTodayDateKey('UTC');
    expect(formatNearestSlotDateLabel(today, 'en', 'UTC')).toMatch(/^today,/);
  });
});
