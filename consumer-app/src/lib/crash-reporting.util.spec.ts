import { afterEach, describe, expect, it } from 'vitest';
import {
  buildCrashReportingRelease,
  consumePreviousSessionCrashFree,
  createSessionBootId,
  markCurrentSessionCrashed,
  readSessionBootIdForTests,
  resetCrashReportingForTests,
} from './crash-reporting.util.js';

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
      buildCrashReportingRelease({ appSurface: 'consumer_app', appVersion: '2.3.4' }),
    ).toBe('consumer_app@2.3.4');
  });

  it('tracks crash-free sessions via sessionStorage marker', () => {
    expect(consumePreviousSessionCrashFree()).toBe(true);
    expect(readSessionBootIdForTests()).toMatch(/^boot-/);

    markCurrentSessionCrashed();
    expect(consumePreviousSessionCrashFree()).toBe(false);
    expect(consumePreviousSessionCrashFree()).toBe(true);
  });
});
