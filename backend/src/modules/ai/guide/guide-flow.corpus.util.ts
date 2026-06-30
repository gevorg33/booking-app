import { resolveGuideCorpusI18nKey } from './ai-guide-corpus-i18n.util.js';
import { listAllGuideFlowPlaybookDefs } from './guide-flow.loader.js';
import type { GuideResponse, GuideStep } from '../command-completion.types.js';
import { enrichGuideResponseVoiceSummaries } from '../ai-product-guide-voice.util.js';
import type {
  GuideFlowPlaybookDef,
  GuideFlowRankedPlaybook,
  GuideFlowRoleScope,
  ResolvedGuideFlowPlaybook,
} from './guide-flow.types.js';
import type { ProductGuideRetrieveQuery } from '../ai-product-guide-ranking.util.js';
import {
  matchGuideFlowRoute,
  mergeGuideFlowPlaybooks,
  pickGuideFlowPlaybookForRoute,
  resolveGuideFlowRoleScope,
  resolveGuideFlowSurfaceFromRoute,
} from './guide-flow.merge.util.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide-flow.routes.manifest.js';

type MessageTree = { [key: string]: string | MessageTree };

function resolveFlowText(messages: MessageTree, key: string): string {
  return resolveGuideCorpusI18nKey(messages, key) ?? key;
}

export function resolveGuideFlowPlaybook(
  playbook: GuideFlowPlaybookDef,
  messages: MessageTree,
): ResolvedGuideFlowPlaybook {
  return {
    topicId: playbook.topicId,
    surface: playbook.surface,
    routes: playbook.routes,
    title: resolveFlowText(messages, playbook.titleKey),
    summary: playbook.summaryKey
      ? resolveFlowText(messages, playbook.summaryKey)
      : undefined,
    voiceSummary: playbook.voiceSummaryKey
      ? resolveFlowText(messages, playbook.voiceSummaryKey)
      : undefined,
    steps: playbook.steps.map((step) => ({
      title: resolveFlowText(messages, step.titleKey),
      body: resolveFlowText(messages, step.bodyKey),
      voiceSummary: step.voiceSummaryKey
        ? resolveFlowText(messages, step.voiceSummaryKey)
        : undefined,
      navigate: step.navigate,
    })),
    navigateTarget: playbook.navigateTarget,
    corpusTopicId: playbook.corpusTopicId,
    verticals: playbook.verticals,
    roles: playbook.roles,
    keywords: playbook.keywords,
  };
}

export function buildGuideResponseFromFlowPlaybook(
  resolved: ResolvedGuideFlowPlaybook,
): GuideResponse {
  const steps: GuideStep[] = resolved.steps.map((step, index) => ({
    title: step.title,
    body: step.body,
    navigate:
      step.navigate ??
      (index === 0 && resolved.navigateTarget ? resolved.navigateTarget : undefined),
  }));

  const summary =
    resolved.summary ??
    `${resolved.title}${steps.length ? ` — ${steps.length} steps` : ''}`;

  return enrichGuideResponseVoiceSummaries({
    topicId: resolved.topicId,
    summary,
    voiceSummary: resolved.voiceSummary,
    steps,
    navigate: resolved.navigateTarget,
    sources: [
      {
        topicId: resolved.corpusTopicId ?? resolved.topicId,
        label: resolved.title,
        kind: 'topic',
      },
    ],
  });
}

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

function tokenizePrompt(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function buildGuideFlowListContext(
  query: ProductGuideRetrieveQuery,
): Parameters<typeof mergeGuideFlowPlaybooks>[0] {
  const surface = query.surface ?? resolveGuideFlowSurfaceFromRoute(query.route) ?? 'dashboard';
  return {
    surface,
    route: query.route,
    vertical: query.vertical,
    businessType: query.vertical,
    role: query.role,
    roleProfile:
      resolveGuideFlowRoleScope({
        surface,
        role: query.role,
        roleProfile: query.roleProfile as GuideFlowRoleScope | undefined,
      }) ?? undefined,
    retailPosEnabled: query.retailPosEnabled,
    enabledModules: query.enabledModules,
    planTierId: query.planTierId,
  };
}

export function rankGuideFlowPlaybookDefs(
  playbooks: readonly GuideFlowPlaybookDef[],
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
): GuideFlowRankedPlaybook[] {
  const promptTokens = tokenizePrompt(query.prompt);
  const routePrimaryTopicId = resolveGuideFlowRoutePrimaryTopic(query.route);

  const ranked = playbooks.map((playbook) => {
    let score = 0;
    const reasons: string[] = [];

    if (query.topicId && playbook.topicId === query.topicId) {
      score += 1;
      reasons.push('explicit_topicId');
    }
    if (query.topicId && playbook.corpusTopicId === query.topicId) {
      score += 0.85;
      reasons.push('corpus_topicId');
    }

    if (routePrimaryTopicId === playbook.topicId) {
      score += 0.5;
      reasons.push('route_primary');
    }

    if (matchGuideFlowRoute(query.route, playbook)) {
      score += 0.25;
      reasons.push('route_match');
    }

    const haystack = [
      playbook.topicId,
      resolveFlowText(messages, playbook.titleKey),
      playbook.summaryKey ? resolveFlowText(messages, playbook.summaryKey) : '',
      ...playbook.steps.flatMap((step) => [
        resolveFlowText(messages, step.titleKey),
        resolveFlowText(messages, step.bodyKey),
      ]),
      ...(playbook.keywords ?? []),
    ]
      .join(' ')
      .toLowerCase();

    const overlap = promptTokens.filter((token) => haystack.includes(token));
    if (overlap.length > 0) {
      score += Math.min(0.35, overlap.length * 0.07);
      reasons.push('prompt_overlap');
    }

    for (const phrase of playbook.keywords ?? []) {
      if (query.prompt.toLowerCase().includes(phrase.toLowerCase())) {
        score += 0.45;
        reasons.push('playbook_keyword');
        break;
      }
    }

    if (query.intent === 'explain_current_screen' && routePrimaryTopicId === playbook.topicId) {
      score += 0.2;
      reasons.push('screen_route_bias');
    }

    if (query.intent === 'guide_user_flow') {
      score += 0.05;
      reasons.push('flow_bias');
    }

    return { topicId: playbook.topicId, score, reasons };
  });

  return ranked
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId));
}

export function rankGuideFlowPlaybooks(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
): GuideFlowRankedPlaybook[] {
  const ctx = buildGuideFlowListContext(query);
  const playbooks = mergeGuideFlowPlaybooks(ctx);
  return rankGuideFlowPlaybookDefs(playbooks, query, messages);
}

export function pickBestGuideFlowPlaybook(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
): (GuideFlowRankedPlaybook & { playbook: GuideFlowPlaybookDef }) | null {
  const ctx = buildGuideFlowListContext(query);
  const playbooks = mergeGuideFlowPlaybooks(ctx);
  const byId = new Map(playbooks.map((row) => [row.topicId, row]));
  const ranked = rankGuideFlowPlaybooks(query, messages);
  const best = ranked[0];
  if (!best) return null;
  const playbook = byId.get(best.topicId);
  if (!playbook) return null;
  return { ...best, playbook };
}

export function listGuideFlowI18nKeys(playbook: GuideFlowPlaybookDef): string[] {
  const keys = [playbook.titleKey];
  if (playbook.summaryKey) keys.push(playbook.summaryKey);
  if (playbook.voiceSummaryKey) keys.push(playbook.voiceSummaryKey);
  for (const step of playbook.steps) {
    keys.push(step.titleKey, step.bodyKey);
    if (step.voiceSummaryKey) keys.push(step.voiceSummaryKey);
  }
  return keys;
}

export function listAllGuideFlowI18nKeys(): string[] {
  return listAllGuideFlowPlaybookDefs().flatMap((playbook) =>
    listGuideFlowI18nKeys(playbook),
  );
}
