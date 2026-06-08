import type { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import {
  buildClarifyEvalLabelCandidateFromPair,
  buildClarifySessionKey,
  resolveClarifyNextTurnOutcome,
} from './ai-clarify-quality.util.js';
import {
  CLARIFY_ABANDON_WINDOW_MS,
  traceEntityToAnalyticsRow,
} from './ai-command-trace.util.js';
import type { AiWorstPromptEntry } from './ai-platform.util.js';

export {
  buildClarifyEvalLabelCandidateFromPair,
  buildClarifyQualityHarvestCandidates,
  buildWorstClarifiesFeed,
  shouldAutoQueueClarifyOutcome,
} from './ai-clarify-quality.util.js';
export { computeClarifyQualityByIntentAndLocale } from './ai-n99-clarify-success.util.js';

/** n99-1.7 — detect clarify pairs to auto-queue when a new trace is written. */
export function findClarifyAutoQueueCandidatesOnTraceWrite(input: {
  newTrace: AiCommandTrace;
  recentClarifies: AiCommandTrace[];
}): AiWorstPromptEntry[] {
  const followUpRow = traceEntityToAnalyticsRow(input.newTrace);
  const sessionKey = buildClarifySessionKey(followUpRow);
  const candidates: AiWorstPromptEntry[] = [];

  for (const prior of input.recentClarifies) {
    if (prior.traceId === input.newTrace.traceId) continue;

    const clarifyRow = traceEntityToAnalyticsRow(prior);
    if (buildClarifySessionKey(clarifyRow) !== sessionKey) continue;
    if (followUpRow.createdAt.getTime() <= clarifyRow.createdAt.getTime()) continue;
    if (
      followUpRow.createdAt.getTime() >
      clarifyRow.createdAt.getTime() + CLARIFY_ABANDON_WINDOW_MS
    ) {
      continue;
    }

    const outcome = resolveClarifyNextTurnOutcome(clarifyRow, followUpRow);
    const candidate = buildClarifyEvalLabelCandidateFromPair({
      clarify: clarifyRow,
      followUp: followUpRow,
      outcome,
    });
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}
