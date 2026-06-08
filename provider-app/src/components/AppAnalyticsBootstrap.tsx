import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import {
  configureAppAnalytics,
  hydrateAnalyticsAppVersion,
  markWarmAnalyticsSession,
  readAnalyticsConsent,
  setAnalyticsConsent,
  track,
} from '../lib/app-analytics';
import { resolveAnalyticsLocale } from '../lib/app-analytics-context.util';
import { consumePreviousSessionCrashFree } from '../lib/crash-reporting.util';
import { useI18n } from '../i18n';

export function AppAnalyticsBootstrap() {
  const { locale, t } = useI18n();
  const [consentPrompt, setConsentPrompt] = useState(false);

  useEffect(() => {
    void (async () => {
      const appVersion = await hydrateAnalyticsAppVersion();
      configureAppAnalytics({
        appSurface: 'provider_app',
        locale: resolveAnalyticsLocale(locale),
        appVersion,
      });
      const crashFree = consumePreviousSessionCrashFree();
      const consent = readAnalyticsConsent();
      if (consent == null) {
        setConsentPrompt(true);
        return;
      }
      if (consent) track('app_opened', { crashFree });
    })();
  }, [locale]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let removeHandle: (() => void) | undefined;
    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      markWarmAnalyticsSession();
      track('app_opened', { crashFree: true });
    }).then((handle) => {
      removeHandle = () => void handle.remove();
    });
    return () => removeHandle?.();
  }, []);

  if (!consentPrompt) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('provider.analyticsConsentTitle')}
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: 9999,
        padding: 16,
        background: 'rgba(255,255,255,0.98)',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
      }}
    >
      <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: 12 }}>
        {t('provider.analyticsConsentMessage')}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          aria-label={t('provider.analyticsConsentDecline')}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
          onClick={() => {
            setAnalyticsConsent(false);
            setConsentPrompt(false);
          }}
        >
          {t('provider.analyticsConsentDecline')}
        </button>
        <button
          type="button"
          aria-label={t('provider.analyticsConsentAccept')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
          }}
          onClick={() => {
            setAnalyticsConsent(true);
            setConsentPrompt(false);
          }}
        >
          {t('provider.analyticsConsentAccept')}
        </button>
      </div>
    </div>
  );
}
