import { getBusinessDefaultCurrency } from '../../common/utils/business-currency.util.js';
import { readBusinessDateFormatSettings } from '../../common/utils/business-date-format.util.js';
import {
  getBusinessDefaultLocale,
  getBusinessEnabledLocales,
} from '../../common/utils/business-locale.util.js';

/** Mirrors AuthService.businessLocaleFields for integration assertions. */
function buildAuthBusinessLocaleFields(settings?: Record<string, unknown>) {
  const defaultLocale = getBusinessDefaultLocale(settings);
  const { dateFormat, timeFormat } = readBusinessDateFormatSettings(settings);
  return {
    locale: defaultLocale,
    defaultLocale,
    enabledLocales: getBusinessEnabledLocales(settings),
    dateFormat,
    timeFormat,
    currency: getBusinessDefaultCurrency(settings),
  };
}

describe('Sprint 28 — auth business currency fields', () => {
  it.each([
    { settings: { currency: 'AMD' }, currency: 'AMD' },
    { settings: { defaultCurrency: 'EUR' }, currency: 'EUR' },
    { settings: {}, currency: 'USD' },
    { settings: { currency: 'BOGUS' }, currency: 'USD' },
    { settings: { currency: 'GEL', locale: 'en' }, currency: 'GEL' },
  ])('maps settings to auth currency ($currency)', ({ settings, currency }) => {
    expect(buildAuthBusinessLocaleFields(settings).currency).toBe(currency);
  });

  it('exposes currency alongside locale and date/time fields', () => {
    const fields = buildAuthBusinessLocaleFields({
      locale: 'hy',
      currency: 'AMD',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });

    expect(fields).toMatchObject({
      currency: 'AMD',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });
    expect(fields.enabledLocales.length).toBeGreaterThan(0);
  });
});
