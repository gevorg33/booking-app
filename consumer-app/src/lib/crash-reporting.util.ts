/** adopt-5.1 — crash detection + Sentry release-health reporting. */

const CRASH_MARKER_KEY = 'app-crash-marker';
const SESSION_BOOT_KEY = 'app-session-boot-id';

export interface CrashReportingConfig {
  appSurface: 'consumer_app' | 'provider_app';
  appVersion?: string;
}

declare global {
  interface Window {
    __optischeduleCaptureError?: (error: unknown) => void;
  }
}

let bootId: string | null = null;
let sentryInitStarted = false;

function getSessionStorage(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function createSessionBootId(): string {
  return `boot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Sentry release tag for release-health dashboards. */
export function buildCrashReportingRelease(config: CrashReportingConfig): string {
  const version =
    config.appVersion?.trim() ||
    import.meta.env.VITE_APP_VERSION?.trim() ||
    '0.0.0';
  return `${config.appSurface}@${version}`;
}

export function readSentryDsn(): string | null {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  return dsn || null;
}

export function isSentryConfigured(): boolean {
  return readSentryDsn() != null;
}

async function initSentryCrashReporter(config: CrashReportingConfig): Promise<void> {
  const dsn = readSentryDsn();
  if (!dsn || typeof window === 'undefined' || sentryInitStarted) return;
  sentryInitStarted = true;

  try {
    const Sentry = await import('@sentry/capacitor');
    const SentryReact = await import('@sentry/react');
    Sentry.init(
      {
        dsn,
        release: buildCrashReportingRelease(config),
        environment:
          import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() ||
          import.meta.env.MODE ||
          'development',
        tracesSampleRate: 0.1,
      },
      SentryReact.init,
    );
    window.__optischeduleCaptureError = (error: unknown) => {
      Sentry.captureException(error);
    };
  } catch {
    sentryInitStarted = false;
  }
}

/** Returns false when the previous session ended in an unhandled error. */
export function consumePreviousSessionCrashFree(): boolean {
  const storage = getSessionStorage();
  const hadCrash = storage?.getItem(CRASH_MARKER_KEY) === '1';
  storage?.removeItem(CRASH_MARKER_KEY);
  bootId = createSessionBootId();
  storage?.setItem(SESSION_BOOT_KEY, bootId);
  return !hadCrash;
}

export function markCurrentSessionCrashed(): void {
  getSessionStorage()?.setItem(CRASH_MARKER_KEY, '1');
}

export function initCrashReporting(config: CrashReportingConfig): void {
  if (typeof window === 'undefined') return;

  void initSentryCrashReporter(config);

  const onError = (event: Event) => {
    markCurrentSessionCrashed();
    if (event instanceof ErrorEvent && event.error) {
      captureHandledError(event.error);
    }
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    markCurrentSessionCrashed();
    captureHandledError(event.reason);
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
}

export function captureHandledError(error: unknown): void {
  if (typeof window !== 'undefined') {
    window.__optischeduleCaptureError?.(error);
  }
}

export function readSessionBootIdForTests(): string | null {
  return bootId;
}

export function resetCrashReportingForTests(): void {
  bootId = null;
  sentryInitStarted = false;
  delete window.__optischeduleCaptureError;
  getSessionStorage()?.removeItem(CRASH_MARKER_KEY);
  getSessionStorage()?.removeItem(SESSION_BOOT_KEY);
}
