import type { CommandResult } from './command-completion.types.js';
import {
  GUIDE_CORPUS_MATCH_THRESHOLD,
  isGuideCorpusMatchConfident,
  pickBestGuideCorpusTopic,
  rankGuideCorpusTopics,
  type GuideCorpusRankedTopic,
  type ProductGuideRetrieveQuery,
} from './ai-product-guide-ranking.util.js';
import {
  resolveGuideCorpusMatch,
  type GuideCorpusSemanticDeps,
} from './ai-product-guide-semantic.util.js';
import {
  pickBestGuideFlowPlaybook,
  rankGuideFlowPlaybooks,
} from './guide/guide-flow.corpus.util.js';
import type { GuideFlowPlaybookDef, GuideFlowRankedPlaybook } from './guide/guide-flow.types.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { resolveLocale } from '../../common/i18n/messages.js';

type MessageTree = { [key: string]: string | MessageTree };

export type GuideFlowMatch = GuideFlowRankedPlaybook & { playbook: GuideFlowPlaybookDef };
export type GuideCorpusMatch = GuideCorpusRankedTopic;

export type GuideMatchKind = 'flow' | 'corpus' | 'none';

export interface GuideKeywordMatchResolution {
  kind: GuideMatchKind;
  flowBest: GuideFlowMatch | null;
  corpusBest: GuideCorpusMatch | null;
}

export interface GuideFullMatchResolution extends GuideKeywordMatchResolution {
  retrievalPath: string;
  semanticScore: number | null;
}

function pickConfidentGuideMatch(
  flowBest: GuideFlowMatch | null,
  corpusBest: GuideCorpusMatch | null,
): GuideKeywordMatchResolution {
  const flowConfident = flowBest ? isGuideCorpusMatchConfident(flowBest.score) : false;
  const corpusConfident = corpusBest ? isGuideCorpusMatchConfident(corpusBest.score) : false;

  if (flowConfident && (!corpusConfident || flowBest!.score >= (corpusBest?.score ?? 0))) {
    return { kind: 'flow', flowBest: flowBest!, corpusBest };
  }
  if (corpusConfident && corpusBest) {
    return { kind: 'corpus', flowBest, corpusBest };
  }
  return { kind: 'none', flowBest, corpusBest };
}

export function resolveGuideKeywordMatch(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
): GuideKeywordMatchResolution {
  const flowBest = pickBestGuideFlowPlaybook(query, messages);
  const corpusBest = pickBestGuideCorpusTopic(query, messages);
  return pickConfidentGuideMatch(flowBest, corpusBest);
}

export async function resolveGuideFullMatch(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
  deps?: GuideCorpusSemanticDeps,
): Promise<GuideFullMatchResolution> {
  const keyword = resolveGuideKeywordMatch(query, messages);
  if (keyword.kind !== 'none') {
    return {
      ...keyword,
      retrievalPath: keyword.kind === 'flow' ? 'guide-flow' : 'keyword',
      semanticScore: null,
    };
  }

  const corpusResolution = await resolveGuideCorpusMatch(query, messages, deps);
  const corpusBest = corpusResolution.best;
  if (corpusBest && isGuideCorpusMatchConfident(corpusBest.score)) {
    return {
      kind: 'corpus',
      flowBest: pickBestGuideFlowPlaybook(query, messages),
      corpusBest,
      retrievalPath: corpusResolution.retrievalPath,
      semanticScore: corpusResolution.semanticBest?.score ?? null,
    };
  }

  const flowBest = pickBestGuideFlowPlaybook(query, messages);
  if (flowBest && isGuideCorpusMatchConfident(flowBest.score)) {
    return {
      kind: 'flow',
      flowBest,
      corpusBest,
      retrievalPath: 'guide-flow',
      semanticScore: corpusResolution.semanticBest?.score ?? null,
    };
  }

  return {
    kind: 'none',
    flowBest,
    corpusBest,
    retrievalPath: corpusResolution.retrievalPath,
    semanticScore: corpusResolution.semanticBest?.score ?? null,
  };
}

export function buildGuideClarifyResult(
  intent: string,
  match: Pick<GuideKeywordMatchResolution, 'flowBest' | 'corpusBest'>,
  route?: string | null,
  extra?: Record<string, unknown>,
): CommandResult {
  const suggested =
    match.flowBest?.topicId ?? match.corpusBest?.topicId ?? undefined;
  return {
    success: false,
    action: intent,
    summary:
      'I could not match that to a guide topic yet. Try naming the page — Schedule, Operations, AI command bar — or open Help & guide from the sidebar.',
    details: {
      clarify: true,
      confidence: match.corpusBest?.score ?? match.flowBest?.score ?? 0,
      threshold: GUIDE_CORPUS_MATCH_THRESHOLD,
      suggestedTopicIds: suggested ? [suggested] : [],
      route: route ?? null,
      ...extra,
    },
  };
}

export function resolveGuideMessages(locale?: string): MessageTree {
  return getFrontendGuideCorpusMessages(resolveLocale(locale));
}

export function rankAllGuideTopics(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
): Array<
  | ({ source: 'flow' } & GuideFlowRankedPlaybook)
  | ({ source: 'corpus' } & GuideCorpusRankedTopic)
> {
  const flow = rankGuideFlowPlaybooks(query, messages).map((row) => ({
    source: 'flow' as const,
    ...row,
  }));
  const corpus = rankGuideCorpusTopics(query, messages).map((row) => ({
    source: 'corpus' as const,
    ...row,
  }));
  return [...flow, ...corpus].sort(
    (a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId),
  );
}
