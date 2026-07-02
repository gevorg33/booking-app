import type { AccessTier } from './access-control.matrix.js';
import {
  buildDashboardGuideTopicUrl,
  DASHBOARD_GUIDE_CORPUS_TOPICS,
} from './guide/dashboard-guide-corpus.manifest.js';
import {
  getGuideCorpusTopic,
  listGuideCorpusTopics,
  resolveGuideCorpusTopic,
} from './guide/ai-guide-corpus.util.js';
import type { GuideCorpusTopicId } from './guide/ai-guide-corpus.types.js';
import type { AppGuideIntent } from './ai-product-guide.util.js';

type MessageTree = { [key: string]: string | MessageTree };

/** Minimum ranked score to serve deterministic corpus (ai-guide-1.2.3). */
export const GUIDE_CORPUS_MATCH_THRESHOLD = 0.55;

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'to',
  'for',
  'of',
  'in',
  'on',
  'at',
  'is',
  'are',
  'do',
  'i',
  'me',
  'my',
  'our',
  'this',
  'that',
  'with',
  'how',
  'what',
  'where',
  'which',
  'can',
  'please',
  'help',
  'show',
  'explain',
  'guide',
  'page',
  'screen',
]);

/** Optional retrieval keywords per topic (ai-guide-1.2.1). */
export const GUIDE_TOPIC_RETRIEVAL_KEYWORDS: Partial<
  Record<GuideCorpusTopicId, readonly string[]>
> = {
  'dashboard.ai.command-bar': ['command bar', 'orchestrix', 'sparkle button'],
  'dashboard.ai.approval': ['approve', 'approval', 'plan diff'],
  'dashboard.core.schedule': [
    'schedule template',
    'weekly schedule',
    'block schedule',
  ],
  'dashboard.core.employees': [
    'online payment',
    'prepayment',
    'service catalog',
    'add service',
    'add staff',
  ],
  'dashboard.operations.inventory': ['inventory', 'stock', 'link products'],
};

/** Primary corpus topic for a dashboard route (ai-guide-1.2.1). */
export const DASHBOARD_ROUTE_PRIMARY_TOPIC: Readonly<
  Record<string, GuideCorpusTopicId>
> = {
  '/dashboard': 'dashboard.ai.dashboard',
  '/dashboard/schedule': 'dashboard.core.schedule',
  '/dashboard/calendar': 'dashboard.core.calendar',
  '/dashboard/bookings': 'dashboard.core.calendar',
  '/dashboard/appointments': 'dashboard.core.calendar',
  '/dashboard/customers': 'dashboard.operations.workflow',
  '/dashboard/employees': 'dashboard.core.employees',
  '/dashboard/services': 'dashboard.core.employees',
  '/dashboard/reports': 'dashboard.operations.pl',
  '/dashboard/onboarding': 'dashboard.ai.getting-started',
  '/dashboard/operations': 'dashboard.operations.overview',
  '/dashboard/ai-ops': 'dashboard.ai.ops',
  '/dashboard/reviews': 'dashboard.operations.problems',
  '/dashboard/settings': 'dashboard.ai.getting-started',
  '/dashboard/guide': 'dashboard.ai.overview',
};

/** Dashboard nav routes with AI context — sync with frontend `AI_ROUTE_CONTEXT_HINTS`. */
export const DASHBOARD_GUIDE_NAV_ROUTES = [
  '/dashboard',
  '/dashboard/schedule',
  '/dashboard/calendar',
  '/dashboard/bookings',
  '/dashboard/appointments',
  '/dashboard/customers',
  '/dashboard/employees',
  '/dashboard/services',
  '/dashboard/reports',
  '/dashboard/onboarding',
  '/dashboard/ai-ops',
  '/dashboard/reviews',
] as const;

/** Routes explicitly excluded from primary-topic coverage (use retrieval only). */
export const DASHBOARD_GUIDE_NO_PRIMARY_ROUTES: readonly string[] = [];

export interface ProductGuideRetrieveQuery {
  prompt: string;
  intent: AppGuideIntent;
  route?: string;
  role?: AccessTier;
  vertical?: string;
  locale?: string;
  topicId?: string;
  retailPosEnabled?: boolean;
  enabledModules?: readonly string[];
  roleProfile?: import('./guide/guide-flow.types.js').GuideFlowRoleScope;
  surface?: import('./guide/guide-flow.types.js').GuideFlowSurface;
  planTierId?: import('../billing/plan-limits.js').PlanTierId;
}

export interface GuideCorpusRankedTopic {
  topicId: GuideCorpusTopicId;
  score: number;
  reasons: readonly string[];
}

function tokenizePrompt(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

/** Retrieval haystack for keyword + semantic ranking (ai-guide-1.2.1 / 1.2.3). */
export function buildGuideTopicRetrievalHaystack(
  topicId: GuideCorpusTopicId,
  messages: MessageTree,
): string {
  const resolved = resolveGuideCorpusTopic(topicId, messages);
  if (!resolved) return topicId;
  return [
    resolved.title,
    resolved.summary,
    resolved.body,
    ...resolved.steps,
    ...resolved.bullets,
    ...resolved.content.map((row) => row.text),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Rank dashboard guide corpus topics for retrieval (ai-guide-1.2.1). */
export function rankGuideCorpusTopics(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
): GuideCorpusRankedTopic[] {
  const topics = listGuideCorpusTopics({ surface: 'dashboard' });
  const promptTokens = tokenizePrompt(query.prompt);
  const routePrimary = query.route
    ? DASHBOARD_ROUTE_PRIMARY_TOPIC[query.route]
    : undefined;

  const ranked = topics.map((topic) => {
    let score = 0;
    const reasons: string[] = [];

    if (query.topicId && topic.topicId === query.topicId) {
      score += 1;
      reasons.push('explicit_topicId');
    }

    if (routePrimary === topic.topicId) {
      score += 0.45;
      reasons.push('route_primary');
    }

    if (query.route && topic.navigate?.path === query.route) {
      score += 0.35;
      reasons.push('route_navigate');
    }

    if (
      query.route &&
      buildDashboardGuideTopicUrl(topic.topicId).includes(query.route)
    ) {
      score += 0.05;
    }

    const haystack = buildGuideTopicRetrievalHaystack(topic.topicId, messages);
    const overlap = promptTokens.filter((token) => haystack.includes(token));
    if (overlap.length > 0) {
      score += Math.min(0.4, overlap.length * 0.08);
      reasons.push('prompt_overlap');
      const matchedRatio = overlap.length / Math.max(1, promptTokens.length);
      if (overlap.length >= 2 && matchedRatio >= 0.5) {
        score += 0.45;
        reasons.push('prompt_overlap_strong');
      }
    }

    const anchorPhrase = topic.anchor.replace(/^ai-/, 'ai ').replace(/-/g, ' ');
    if (anchorPhrase && query.prompt.toLowerCase().includes(anchorPhrase)) {
      score += 0.35;
      reasons.push('anchor_phrase');
    }

    for (const phrase of GUIDE_TOPIC_RETRIEVAL_KEYWORDS[topic.topicId] ?? []) {
      if (query.prompt.toLowerCase().includes(phrase)) {
        score += 0.55;
        reasons.push('topic_keyword');
        break;
      }
    }

    if (
      query.intent === 'explain_current_screen' &&
      routePrimary === topic.topicId
    ) {
      score += 0.25;
      reasons.push('screen_route_bias');
    }

    if (
      query.intent === 'guide_user_flow' &&
      topic.content.some((slot) => slot.kind === 'step')
    ) {
      score += 0.1;
      reasons.push('flow_step_bias');
    }

    if (
      query.intent === 'explain_app_feature' &&
      (topic.group === 'core' || topic.group === 'ai')
    ) {
      score += 0.05;
      reasons.push('feature_group_bias');
    }

    if (
      query.intent === 'explain_current_screen' &&
      topic.anchor.includes('ai-')
    ) {
      score -= 0.05;
    }

    return { topicId: topic.topicId, score, reasons };
  });

  return ranked
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId));
}

export function pickBestGuideCorpusTopic(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
): GuideCorpusRankedTopic | null {
  const ranked = rankGuideCorpusTopics(query, messages);
  return ranked[0] ?? null;
}

export function isGuideCorpusMatchConfident(score: number): boolean {
  return score >= GUIDE_CORPUS_MATCH_THRESHOLD;
}

export function listGuideTopicsForRoute(route?: string): GuideCorpusTopicId[] {
  if (!route) return [];
  const primary = DASHBOARD_ROUTE_PRIMARY_TOPIC[route];
  if (!primary) return [];
  const topic = getGuideCorpusTopic(primary);
  if (!topic) return [primary];
  return DASHBOARD_GUIDE_CORPUS_TOPICS.filter(
    (row) => row.group === topic.group,
  ).map((row) => row.topicId);
}
