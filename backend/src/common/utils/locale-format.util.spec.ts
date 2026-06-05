import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedDateShort,
  formatLocalizedTime,
  getBusinessDefaultCurrency,
  resolveIntlLocale,
} from './locale-format.util.js';

describe('locale-format.util', () => {
  const date = new Date('2026-05-15T14:30:00Z');

  it('resolves supported locales', () => {
    expect(resolveIntlLocale('en')).toBe('en-GB');
    expect(resolveIntlLocale('hy')).toBe('hy-AM');
    expect(resolveIntlLocale('ru')).toBe('ru-RU');
    expect(resolveIntlLocale(null)).toBe('en-GB');
    expect(resolveIntlLocale('de')).toBe('en-GB');
  });

  it('formats localized dates and times', () => {
    expect(formatLocalizedDate(date, 'en')).toContain('2026');
    expect(formatLocalizedDateShort(date, 'en')).toBeTruthy();
    expect(formatLocalizedTime(date, 'en')).toMatch(/\d{2}:\d{2}/);
  });

  it('formats currency by locale', () => {
    expect(formatLocalizedCurrency(50, 'USD', 'en')).toContain('50');
    expect(formatLocalizedCurrency(1000, 'AMD', 'hy')).toBeTruthy();
  });

  it('handles invalid dates gracefully', () => {
    expect(formatLocalizedDate('invalid', 'en')).toBe('invalid');
    expect(formatLocalizedDateShort('bad', 'en')).toBe('bad');
    expect(formatLocalizedTime('bad', 'en')).toBe('bad');
  });

  it('reads business default currency from settings', () => {
    expect(getBusinessDefaultCurrency({})).toBe('USD');
    expect(getBusinessDefaultCurrency({ currency: 'amd' })).toBe('AMD');
    expect(getBusinessDefaultCurrency({ defaultCurrency: 'eur' })).toBe('EUR');
    expect(getBusinessDefaultCurrency({ locale: { currency: 'GBP' } })).toBe(
      'GBP',
    );
  });
});
