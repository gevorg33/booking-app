import { useEffect, useRef } from 'react';
import { resolveAppAnalyticsPlatform } from '../lib/app-analytics-context.util';
import {
  hideNativeSplashWhenInteractive,
  isLikelyLowEndAndroid,
  isWithinStartupTtiBudget,
  readDeviceMemoryGb,
  readHardwareConcurrency,
  readMsSinceStartupBoot,
  resolveStartupTtiBudgetMs,
} from '../lib/app-startup.util';
import { track } from '../lib/app-analytics';

/** Records time-to-interactive once routes mount (adopt-5.2). */
export function AppStartupBridge() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    void (async () => {
      const platform = resolveAppAnalyticsPlatform();
      const lowEndAndroid = isLikelyLowEndAndroid({
        platform,
        hardwareConcurrency: readHardwareConcurrency(),
        deviceMemoryGb: readDeviceMemoryGb(),
      });
      const ttiBudgetMs = resolveStartupTtiBudgetMs({ platform, lowEndAndroid });
      const startupMs = readMsSinceStartupBoot();

      await hideNativeSplashWhenInteractive();

      track('app_interactive', {
        startupMs: startupMs ?? undefined,
        ttiBudgetMs,
        lowEndAndroid,
        crashFree: isWithinStartupTtiBudget(startupMs, ttiBudgetMs),
      });
    })();
  }, []);

  return null;
}
