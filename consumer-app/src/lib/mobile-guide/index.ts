import {
  assertMobileGuideOfflineBundle,
  resolveEmbeddedMobileGuideAppVersion,
} from '@mobile-guide/mobile-guide-offline.util.ts';
import { createMobileGuideModule } from '@mobile-guide/mobile-guide.factory.ts';
import {
  MOBILE_GUIDE_BUNDLE,
  MOBILE_GUIDE_OFFLINE_MANIFEST,
} from './mobile-guide.bundle.ts';

/** Consumer mobile guide — offline playbook corpus (ai-guide-1.9.1 / 1.9.12). */
export const consumerMobileGuide = createMobileGuideModule(MOBILE_GUIDE_BUNDLE);

assertMobileGuideOfflineBundle({
  manifest: MOBILE_GUIDE_OFFLINE_MANIFEST,
  bundle: MOBILE_GUIDE_BUNDLE,
  appVersion: resolveEmbeddedMobileGuideAppVersion(
    import.meta.env.VITE_APP_VERSION,
    MOBILE_GUIDE_OFFLINE_MANIFEST.appVersion,
  ),
});

export * from '@mobile-guide/index.ts';
