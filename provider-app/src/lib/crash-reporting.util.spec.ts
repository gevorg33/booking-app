import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildCrashReportingRelease,
  consumePreviousSessionCrashFree,
  createSessionBootId,
  initCrashReporting,
  markCurrentSessionCrashed,
  resetCrashReportingForTests,
} from './crash-reporting.util';

describe('crash-reporting.util', () => {
  beforeEach(() => {
    resetCrashReportingForTests();
    sessionStorage.clear();
  });

  it('creates unique boot ids', () => {
    expect(createSessionBootId()).not.toBe(createSessionBootId());
  });

  it('builds provider release tags', () => {
    expect(
      buildCrashReportingRelease({ appSurface: 'provider_app', appVersion: '1.0.0' }),
    ).toBe('provider_app@1.0.0');
  });

  it('marks previous session as not crash-free after unhandled error', () => {
    expect(consumePreviousSessionCrashFree()).toBe(true);
    markCurrentSessionCrashed();
    expect(consumePreviousSessionCrashFree()).toBe(false);
    expect(consumePreviousSessionCrashFree()).toBe(true);
  });

  it('registers global error listeners', () => {
    initCrashReporting({ appSurface: 'provider_app', appVersion: '1.0.0' });
    expect(consumePreviousSessionCrashFree()).toBe(true);
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('boom') }));
    expect(consumePreviousSessionCrashFree()).toBe(false);
  });
});
