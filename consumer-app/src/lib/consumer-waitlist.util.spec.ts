import { describe, expect, it } from 'vitest';
import { formatWaitlistPreferenceSummary } from './consumer-waitlist.util.js';

describe('formatWaitlistPreferenceSummary', () => {
  it('returns null when not active', () => {
    expect(
      formatWaitlistPreferenceSummary({
        status: 'cancelled',
        joinedAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        serviceName: 'Massage',
      }),
    ).toBeNull();
  });

  it('summarizes active preferences', () => {
    expect(
      formatWaitlistPreferenceSummary({
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        serviceName: 'Massage',
        employeeName: 'Alex',
        date: '2026-07-20',
        timeOfDay: 'morning',
      }),
    ).toBe('Massage · Alex · 2026-07-20 · morning');
  });
});
