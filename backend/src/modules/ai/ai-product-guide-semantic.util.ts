import type { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type { AiCallContext } from '../integrations/openai/openai.types.js';
import {
  GUIDE_CORPUS_MATCH_THRESHOLD,
  GUIDE_TOPIC_RETRIEVAL_KEYWORDS,
  isGuideCorpusMatchConfident,
  rankGuideCorpusTopics,
  type GuideCorpusRankedTopic,
  type ProductGuideRetrieveQuery,
} from './ai-product-guide-ranking.util.js';
import {
  listGuideCorpusTopics,
  resolveGuideCorpusTopic,
} from './guide/ai-guide-corpus.util.js';
import type { GuideCorpusTopicId } from './guide/ai-guide-corpus.types.js';
import {
  cosineSimilarityVectors,
  scoreTokenCosineBetweenPhrases,
  shouldUseDeterministicSemanticFallback,
} from './ai-semantic-intent.util.js';

type MessageTree = { [key: string]: string | MessageTree };

/** Minimum semantic score on short topic anchors (deterministic token cosine). */
export const GUIDE_SEMANTIC_MATCH_THRESHOLD = 0.42;

/** Minimum embedding cosine on short topic anchors. */
export const GUIDE_SEMANTIC_EMBEDDING_THRESHOLD = 0.58;

export type GuideCorpusRetrievalPath = 'keyword' | 'semantic' | 'hybrid';

export interface GuideCorpusMatchResolution {
  best: GuideCorpusRankedTopic | null;
  retrievalPath: GuideCorpusRetrievalPath;
  keywordBest: GuideCorpusRankedTopic | null;
  semanticBest: GuideCorpusRankedTopic | null;
}

export interface GuideCorpusSemanticDeps {
  businessId: string;
  userId?: string;
  embedText: OpenAiGatewayService['embedText'];
  isEmbeddingAvailable: () => Promise<boolean>;
}

/** Paraphrase anchors for semantic retrieval only (not keyword rank boosts). */
export const GUIDE_TOPIC_SEMANTIC_ANCHORS: Partial<
  Record<GuideCorpusTopicId, readonly string[]>
> = {
  'dashboard.ai.command-bar': [
    'type commands instead of clicking menus',
    'natural language control panel',
  ],
  'dashboard.core.schedule': [
    'repeating availability blocks for staff',
    'recurring weekly working hours',
  ],
  'dashboard.core.employees': [
    'accept card payment when client books remotely',
    'prepay before appointment online',
  ],
};

function buildGuideTopicSemanticAnchor(
  topicId: GuideCorpusTopicId,
  messages: MessageTree,
): string {
  const resolved = resolveGuideCorpusTopic(topicId, messages);
  const topic = listGuideCorpusTopics({ surface: 'dashboard' }).find(
    (row) => row.topicId === topicId,
  );
  const keywords = GUIDE_TOPIC_RETRIEVAL_KEYWORDS[topicId] ?? [];
  const semanticAnchors = GUIDE_TOPIC_SEMANTIC_ANCHORS[topicId] ?? [];
  const anchorPhrase =
    topic?.anchor.replace(/^ai-/, 'ai ').replace(/-/g, ' ') ?? '';
  return [
    resolved?.title,
    resolved?.summary,
    resolved?.body,
    ...(resolved?.steps ?? []),
    ...(resolved?.bullets ?? []),
    anchorPhrase,
    ...keywords,
    ...semanticAnchors,
  ]
    .filter(Boolean)
    .join(' ');
}

function scoreGuideTopicSemanticSimilarity(
  prompt: string,
  topicId: GuideCorpusTopicId,
  anchor: string,
): number {
  const phraseScores = [
    scoreTokenCosineBetweenPhrases(prompt, anchor),
    ...(GUIDE_TOPIC_SEMANTIC_ANCHORS[topicId] ?? []).map((phrase) =>
      scoreTokenCosineBetweenPhrases(prompt, phrase),
    ),
    ...(GUIDE_TOPIC_RETRIEVAL_KEYWORDS[topicId] ?? []).map((phrase) =>
      scoreTokenCosineBetweenPhrases(prompt, phrase),
    ),
  ];
  return Math.max(...phraseScores, 0);
}

function rankGuideTopicsBySemanticScore(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
  scoreTopic: (topicId: GuideCorpusTopicId, anchor: string) => number,
  reason: string,
  threshold: number,
): GuideCorpusRankedTopic[] {
  const prompt = query.prompt.trim();
  if (!prompt) return [];

  const topics = listGuideCorpusTopics({ surface: 'dashboard' });
  const ranked = topics.map((topic) => {
    const anchor = buildGuideTopicSemanticAnchor(topic.topicId, messages);
    let score = scoreTopic(topic.topicId, anchor);
    const reasons: string[] = [reason];
    const boosted = applyGuideSemanticRouteBoosts(
      query,
      topic.topicId,
      score,
      reasons,
    );
    score = boosted.score;
    reasons.splice(0, reasons.length, ...boosted.reasons);
    return { topicId: topic.topicId, score, reasons };
  });

  return ranked
    .filter((row) => row.score >= threshold)
    .sort((a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId));
}

function applyGuideSemanticRouteBoosts(
  query: ProductGuideRetrieveQuery,
  topicId: GuideCorpusTopicId,
  score: number,
  reasons: string[],
): { score: number; reasons: string[] } {
  let nextScore = score;
  const nextReasons = [...reasons];

  if (query.topicId && topicId === query.topicId) {
    nextScore += 0.15;
    nextReasons.push('explicit_topicId');
  }

  return { score: nextScore, reasons: nextReasons };
}

/** Token-cosine semantic rank over short guide topic anchors (pipe-1.4.4 fallback). */
export function rankGuideCorpusTopicsSemanticDeterministic(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
): GuideCorpusRankedTopic[] {
  return rankGuideTopicsBySemanticScore(
    query,
    messages,
    (topicId, anchor) =>
      scoreGuideTopicSemanticSimilarity(query.prompt, topicId, anchor),
    'semantic_token_cosine',
    GUIDE_SEMANTIC_MATCH_THRESHOLD,
  );
}

async function embedGuideTopicHaystack(
  deps: GuideCorpusSemanticDeps,
  topicId: GuideCorpusTopicId,
  haystack: string,
): Promise<number[] | null> {
  const context: AiCallContext = {
    businessId: deps.businessId,
    surface: 'dashboard',
    operation: 'guide_corpus_topic_embed',
    actorType: deps.userId ? 'manager' : 'system',
    userId: deps.userId,
  };
  return deps.embedText(context, haystack.slice(0, 4000));
}

/** Embedding cosine semantic rank when OpenAI is available. */
export async function rankGuideCorpusTopicsSemanticEmbedding(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
  deps: GuideCorpusSemanticDeps,
): Promise<GuideCorpusRankedTopic[]> {
  const prompt = query.prompt.trim();
  if (!prompt) return [];

  const promptContext: AiCallContext = {
    businessId: deps.businessId,
    surface: 'dashboard',
    operation: 'guide_corpus_prompt_embed',
    actorType: deps.userId ? 'manager' : 'system',
    userId: deps.userId,
  };
  const promptEmbedding = await deps.embedText(promptContext, prompt);
  if (!promptEmbedding) {
    return rankGuideCorpusTopicsSemanticDeterministic(query, messages);
  }

  const topics = listGuideCorpusTopics({ surface: 'dashboard' });
  const ranked: GuideCorpusRankedTopic[] = [];

  for (const topic of topics) {
    const anchor = buildGuideTopicSemanticAnchor(topic.topicId, messages);
    const topicEmbedding = await embedGuideTopicHaystack(
      deps,
      topic.topicId,
      anchor,
    );
    if (!topicEmbedding) continue;

    let score = cosineSimilarityVectors(promptEmbedding, topicEmbedding);
    const reasons: string[] = ['semantic_embedding_cosine'];
    const boosted = applyGuideSemanticRouteBoosts(
      query,
      topic.topicId,
      score,
      reasons,
    );
    score = boosted.score;
    reasons.splice(0, reasons.length, ...boosted.reasons);

    if (score >= GUIDE_SEMANTIC_EMBEDDING_THRESHOLD) {
      ranked.push({ topicId: topic.topicId, score, reasons });
    }
  }

  return ranked.sort(
    (a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId),
  );
}

export function shouldEscalateGuideCorpusToSemantic(
  keywordBest: GuideCorpusRankedTopic | null,
): boolean {
  if (!keywordBest) return true;
  return !isGuideCorpusMatchConfident(keywordBest.score);
}

function normalizeSemanticScoreForServing(score: number): number {
  return Math.max(GUIDE_CORPUS_MATCH_THRESHOLD, score);
}

/**
 * Keyword rank first; when below corpus threshold, escalate to semantic retrieval
 * (embeddings when available, token cosine otherwise) — ai-guide-1.2.3.
 */
export async function resolveGuideCorpusMatch(
  query: ProductGuideRetrieveQuery,
  messages: MessageTree,
  deps?: GuideCorpusSemanticDeps,
): Promise<GuideCorpusMatchResolution> {
  const keywordRanked = rankGuideCorpusTopics(query, messages);
  const keywordBest = keywordRanked[0] ?? null;

  if (keywordBest && isGuideCorpusMatchConfident(keywordBest.score)) {
    return {
      best: keywordBest,
      retrievalPath: 'keyword',
      keywordBest,
      semanticBest: null,
    };
  }

  if (!shouldEscalateGuideCorpusToSemantic(keywordBest)) {
    return {
      best: keywordBest,
      retrievalPath: 'keyword',
      keywordBest,
      semanticBest: null,
    };
  }

  let semanticRanked: GuideCorpusRankedTopic[];
  const hasApi = deps ? await deps.isEmbeddingAvailable() : false;
  const useDeterministic = shouldUseDeterministicSemanticFallback(hasApi);

  if (deps && !useDeterministic) {
    semanticRanked = await rankGuideCorpusTopicsSemanticEmbedding(
      query,
      messages,
      deps,
    );
  } else {
    semanticRanked = rankGuideCorpusTopicsSemanticDeterministic(
      query,
      messages,
    );
  }

  const semanticBest = semanticRanked[0] ?? null;
  if (!semanticBest) {
    return {
      best: keywordBest,
      retrievalPath: 'keyword',
      keywordBest,
      semanticBest: null,
    };
  }

  const sameTopicAsKeyword =
    keywordBest && semanticBest.topicId === keywordBest.topicId;

  if (
    sameTopicAsKeyword ||
    !keywordBest ||
    semanticBest.score > keywordBest.score
  ) {
    return {
      best: {
        ...semanticBest,
        score: normalizeSemanticScoreForServing(semanticBest.score),
        reasons: [...semanticBest.reasons, 'semantic_escalation'],
      },
      retrievalPath: keywordBest ? 'hybrid' : 'semantic',
      keywordBest,
      semanticBest,
    };
  }

  return {
    best: keywordBest,
    retrievalPath: 'keyword',
    keywordBest,
    semanticBest,
  };
}
