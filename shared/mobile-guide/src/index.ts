export type {
  GuideFlowNavigateTarget,
  GuideFlowOverlayBundle,
  GuideFlowPlaybookDef,
  GuideFlowRoleScope,
  GuideFlowStepDef,
  GuideVerticalOverlayId,
  MobileGuideBundle,
  MobileGuideI18nBundle,
  MobileGuideListContext,
  MobileGuideLocale,
  MobileGuideOfflineManifest,
  MobileGuideMessageTree,
  MobileGuidePlanTierId,
  MobileGuideSurface,
  ResolvedGuideFlowPlaybook,
  ResolvedGuideFlowStep,
} from './mobile-guide.types.ts';

export {
  resolveMobileGuideI18nKey,
  resolveMobileGuideLocaleMessages,
  listMobileGuideI18nKeysForPlaybook,
} from './mobile-guide.i18n.ts';

export {
  resolveActiveGuideVerticalOverlays,
  resolveGuideFlowRoleScope,
  isGuideFlowPlaybookVisible,
  mergeGuideFlowPlaybooks,
  matchGuideFlowRoute,
} from './mobile-guide.merge.util.ts';

export {
  resolveGuideFlowPlaybook,
  listGuideTopics,
  resolveGuidePlaybook,
  assertMobileGuideCatalogIntegrity,
  assertMobileGuideI18nCoverage,
} from './mobile-guide.resolve.util.ts';

export { createMobileGuideModule, type MobileGuideModule } from './mobile-guide.factory.ts';

export {
  OFFLINE_GUIDE_LOCALES,
  assertMobileGuideOfflineBundle,
  assertMobileGuideOfflineManifestShape,
  isMobileGuideOfflineBundleFresh,
  resolveEmbeddedMobileGuideAppVersion,
} from './mobile-guide-offline.util.ts';

export {
  MOBILE_GUIDE_ASSISTANT_SEED_EVENT,
  formatGuideTopicAskPrompt,
  fireMobileGuideAssistantSeed,
  type MobileGuideAssistantSeedDetail,
} from './mobile-guide-topic-ask.util.ts';
