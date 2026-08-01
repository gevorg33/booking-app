import type { CommandSurface } from '../ai-command-registry.types.js';
import type { PlanTierId } from '../../billing/plan-limits.js';

/** Surfaces with per-route JSON playbooks (ai-guide-1.1.2). */
export type GuideFlowSurface = Extract<
  CommandSurface,
  'dashboard' | 'provider' | 'customer' | 'public'
>;

/** Vertical overlay bundles merged by business vertical (ai-guide-1.1.3). */
export type GuideVerticalOverlayId = 'clinic' | 'tour' | 'retail';

/** Role scopes for playbook visibility (ai-guide-1.1.4). */
export type GuideFlowRoleScope =
  | 'owner'
  | 'manager'
  | 'receptionist'
  | 'provider'
  | 'customer';

export interface GuideFlowNavigateTarget {
  path: string;
  hash?: string;
  query?: Record<string, string>;
}

export interface GuideFlowStepDef {
  titleKey: string;
  bodyKey: string;
  /**
   * Optional concise progress-chrome title (e2e-bug.294).
   * Prefer this over humanizing the body when present.
   */
  shortTitleKey?: string;
  /** Optional shorter copy for TTS (ai-guide-1.4.4). */
  voiceSummaryKey?: string;
  navigate?: GuideFlowNavigateTarget;
}

/** Shared JSON schema for guide-flows (ai-guide-1.9.1). */
export interface GuideFlowPlaybookDef {
  topicId: string;
  surface: GuideFlowSurface;
  /** Routes this playbook applies to (exact or prefix match). */
  routes: readonly string[];
  titleKey: string;
  summaryKey?: string;
  /** Optional shorter summary for TTS (ai-guide-1.4.4). */
  voiceSummaryKey?: string;
  steps: readonly GuideFlowStepDef[];
  navigateTarget?: GuideFlowNavigateTarget;
  /** Optional link to dashboard corpus topic for grounding / handoffs. */
  corpusTopicId?: string;
  /** When set, playbook is visible only for these vertical overlays. */
  verticals?: readonly GuideVerticalOverlayId[];
  /** When set, playbook is hidden unless the viewer role matches. */
  roles?: readonly GuideFlowRoleScope[];
  /** When set, playbook is hidden unless a module flag is enabled (e.g. giftCards). */
  requiresModule?: readonly string[];
  /** Minimum subscription tier required (ai-guide-1.8.4, gap-6.2 / gap-7.1). */
  requiresPlan?: PlanTierId;
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
  surface: GuideFlowSurface;
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

export interface GuideFlowListContext {
  surface: GuideFlowSurface;
  route?: string;
  vertical?: string;
  businessType?: string;
  role?: string;
  roleProfile?: GuideFlowRoleScope;
  retailPosEnabled?: boolean;
  enabledModules?: readonly string[];
  /** Resolved entitlements tier from session `_planTierId` (ai-guide-1.8.4). */
  planTierId?: PlanTierId;
}

export interface GuideFlowRankedPlaybook {
  topicId: string;
  score: number;
  reasons: readonly string[];
}
