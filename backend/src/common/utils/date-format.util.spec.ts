import {
  applyRelativeDateFromPrompt,
  buildUtcStartTimeFromDayAndTime,
  dateKeyToDisplay,
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  getTodayDateKey,
  parseDateInput,
  readBusinessDateFormatSettings,
  resolveRelativeDateKeyword,
  todayDisplay,
  toIsoDay,
} from './date-format.util.js';

describe('date-format.util', () => {
  it('dateKeyToDisplay converts iso to DD/MM/YYYY', () => {
    expect(dateKeyToDisplay('2026-06-04')).toBe('04/06/2026');
  });

  it('formatDateDisplay uses locale when provided', () => {
    expect(formatDateDisplay('2026-06-04', 'hy')).toBeTruthy();
    expect(formatDateDisplay('2026-06-04', 'ru')).toBeTruthy();
    expect(formatDateDisplay('2026-06-04', 'en')).toMatch(/04/);
  });

  it('formatDateDisplay falls back for unknown locale', () => {
    expect(formatDateDisplay('2026-06-04')).toBe('04/06/2026');
    expect(formatDateDisplay('bad')).toBe('bad');
  });

  it('formatDateDisplay handles Date input', () => {
    const d = new Date('2026-06-04T12:00:00.000Z');
    expect(formatDateDisplay(d, 'en')).toMatch(/04/);
  });

  it('formatTimeDisplay and range', () => {
    expect(formatTimeDisplay('2026-06-04T10:05:00.000Z')).toBe('10:05');
    expect(formatTimeDisplay('invalid')).toBe('invalid');
    const range = formatTimeRangeDisplay(
      '2026-06-04T10:00:00.000Z',
      '2026-06-04T11:00:00.000Z',
      'en',
    );
    expect(range).toMatch(/\d{2}:\d{2}–\d{2}:\d{2}/);
    expect(formatTimeRangeDisplay('invalid', 'also-invalid', 'en')).toBe(
      'invalid–also-invalid',
    );
  });

  it('formatTimeRangeDisplay falls back without formatRange', () => {
    const original = Intl.DateTimeFormat.prototype.formatRange;
    // @ts-expect-error test stub
    Intl.DateTimeFormat.prototype.formatRange = undefined;
    const range = formatTimeRangeDisplay(
      '2026-06-04T10:00:00.000Z',
      '2026-06-04T11:00:00.000Z',
      'en',
    );
    expect(range).toBe('10:00–11:00');
    Intl.DateTimeFormat.prototype.formatRange = original;
  });

  it('parseDateInput supports legacy formats', () => {
    expect(parseDateInput('01_06_2026')?.toISOString()).toBe(
      '2026-06-01T00:00:00.000Z',
    );
    expect(parseDateInput('01/06/2026')?.toISOString()).toBe(
      '2026-06-01T00:00:00.000Z',
    );
    expect(parseDateInput('2026-06-01')?.toISOString()).toBe(
      '2026-06-01T00:00:00.000Z',
    );
    expect(parseDateInput('nope')).toBeNull();
  });

  it('resolveRelativeDateKeyword and toIsoDay', () => {
    const today = getTodayDateKey('UTC');
    expect(resolveRelativeDateKeyword('today', 'UTC')).toBe(today);
    expect(resolveRelativeDateKeyword('tomorrow', 'UTC')).toBeTruthy();
    expect(resolveRelativeDateKeyword('yesterday', 'UTC')).toBeTruthy();
    expect(resolveRelativeDateKeyword('soon', 'UTC')).toBeNull();
    expect(toIsoDay('today', 'UTC')).toBe(today);
    expect(toIsoDay('01/06/2026', 'UTC')).toBe('2026-06-01');
    expect(toIsoDay('unknown')).toBe('unknown');
  });

  it('applyRelativeDateFromPrompt mutates params.date', () => {
    const params: Record<string, any> = {};
    applyRelativeDateFromPrompt(params, 'book tomorrow', 'UTC');
    expect(params.date).toBeTruthy();
    const paramsToday: Record<string, any> = {};
    applyRelativeDateFromPrompt(paramsToday, 'today please', 'UTC');
    expect(paramsToday.date).toBe(todayDisplay('UTC'));
    const paramsYesterday: Record<string, any> = {};
    applyRelativeDateFromPrompt(paramsYesterday, 'yesterday slots', 'UTC');
    expect(paramsYesterday.date).toBeTruthy();
  });

  it('resolveRelativeDateKeyword handles tonight', () => {
    expect(resolveRelativeDateKeyword('tonight', 'UTC')).toBe(
      getTodayDateKey('UTC'),
    );
  });

  it('buildUtcStartTimeFromDayAndTime combines day and slot', () => {
    const iso = buildUtcStartTimeFromDayAndTime('2026-06-04', '14:30');
    expect(iso).toContain('2026-06-04T14:30:00');
    const hourOnly = buildUtcStartTimeFromDayAndTime('2026-06-04', '9');
    expect(hourOnly).toContain('T09:00:00');
    expect(() => buildUtcStartTimeFromDayAndTime('bad', '10:00')).toThrow(
      /Invalid booking date/,
    );
  });

  it('parseDateInput parses generic date strings', () => {
    const parsed = parseDateInput('June 4, 2026');
    expect(parsed).toBeInstanceOf(Date);
  });

  it('applyRelativeDateFromPrompt no-ops without keywords', () => {
    const params: Record<string, any> = { date: '01/06/2026' };
    applyRelativeDateFromPrompt(params, 'next week', 'UTC');
    expect(params.date).toBe('01/06/2026');
  });

  it('formatTimeRangeDisplay accepts Date objects', () => {
    const start = new Date('2026-06-04T10:00:00.000Z');
    const end = new Date('2026-06-04T11:00:00.000Z');
    expect(formatTimeRangeDisplay(start, end, 'en')).toMatch(/\d{2}:\d{2}/);
  });

  it('formatDateDisplay uses numeric fallback without intl locale', () => {
    const d = new Date('2026-06-04T12:00:00.000Z');
    expect(formatDateDisplay(d, 'de')).toBe('04/06/2026');
  });

  it('formatDateDisplay respects business dateFormat option', () => {
    expect(
      formatDateDisplay('2026-06-04', 'en', { dateFormat: 'MM/DD/YYYY' }),
    ).toBe('06/04/2026');
    expect(
      formatDateDisplay('2026-06-04', 'en', { dateFormat: 'YYYY-MM-DD' }),
    ).toBe('2026-06-04');
  });

  it('formatTimeDisplay respects business timeFormat option', () => {
    expect(
      formatTimeDisplay('2026-06-04T13:30:00.000Z', { timeFormat: '12h' }),
    ).toMatch(/1:30\s*PM/i);
    expect(
      formatTimeRangeDisplay(
        '2026-06-04T10:00:00.000Z',
        '2026-06-04T11:00:00.000Z',
        'en',
        { timeFormat: '12h' },
      ),
    ).toMatch(/AM|PM/i);
  });

  it('formatTimeDisplay uses custom timezone with business 12h format', () => {
    expect(
      formatTimeDisplay('2026-06-04T13:30:00.000Z', {
        timeFormat: '12h',
        timeZone: 'UTC',
      }),
    ).toMatch(/1:30\s*PM/i);
  });

  it('formatTimeRangeDisplay uses business options for invalid instants', () => {
    expect(
      formatTimeRangeDisplay('bad', 'also-bad', 'en', { timeFormat: '12h' }),
    ).toBe('bad–also-bad');
  });

  it('readBusinessDateFormatSettings is re-exported for notification formatters', () => {
    expect(
      readBusinessDateFormatSettings({
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      }),
    ).toEqual({ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' });
  });
});
