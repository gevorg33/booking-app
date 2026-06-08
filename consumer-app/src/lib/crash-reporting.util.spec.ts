import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCrashReportingRelease,
  consumePreviousSessionCrashFree,
  createSessionBootId,
  captureHandledError,
  initCrashReporting,
  isSentryConfigured,
  markCurrentSessionCrashed,
  readSentryDsn,
  resetCrashReportingForTests,
} from './crash-reporting.util.js';

describe('crash-reporting.util', () => {
  beforeEach(() => {
    resetCrashReportingForTests();
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it('creates unique boot ids', () => {
    expect(createSessionBootId()).not.toBe(createSessionBootId());
  });

  it('builds Sentry release tags for release-health dashboards', () => {
    expect(
      buildCrashReportingRelease({ appSurface: 'consumer_app', appVersion: '2.3.4' }),
    ).toBe('consumer_app@2.3.4');
  });

  it('marks previous session as not crash-free after unhandled error', () => {
    expect(consumePreviousSessionCrashFree()).toBe(true);
    markCurrentSessionCrashed();
    expect(consumePreviousSessionCrashFree()).toBe(false);
    expect(consumePreviousSessionCrashFree()).toBe(true);
  });

  it('registers global error listeners', () => {
    initCrashReporting({ appSurface: 'consumer_app', appVersion: '1.0.0' });
    expect(consumePreviousSessionCrashFree()).toBe(true);
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('boom') }));
    expect(consumePreviousSessionCrashFree()).toBe(false);
  });

  it('forwards handled errors to the reporter hook', () => {
    const capture = vi.fn();
    window.__optischeduleCaptureError = capture;
    captureHandledError(new Error('handled'));
    expect(capture).toHaveBeenCalledTimes(1);
  });

  it('detects when Sentry DSN is configured', () => {
    expect(isSentryConfigured()).toBe(false);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example@sentry.io/1');
    expect(readSentryDsn()).toBe('https://example@sentry.io/1');
    expect(isSentryConfigured()).toBe(true);
  });
});
