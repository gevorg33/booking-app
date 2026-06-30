/** Mobile guide types — mirror backend guide-flow.types (ai-guide-1.9.1). */

export type MobileGuideSurface = 'customer' | 'provider';

export type GuideVerticalOverlayId = 'clinic' | 'tour' | 'retail';

export type GuideFlowRoleScope =
  | 'owner'
  | 'manager'
  | 'receptionist'
  | 'provider'
  | 'customer';

export type MobileGuideLocale = 'en' | 'hy' | 'ru';

export type MobileGuidePlanTierId = 'solo' | 'starter' | 'business';

export interface GuideFlowNavigateTarget {
  path: string;
  hash?: string;
  query?: Record<string, string>;
}

export interface GuideFlowStepDef {
  titleKey: string;
  bodyKey: string;
  voiceSummaryKey?: string;
  navigate?: GuideFlowNavigateTarget;
}

export interface GuideFlowPlaybookDef {
  topicId: string;
  surface: MobileGuideSurface | 'dashboard' | 'public';
  routes: readonly string[];
  titleKey: string;
  summaryKey?: string;
  voiceSummaryKey?: string;
  steps: readonly GuideFlowStepDef[];
  navigateTarget?: GuideFlowNavigateTarget;
  corpusTopicId?: string;
  verticals?: readonly GuideVerticalOverlayId[];
  roles?: readonly GuideFlowRoleScope[];
  requiresModule?: readonly string[];
  requiresPlan?: MobileGuidePlanTierId;
  keywords?: readonly string[];
}

export interface GuideFlowOverlayBundle {
  id: GuideVerticalOverlayId;
  playbooks: readonly GuideFlowPlaybookDef[];
}

export interface ResolvedGuideFlowStep {
  title: string;
  body: string;
  voiceSummary?: string;
  navigate?: GuideFlowNavigateTarget;
}

export interface ResolvedGuideFlowPlaybook {
  topicId: string;
  surface: MobileGuideSurface;
  routes: readonly string[];
  title: string;
  summary?: string;
  voiceSummary?: string;
  steps: ResolvedGuideFlowStep[];
  navigateTarget?: GuideFlowNavigateTarget;
  corpusTopicId?: string;
  verticals?: readonly GuideVerticalOverlayId[];
  roles?: readonly GuideFlowRoleScope[];
  keywords?: readonly string[];
}

export interface MobileGuideListContext {
  surface: MobileGuideSurface;
  route?: string;
  vertical?: string;
  businessType?: string;
  roleProfile?: GuideFlowRoleScope;
  retailPosEnabled?: boolean;
  enabledModules?: readonly string[];
  planTierId?: MobileGuidePlanTierId;
}

export type MobileGuideMessageTree = { [key: string]: string | MobileGuideMessageTree };

export interface MobileGuideI18nBundle {
  en: MobileGuideMessageTree;
  hy: MobileGuideMessageTree;
  ru: MobileGuideMessageTree;
}

export interface MobileGuideBundle {
  surface: MobileGuideSurface;
  playbooks: readonly GuideFlowPlaybookDef[];
  overlays: readonly GuideFlowOverlayBundle[];
  i18n: MobileGuideI18nBundle;
}

/** Shipped with app assets — refreshed on app version / corpus sync (ai-guide-1.9.12). */
export interface MobileGuideOfflineManifest {
  surface: MobileGuideSurface;
  appVersion: string;
  corpusRevision: string;
  syncedAt: string;
  playbookCount: number;
  overlayCount: number;
  locales: readonly MobileGuideLocale[];
}
