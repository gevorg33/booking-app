import type { CapacitorConfig } from '@capacitor/cli';

/**
 * @deprecated Native iOS/Android builds use `provider-app/` (Ionic React, bundled static app).
 * This config remains for legacy reference only — do not use for new native builds.
 */
const config: CapacitorConfig = {
  appId: 'com.optischedule.provider.legacy',
  appName: 'OptiSchedule Provider (Legacy)',
  webDir: 'mobile/www',
};

export default config;
