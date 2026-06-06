import { beforeEach, describe, expect, it } from 'vitest';
import {
  bootstrapAuthBusinessDateFormats,
  resolveBootstrapDateFormatPreference,
  setActiveBusinessDateFormats,
} from './business-date-format';
import {
  formatDateDisplay,
  formatScheduleTime,
  formatTimeDisplay,
} from './date-format';
import { useAuthStore } from './store';

const bookingInstant = '2026-06-04T10:00:00.000Z';

describe('Sprint 34 — fmt-1.6 dashboard scenario matrix', () => {
  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
    useAuthStore.setState({
      user: { id: 'u1', email: 'owner@test.com' },
      business: {
        id: 'biz-1',
        name: 'Glow Salon',
        slug: 'glow-salon',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      },
      employee: null,
      businesses: [],
      token: 'token',
      isAuthenticated: true,
    });
  });

  it.each([
    {
      id: 'european-24h',
      business: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
      date: '04/06/2026',
      timePattern: /10:00/,
    },
    {
      id: 'us-12h',
      business: { dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
      date: '06/04/2026',
      timePattern: /10:00\s*AM/i,
    },
    {
      id: 'iso-24h',
      business: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
      date: '2026-06-04',
      timePattern: /10:00/,
    },
  ])(
    'layout bootstrap formats bookings for $id',
    ({ business, date, timePattern }) => {
      bootstrapAuthBusinessDateFormats(business);
      expect(formatDateDisplay(bookingInstant)).toBe(date);
      expect(formatScheduleTime(bookingInstant)).toMatch(timePattern);
    },
  );

  it('prefers explicit tenant formats over auth business for public bootstrap', () => {
    const preference = resolveBootstrapDateFormatPreference({
      business: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
    bootstrapAuthBusinessDateFormats(preference);
    expect(formatDateDisplay(bookingInstant)).toBe('06/04/2026');
    expect(formatScheduleTime(bookingInstant)).toMatch(/10:00\s*AM/i);
  });

  it('uses auth business when explicit formats are omitted', () => {
    const preference = resolveBootstrapDateFormatPreference({
      business: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
    });
    bootstrapAuthBusinessDateFormats(preference);
    expect(formatDateDisplay(bookingInstant)).toBe('2026-06-04');
  });

  it('simulates business switch reloading formats from auth summary', () => {
    bootstrapAuthBusinessDateFormats({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });
    expect(formatDateDisplay(bookingInstant)).toBe('04/06/2026');

    useAuthStore.setState({
      business: {
        id: 'biz-2',
        name: 'Nails Co',
        slug: 'nails-co',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      },
    });
    const switched = useAuthStore.getState().business;
    bootstrapAuthBusinessDateFormats(switched);
    expect(formatDateDisplay(bookingInstant)).toBe('06/04/2026');
    expect(formatTimeDisplay(bookingInstant, 'en', 'UTC')).toMatch(/10:00\s*AM/i);
  });
});
