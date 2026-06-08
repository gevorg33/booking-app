import { consumerCopyForLocale } from '../lib/copy.js';
import { useMobileAppVersionPolicy } from '../hooks/use-mobile-app-version-policy.js';
import { AppUpdateNudgeBanner } from './AppUpdateNudgeBanner.js';

/** Blocks broken builds and prompts for required updates (adopt-5.5). */
export function AppVersionGate({ children }: { children: React.ReactNode }) {
  const copy = consumerCopyForLocale(
    typeof navigator !== 'undefined' ? navigator.language : 'en',
  );
  const { blocked, nudge, dismissNudge } = useMobileAppVersionPolicy({
    surface: 'consumer_app',
    killSwitchFallback: copy.appGateKillSwitchMessage,
    updateRequiredFallback: copy.appGateUpdateRequiredMessage,
    updateNudgeFallback: copy.appGateUpdateNudgeMessage,
  });

  if (blocked) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.appGateTitle}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f9fafb',
        }}
      >
        <div className="salon-card" style={{ maxWidth: 420, width: '100%' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{copy.appGateTitle}</h1>
          <p style={{ color: '#4b5563' }}>{blocked.message}</p>
          {blocked.storeUrl ? (
            <a
              href={blocked.storeUrl}
              style={{ color: '#2563eb', fontWeight: 600 }}
              target="_blank"
              rel="noreferrer"
            >
              {copy.appGateUpdateAction}
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <>
      {nudge ? (
        <AppUpdateNudgeBanner
          message={nudge.message}
          storeUrl={nudge.storeUrl}
          updateLabel={copy.appGateUpdateAction}
          dismissLabel={copy.appGateDismissAction}
          onDismiss={dismissNudge}
        />
      ) : null}
      {children}
    </>
  );
}
