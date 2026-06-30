import type { CommandSurface } from '../ai-command-registry.types.js';

/** Stable corpus id — shared by AI guide, /dashboard/guide anchors, and mobile help (ai-guide-1.1.1). */
export type GuideCorpusTopicId = string;

export type GuideCorpusGroup = 'core' | 'operations' | 'ai';

export type GuideCorpusContentKind =
  | 'title'
  | 'summary'
  | 'body'
  | 'step'
  | 'bullet'
  | 'problem'
  | 'solution'
  | 'callout-title'
  | 'callout-body'
  | 'example-command'
  | 'example-desc';

/** Pointer into frontend `guide.*` / `helpCenter.topics.*` i18n catalogs. */
export interface GuideCorpusContentRef {
  kind: GuideCorpusContentKind;
  i18nKey: string;
}

export interface GuideCorpusNavigateTarget {
  path: string;
  hash?: string;
}

/** One section from `/dashboard/guide` with stable `topicId` and i18n-backed content slots. */
export interface GuideCorpusTopic {
  topicId: GuideCorpusTopicId;
  surface: Extract<CommandSurface, 'dashboard'>;
  group: GuideCorpusGroup;
  /** HTML anchor id on `/dashboard/guide#…`. */
  anchor: string;
  /** Ordered content slots — resolved via frontend i18n keys at runtime. */
  content: readonly GuideCorpusContentRef[];
  navigate?: GuideCorpusNavigateTarget;
  /** Optional contextual help topic id (`help-center-topics.ts`). */
  helpCenterTopicId?: string;
}

export interface GuideCorpusTocGroup {
  id: GuideCorpusGroup;
  navLabelKey: string;
  topicIds: readonly GuideCorpusTopicId[];
}

export interface ResolvedGuideCorpusContent {
  kind: GuideCorpusContentKind;
  i18nKey: string;
  text: string;
}

export interface ResolvedGuideCorpusTopic {
  topicId: GuideCorpusTopicId;
  anchor: string;
  group: GuideCorpusGroup;
  title: string;
  summary?: string;
  body?: string;
  steps: string[];
  bullets: string[];
  navigate?: GuideCorpusNavigateTarget;
  content: ResolvedGuideCorpusContent[];
}
