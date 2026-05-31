import { describe, it, expect } from 'vitest';
import { dateKeyToExpiresAtEndOfDay, isExpiredAt } from './date-format';

describe('date-format expiration helpers', () => {
  it('converts date key to end-of-day UTC ISO timestamp', () => {
    expect(dateKeyToExpiresAtEndOfDay('2026-12-31')).toBe('2026-12-31T23:59:59.999Z');
    expect(dateKeyToExpiresAtEndOfDay('invalid')).toBeNull();
    expect(dateKeyToExpiresAtEndOfDay('')).toBeNull();
  });

  it('detects expired timestamps', () => {
    expect(isExpiredAt('2020-01-01T00:00:00.000Z')).toBe(true);
    expect(isExpiredAt(new Date('2020-01-01T00:00:00.000Z'))).toBe(true);
    expect(isExpiredAt(null)).toBe(false);
    expect(isExpiredAt(undefined)).toBe(false);
    expect(isExpiredAt(new Date(Date.now() + 86400000).toISOString())).toBe(false);
  });
});
