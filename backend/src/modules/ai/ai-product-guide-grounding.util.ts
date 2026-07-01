import { COMMAND_REGISTRY_BY_ID } from './ai-command-registry.js';
import type { GuideResponse } from './command-completion.types.js';
import {
  DASHBOARD_GUIDE_CORPUS_TOPICS,
  GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID,
} from './guide/dashboard-guide-corpus.manifest.js';
import { DASHBOARD_ROUTE_PRIMARY_TOPIC } from './ai-product-guide-ranking.util.js';
import type { AppGuideIntent } from './ai-product-guide.util.js';
import type { CommandResult } from './command-completion.types.js';
import { collectUnknownSettingsPathIssues } from './ai-product-guide-settings-grounding.util.js';
import { listAllGuideFlowPlaybookDefs } from './guide/guide-flow.loader.js';
import { GUIDE_FLOW_ROUTE_PRIMARY_TOPIC } from './guide/guide-flow.routes.manifest.js';

export type GuideGroundingIssueCode =
  | 'unknown_topic_id'
  | 'unknown_route'
  | 'unknown_handoff_action'
  | 'unknown_intent_citation'
  | 'unknown_setting_key';

export interface GuideGroundingOptions {
  /** When true, reject unknown `settings.*` / `business.settings.*` citations (LLM polish path). */
  validateSettingsKeys?: boolean;
  /** Extra allowed settings paths from the source corpus for this topic. */
  corpusSettingsPaths?: readonly string[];
}

export interface GuideGroundingIssue {
  code: GuideGroundingIssueCode;
  message: string;
  value?: string;
}

export interface GuideGroundingResult {
  ok: boolean;
  issues: GuideGroundingIssue[];
}

const GROUNDED_TOPIC_IDS = new Set([
  ...DASHBOARD_GUIDE_CORPUS_TOPICS.map((topic) => topic.topicId),
  ...listAllGuideFlowPlaybookDefs().map((playbook) => playbook.topicId),
]);

const GROUNDED_ROUTE_PREFIXES = [
  ...Object.keys(DASHBOARD_ROUTE_PRIMARY_TOPIC),
  ...Object.keys(GUIDE_FLOW_ROUTE_PRIMARY_TOPIC),
  '/dashboard/settings',
  '/dashboard/guide',
  '/dashboard/operations',
].sort((a, b) => b.length - a.length);

const GROUNDED_GUIDE_ANCHORS = new Set(
  Object.keys(GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID),
);

/** Public booking web + consumer assistant use slug-relative segments (not /book/...). */
const PUBLIC_BOOKING_RELATIVE_NAV_SEGMENTS = new Set([
  'professionals',
  'services',
  'checkout',
  'profile',
  'account',
  'any',
  'guide',
  'home',
  'packages',
]);

/** Intent-shaped tokens that may appear in synthesized guide copy. */
const INTENT_CITATION_PATTERN = /\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g;

const INTENT_CITATION_PREFIX =
  /^(configure_|apply_|create_|cancel_|enable_|disable_|bulk_|payment_|mark_|update_|delete_|invite_|complete_)/;

export function isGroundedGuideRoute(path: string | null | undefined): boolean {
  if (typeof path !== 'string' || !path) return false;

  if (!path.startsWith('/')) {
    return PUBLIC_BOOKING_RELATIVE_NAV_SEGMENTS.has(path);
  }

  if (path.startsWith('/dashboard')) {
    return GROUNDED_ROUTE_PREFIXES.some((prefix) => {
      if (path === prefix) return true;
      if (prefix === '/dashboard') return false;
      return path.startsWith(`${prefix}/`);
    });
  }

  return Object.keys(GUIDE_FLOW_ROUTE_PRIMARY_TOPIC).some((prefix) => {
    if (path === prefix) return true;
    return path.startsWith(`${prefix}/`);
  });
}

function pushIssue(
  issues: GuideGroundingIssue[],
  issue: GuideGroundingIssue,
): void {
  if (
    issues.some((row) => row.code === issue.code && row.value === issue.value)
  )
    return;
  issues.push(issue);
}

function verifyGuideNavigateTarget(
  issues: GuideGroundingIssue[],
  target: { path?: string; hash?: string } | undefined,
  label: string,
): void {
  if (!target?.path) return;
  const hashIndex = target.path.indexOf('#');
  const path = hashIndex === -1 ? target.path : target.path.slice(0, hashIndex);
  const hash =
    target.hash ??
    (hashIndex === -1 ? undefined : target.path.slice(hashIndex + 1));
  if (!isGroundedGuideRoute(path)) {
    pushIssue(issues, {
      code: 'unknown_route',
      message: `${label} cites unknown dashboard route`,
      value: path,
    });
  }
  if (
    path === '/dashboard/guide' &&
    hash &&
    !GROUNDED_GUIDE_ANCHORS.has(hash.replace(/^#/, ''))
  ) {
    pushIssue(issues, {
      code: 'unknown_route',
      message: `${label} cites unknown guide anchor`,
      value: hash,
    });
  }
}

function collectIntentCitationIssues(
  text: string,
  issues: GuideGroundingIssue[],
): void {
  for (const match of text.matchAll(INTENT_CITATION_PATTERN)) {
    const token = match[1];
    if (!INTENT_CITATION_PREFIX.test(token)) continue;
    if (COMMAND_REGISTRY_BY_ID.has(token)) continue;
    pushIssue(issues, {
      code: 'unknown_intent_citation',
      message: 'Guide text cites unknown intent id',
      value: token,
    });
  }
}

function collectSettingsCitationIssues(
  text: string,
  issues: GuideGroundingIssue[],
  options?: GuideGroundingOptions,
): void {
  if (!options?.validateSettingsKeys) return;
  for (const issue of collectUnknownSettingsPathIssues(
    text,
    options.corpusSettingsPaths,
  )) {
    pushIssue(issues, issue);
  }
}

/** Reject or clarify when a guide payload cites unknown routes, topics, settings, or handoff actions (ai-guide-1.2.4). */
export function verifyGuideResponseGrounding(
  guide: GuideResponse,
  options?: GuideGroundingOptions,
): GuideGroundingResult {
  const issues: GuideGroundingIssue[] = [];

  if (guide.topicId && !GROUNDED_TOPIC_IDS.has(guide.topicId)) {
    pushIssue(issues, {
      code: 'unknown_topic_id',
      message: 'Unknown guide topicId',
      value: guide.topicId,
    });
  }

  for (const source of guide.sources ?? []) {
    if (!GROUNDED_TOPIC_IDS.has(source.topicId)) {
      pushIssue(issues, {
        code: 'unknown_topic_id',
        message: 'Unknown guide source topicId',
        value: source.topicId,
      });
    }
  }

  verifyGuideNavigateTarget(issues, guide.navigate, 'Guide navigate');
  for (const step of guide.steps) {
    verifyGuideNavigateTarget(issues, step.navigate, `Step "${step.title}"`);
  }

  for (const related of guide.relatedActions ?? []) {
    if (!COMMAND_REGISTRY_BY_ID.has(related.action)) {
      pushIssue(issues, {
        code: 'unknown_handoff_action',
        message: 'Unknown guide handoff action',
        value: related.action,
      });
    }
  }

  const text = [
    guide.summary,
    ...guide.steps.map((step) => `${step.title}\n${step.body}`),
  ].join('\n');
  collectIntentCitationIssues(text, issues);
  collectSettingsCitationIssues(text, issues, options);

  return { ok: issues.length === 0, issues };
}

export function buildGuideGroundingClarifyResult(
  intent: AppGuideIntent,
  grounding: GuideGroundingResult,
): CommandResult {
  return {
    success: false,
    action: intent,
    summary:
      'I matched a guide topic but could not verify the answer against known dashboard routes and actions. Open Help & guide from the sidebar or try a more specific question.',
    details: {
      clarify: true,
      groundingFailed: true,
      groundingIssues: grounding.issues,
    },
  };
}
