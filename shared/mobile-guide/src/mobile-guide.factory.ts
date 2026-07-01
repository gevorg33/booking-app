import type {
  GuideFlowPlaybookDef,
  MobileGuideBundle,
  MobileGuideListContext,
  MobileGuideLocale,
  ResolvedGuideFlowPlaybook,
} from './mobile-guide.types.ts';
import {
  assertMobileGuideCatalogIntegrity,
  assertMobileGuideI18nCoverage,
  listGuideTopics,
  resolveGuidePlaybook,
  resolveGuideFlowPlaybook,
} from './mobile-guide.resolve.util.ts';

export interface MobileGuideModule {
  bundle: MobileGuideBundle;
  listGuideTopics: (ctx: MobileGuideListContext) => GuideFlowPlaybookDef[];
  resolveGuidePlaybook: (
    topicId: string,
    locale: MobileGuideLocale,
    ctx: MobileGuideListContext,
  ) => ResolvedGuideFlowPlaybook | null;
  resolveGuideFlowPlaybook: (
    playbook: GuideFlowPlaybookDef,
    locale: MobileGuideLocale,
  ) => ResolvedGuideFlowPlaybook;
  assertIntegrity: () => void;
  assertI18nCoverage: () => void;
}

export function createMobileGuideModule(bundle: MobileGuideBundle): MobileGuideModule {
  return {
    bundle,
    listGuideTopics: (ctx) => listGuideTopics(ctx, bundle),
    resolveGuidePlaybook: (topicId, locale, ctx) =>
      resolveGuidePlaybook(topicId, locale, ctx, bundle),
    resolveGuideFlowPlaybook: (playbook, locale) =>
      resolveGuideFlowPlaybook(playbook, locale, bundle),
    assertIntegrity: () => assertMobileGuideCatalogIntegrity(bundle),
    assertI18nCoverage: () => assertMobileGuideI18nCoverage(bundle),
  };
}
