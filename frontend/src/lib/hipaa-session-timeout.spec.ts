import { describe, expect, it } from 'vitest';
import {
  HIPAA_INACTIVITY_EVENTS,
  resolveHipaaSessionTimeoutMs,
  shouldEnforceHipaaSessionTimeout,
} from './hipaa-session-timeout';

describe('hipaa-session-timeout', () => {
  it('enforces timeout only when HIPAA mode is active and user is signed in', () => {
    expect(shouldEnforceHipaaSessionTimeout(null, true)).toBe(false);
    expect(
      shouldEnforceHipaaSessionTimeout(
        { businessType: 'clinic', hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' } },
        false,
      ),
    ).toBe(false);
    expect(
      shouldEnforceHipaaSessionTimeout(
        { businessType: 'hair_salon', hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' } },
        true,
      ),
    ).toBe(false);
    expect(
      shouldEnforceHipaaSessionTimeout(
        { businessType: 'clinic', hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' } },
        true,
      ),
    ).toBe(true);
  });

  it('resolves configured timeout duration in milliseconds', () => {
    expect(
      resolveHipaaSessionTimeoutMs({
        hipaa: { sessionTimeoutMinutes: 20 },
      }),
    ).toBe(20 * 60 * 1000);
  });

  it('exports standard inactivity events', () => {
    expect(HIPAA_INACTIVITY_EVENTS).toContain('keydown');
    expect(HIPAA_INACTIVITY_EVENTS).toEqual(
      expect.arrayContaining(['mousedown', 'scroll', 'touchstart']),
    );
  });

  it('uses default session timeout when minutes are not customized', () => {
    expect(
      resolveHipaaSessionTimeoutMs({
        businessType: 'clinic',
        hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
      }),
    ).toBe(15 * 60 * 1000);
  });
});
