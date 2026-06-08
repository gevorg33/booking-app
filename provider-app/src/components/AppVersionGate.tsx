import { useI18n } from '../i18n';
import { getAppVersionGateCopy } from '../lib/app-version-gate-copy.util';
import { useMobileAppVersionPolicy } from '../hooks/use-mobile-app-version-policy';
import { AppUpdateNudgeBanner } from './AppUpdateNudgeBanner';

/** Blocks broken builds and prompts for required updates (adopt-5.5). */
export function AppVersionGate({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  const copy = getAppVersionGateCopy(locale);
  const { blocked, nudge, dismissNudge } = useMobileAppVersionPolicy({
    surface: 'provider_app',
    killSwitchFallback: copy.killSwitchMessage,
    updateRequiredFallback: copy.updateRequiredMessage,
    updateNudgeFallback: copy.updateNudgeMessage,
  });

  if (blocked) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f9fafb',
        }}
      >
        <div style={{ maxWidth: 420, width: '100%', padding: 24, background: '#fff', borderRadius: 12 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{copy.title}</h1>
          <p style={{ color: '#4b5563' }}>{blocked.message}</p>
          {blocked.storeUrl ? (
            <a
              href={blocked.storeUrl}
              style={{ color: '#2563eb', fontWeight: 600 }}
              target="_blank"
              rel="noreferrer"
            >
              {copy.updateAction}
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
          updateLabel={copy.updateAction}
          dismissLabel={copy.dismissAction}
          onDismiss={dismissNudge}
        />
      ) : null}
      {children}
    </>
  );
}
