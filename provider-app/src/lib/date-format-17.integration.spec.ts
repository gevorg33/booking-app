import { beforeEach, describe, expect, it } from 'vitest';
import {
  formatDateDisplay,
  formatTimeDisplay,
  parseTypedBusinessDateToKey,
  toIsoDay,
} from './date-format';
import { useAuthStore } from '../services/auth-store';

const PARSE_MATRIX = [
  {
    id: 'ddmm',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    typed: '04/06/2026',
    key: '2026-06-04',
    display: '04/06/2026',
    ambiguousKey: '2026-06-04',
  },
  {
    id: 'mmdd',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    typed: '06/04/2026',
    key: '2026-06-04',
    display: '06/04/2026',
    ambiguousKey: '2026-04-06',
  },
  {
    id: 'iso',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    typed: '2026-06-04',
    key: '2026-06-04',
    display: '2026-06-04',
    ambiguousKey: '2026-06-04',
  },
] as const;

describe('Sprint 34 — fmt-1.8 provider date input + display integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'p@test.com' },
      business: {
        id: 'biz-1',
        name: 'Salon',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      },
      token: 'token',
      isAuthenticated: true,
      employee: null,
      businesses: [],
    });
  });

  describe.each(PARSE_MATRIX)(
    '$id — auth business formats drive parse and display',
    ({ dateFormat, timeFormat, typed, key, display, ambiguousKey }) => {
      it('parseTypedBusinessDateToKey and formatDateDisplay respect auth settings', () => {
        useAuthStore.setState({
          business: {
            id: 'biz-1',
            name: 'Salon',
            dateFormat,
            timeFormat,
          },
        });
        expect(parseTypedBusinessDateToKey(typed)).toBe(key);
        expect(formatDateDisplay(typed)).toBe(display);
        expect(formatDateDisplay(key)).toBe(display);
        expect(parseTypedBusinessDateToKey('04/06/2026')).toBe(ambiguousKey);
      });
    },
  );

  it('formatTimeDisplay uses auth business timeFormat', () => {
    useAuthStore.setState({
      business: {
        id: 'biz-1',
        name: 'Salon',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      },
    });
    expect(formatTimeDisplay('2026-06-04T15:00:00.000Z')).toMatch(/3:00\s*PM/i);

    useAuthStore.setState({
      business: {
        id: 'biz-1',
        name: 'Salon',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
      },
    });
    expect(formatTimeDisplay('2026-06-04T15:00:00.000Z')).toMatch(/15:00/);
  });

  it('rejects invalid typed provider dates', () => {
    expect(parseTypedBusinessDateToKey('not-valid')).toBeNull();
    expect(parseTypedBusinessDateToKey('31/02/2026')).toBeNull();
  });
});
