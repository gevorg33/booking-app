import { readBusinessDateFormatSettings } from '../../common/utils/business-date-format.util.js';

describe('Sprint 34 — auth business date format fields', () => {
  it('maps business settings to auth summary date/time format fields', () => {
    const settings = {
      locale: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    };
    const fields = readBusinessDateFormatSettings(settings);
    expect(fields).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
  });

  it('defaults auth summary formats when settings omit date/time fields', () => {
    expect(readBusinessDateFormatSettings({ locale: 'hy' })).toEqual({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });
    expect(readBusinessDateFormatSettings(undefined)).toEqual({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });
  });

  it('normalizes invalid stored values before exposing on auth response', () => {
    expect(
      readBusinessDateFormatSettings({
        dateFormat: 'DD-MM-YYYY',
        timeFormat: '48h',
      }),
    ).toEqual({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });
  });
});
