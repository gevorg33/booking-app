import { listProviderGuideUiI18nKeys, PROVIDER_GUIDE_UI_I18N_KEYS } from './provider-app-i18n.js';
import { MOBILE_GUIDE_BUNDLE } from './mobile-guide/mobile-guide.bundle.ts';
import { buildProviderGuideCopyScenarios } from './provider-guide.copy.util.js';

/** Synced with bundled provider playbooks — ai-guide-1.9.10.
 *  Flow HY/RU: `backend/.../guide-flow-provider-i18n.{hy,ru}.json` via `scripts/sync-provider-guide-i18n.py`. */
export const PROVIDER_GUIDE_COPY_SCENARIOS = buildProviderGuideCopyScenarios(
  MOBILE_GUIDE_BUNDLE,
);

export { PROVIDER_GUIDE_UI_I18N_KEYS };

export const PROVIDER_GUIDE_UI_COPY_KEYS = listProviderGuideUiI18nKeys();
