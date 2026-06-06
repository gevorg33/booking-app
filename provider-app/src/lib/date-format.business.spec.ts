import { describe, expect, it, beforeEach } from 'vitest';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
} from './date-format';
import { useAuthStore } from '../services/auth-store';

describe('Sprint 34 — provider app business date format', () => {
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

  it('formats booking cards using auth business dateFormat', () => {
    expect(formatDateDisplay('2026-06-04')).toBe('06/04/2026');
    expect(formatDateDisplay('2026-06-04', 'ru')).toBe('06/04/2026');
  });

  it('formats schedule times using auth business timeFormat', () => {
    expect(formatTimeDisplay('2026-06-04T10:00:00.000Z')).toMatch(/10:00\s*AM/i);
    const range = formatTimeRangeDisplay(
      '2026-06-04T10:00:00.000Z',
      '2026-06-04T11:00:00.000Z',
    );
    expect(range).toMatch(/AM/i);
  });

  it('falls back to defaults when business formats are invalid', () => {
    useAuthStore.setState({
      business: {
        id: 'biz-1',
        name: 'Salon',
        dateFormat: 'invalid',
        timeFormat: 'invalid',
      },
    });
    expect(formatDateDisplay('2026-06-04')).toBe('04/06/2026');
    expect(formatTimeDisplay('2026-06-04T13:30:00.000Z')).toMatch(/13:30/);
  });

  it('falls back to defaults when business is null', () => {
    useAuthStore.setState({ business: null });
    expect(formatDateDisplay('2026-06-04')).toBe('04/06/2026');
    expect(formatTimeDisplay('2026-06-04T13:30:00.000Z')).toMatch(/13:30/);
  });

  it('returns raw value for invalid date input', () => {
    expect(formatDateDisplay('not-a-date')).toBe('not-a-date');
    expect(formatTimeDisplay('invalid')).toBe('invalid');
  });
});
