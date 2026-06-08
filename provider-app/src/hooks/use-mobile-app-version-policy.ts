import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import {
  buildUpdateNudgeDismissKey,
  dismissUpdateNudge,
  evaluateMobileAppGate,
  shouldShowUpdateNudge,
  type MobileAppConfigView,
} from '../lib/app-version-gate.util';
import { resolveAppAnalyticsPlatform } from '../lib/app-analytics-context.util';
import { fetchMobileAppConfig } from '../services/api';

export type MobileAppVersionBlock = {
  reason: 'kill_switch' | 'update_required';
  message: string;
  storeUrl: string | null;
};

export type MobileAppUpdateNudge = {
  message: string;
  storeUrl: string | null;
  dismissKey: string;
};

export function useMobileAppVersionPolicy(input: {
  surface: 'consumer_app' | 'provider_app';
  killSwitchFallback: string;
  updateRequiredFallback: string;
  updateNudgeFallback: string;
}) {
  const [blocked, setBlocked] = useState<MobileAppVersionBlock | null>(null);
  const [nudge, setNudge] = useState<MobileAppUpdateNudge | null>(null);

  useEffect(() => {
    void (async () => {
      const platform = resolveAppAnalyticsPlatform();
      let version = import.meta.env.VITE_APP_VERSION?.trim() || '1.0.0';
      if (Capacitor.isNativePlatform()) {
        try {
          version = (await CapacitorApp.getInfo()).version || version;
        } catch {
          // keep env fallback
        }
      }

      let config: MobileAppConfigView;
      try {
        config = await fetchMobileAppConfig({
          surface: input.surface,
          platform,
          version,
        });
      } catch {
        return;
      }

      const gate = evaluateMobileAppGate({ currentVersion: version, config });
      if (gate.blocked && gate.reason) {
        setBlocked({
          reason: gate.reason,
          message:
            config.message ||
            (gate.reason === 'kill_switch'
              ? input.killSwitchFallback
              : input.updateRequiredFallback),
          storeUrl: config.storeUrl,
        });
        setNudge(null);
        return;
      }

      const dismissKey = buildUpdateNudgeDismissKey(input.surface, config.latestVersion);
      if (
        shouldShowUpdateNudge({
          currentVersion: version,
          config,
          dismissKey,
        })
      ) {
        setNudge({
          message: input.updateNudgeFallback,
          storeUrl: config.storeUrl,
          dismissKey,
        });
      }
    })();
  }, [
    input.killSwitchFallback,
    input.surface,
    input.updateNudgeFallback,
    input.updateRequiredFallback,
  ]);

  const dismissNudge = useCallback(() => {
    if (!nudge) return;
    dismissUpdateNudge(nudge.dismissKey);
    setNudge(null);
  }, [nudge]);

  return { blocked, nudge, dismissNudge };
}
