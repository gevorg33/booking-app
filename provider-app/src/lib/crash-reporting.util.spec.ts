import { afterEach, describe, expect, it } from 'vitest';
import {
  buildCrashReportingRelease,
  consumePreviousSessionCrashFree,
  createSessionBootId,
  markCurrentSessionCrashed,
  readSessionBootIdForTests,
  resetCrashReportingForTests,
} from './crash-reporting.util';

describe('crash-reporting.util (adopt-5.1)', () => {
  afterEach(() => {
    resetCrashReportingForTests();
  });

  it('creates unique session boot ids', () => {
    const a = createSessionBootId();
    const b = createSessionBootId();
    expect(a).toMatch(/^boot-/);
    expect(b).not.toBe(a);
  });

  it('builds Sentry release tags per surface', () => {
    expect(
      buildCrashReportingRelease({ appSurface: 'provider_app', appVersion: '1.2.0' }),
    ).toBe('provider_app@1.2.0');
  });

  it('tracks crash-free sessions via sessionStorage marker', () => {
    expect(consumePreviousSessionCrashFree()).toBe(true);
    expect(readSessionBootIdForTests()).toMatch(/^boot-/);

    markCurrentSessionCrashed();
    expect(consumePreviousSessionCrashFree()).toBe(false);
    expect(consumePreviousSessionCrashFree()).toBe(true);
  });
});
