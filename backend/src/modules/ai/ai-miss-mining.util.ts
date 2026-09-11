/**
 * AI-ROADMAP Phase 9 — mine traces for misses.
 *
 * "Mine traces for misses: undo-within-1-min, rephrase-retry, explicit
 * feedback, failures." Each confirmed miss becomes a registry `example` and an
 * eval case — never a new regex (§8, working agreement 6).
 *
 * Two things were measured against the 5,362 production traces before writing
 * any of this, and both changed the design:
 *
 * **1. A follow-up after a failure is usually not a retry.** There are 579 of
 * them within five minutes, and sampling shows most are a *different question*
 * — "how much would a gift card cost?" followed by "cancel gift card order …".
 * Counting them all as misses would produce a queue that is mostly noise, and a
 * noisy queue does not get worked. So a retry has to look like a rephrase, not
 * merely follow a failure.
 *
 * **2. A follow-up after a clarify is an answer, not a miss.** 153 of them.
 * Those are the system working — §38's slot filling is built on exactly that
 * turn — and labelling them misses would penalise the behaviour the roadmap
 * wants more of.
 *
 * `undo-within-1-min` is in the roadmap's list and is **not** implemented here:
 * there are zero undo-shaped actions in the trace corpus, so there is nothing
 * to detect and no way to test a detector honestly. Noted rather than faked.
 */

export type MissSignal =
  /** User re-asked the same thing in different words after it failed. */
  | 'rephrase_retry'
  /** The same command failed repeatedly for the same user in one sitting. */
  | 'repeated_failure'
  /** The user told us it was wrong. */
  | 'negative_feedback';

export interface MinableTrace {
  traceId: string;
  userId: string | null;
  businessId: string;
  createdAt: Date;
  promptRaw: string;
  action: string;
  outcome: string;
}

export interface MissCandidate {
  signal: MissSignal;
  /** The trace that went wrong — the one worth turning into an eval case. */
  traceId: string;
  action: string;
  prompt: string;
  /** The follow-up that revealed it, when there was one. */
  evidenceTraceId: string | null;
  evidencePrompt: string | null;
  /** 0–1; how alike the two prompts were, for `rephrase_retry`. */
  similarity: number | null;
}

/** Words that carry no intent and would inflate any overlap score. */
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'can',
  'could',
  'do',
  'does',
  'for',
  'from',
  'have',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'please',
  'that',
  'the',
  'this',
  'to',
  'want',
  'was',
  'what',
  'when',
  'which',
  'will',
  'with',
  'would',
  'you',
  'your',
]);

export function contentTokens(prompt: string): Set<string> {
  return new Set(
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t)),
  );
}

/**
 * Jaccard overlap of content words.
 *
 * Crude on purpose. The job is separating "asked the same thing again" from
 * "asked something else", not measuring semantic distance — and a cheap
 * measure that can be reasoned about beats an embedding whose threshold nobody
 * can explain when the queue is wrong.
 */
export function promptSimilarity(a: string, b: string): number {
  const ta = contentTokens(a);
  const tb = contentTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += 1;
  return shared / (ta.size + tb.size - shared);
}

export interface MissMiningOptions {
  /** How close two messages must be to count as one attempt. */
  windowMs?: number;
  /** Overlap needed before a follow-up counts as a rephrase. */
  similarityThreshold?: number;
  /** Actions that mean the user told us we were wrong. */
  negativeFeedbackActions?: ReadonlySet<string>;
}

export const DEFAULT_MISS_WINDOW_MS = 5 * 60 * 1000;
/**
 * Half the content words shared. Tuned against the real corpus: lower floods
 * the queue with topic changes, higher misses genuine rewordings that swap most
 * of their vocabulary ("cancel my booking" → "I don't want the appointment").
 */
export const DEFAULT_SIMILARITY_THRESHOLD = 0.5;

const NEGATIVE_FEEDBACK_ACTIONS = new Set([
  'give_ai_feedback',
  'give_provider_ai_feedback',
]);

/**
 * Find miss candidates in one user's ordered trace history.
 *
 * Traces must be sorted by time and belong to one (user, business); the caller
 * groups them, so this stays pure and does not have to know how they were
 * fetched.
 */
export function detectMisses(
  traces: readonly MinableTrace[],
  options: MissMiningOptions = {},
): MissCandidate[] {
  const windowMs = options.windowMs ?? DEFAULT_MISS_WINDOW_MS;
  const threshold = options.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
  const feedbackActions =
    options.negativeFeedbackActions ?? NEGATIVE_FEEDBACK_ACTIONS;

  const candidates: MissCandidate[] = [];
  const failureCounts = new Map<string, MinableTrace>();

  for (let i = 0; i < traces.length; i += 1) {
    const trace = traces[i];

    if (feedbackActions.has(trace.action)) {
      // The message before the feedback is what the feedback is about.
      const subject = traces[i - 1];
      candidates.push({
        signal: 'negative_feedback',
        traceId: subject?.traceId ?? trace.traceId,
        action: subject?.action ?? trace.action,
        prompt: subject?.promptRaw ?? trace.promptRaw,
        evidenceTraceId: trace.traceId,
        evidencePrompt: trace.promptRaw,
        similarity: null,
      });
      continue;
    }

    if (trace.outcome !== 'failed') {
      // A clarify is not a failure, and the turn after it is an answer (§38).
      continue;
    }

    const previousFailure = failureCounts.get(trace.action);
    if (
      previousFailure &&
      trace.createdAt.getTime() - previousFailure.createdAt.getTime() < windowMs
    ) {
      candidates.push({
        signal: 'repeated_failure',
        traceId: trace.traceId,
        action: trace.action,
        prompt: trace.promptRaw,
        evidenceTraceId: previousFailure.traceId,
        evidencePrompt: previousFailure.promptRaw,
        similarity: null,
      });
    }
    failureCounts.set(trace.action, trace);

    const next = traces[i + 1];
    if (!next) continue;
    if (next.createdAt.getTime() - trace.createdAt.getTime() >= windowMs) {
      continue;
    }

    const similarity = promptSimilarity(trace.promptRaw, next.promptRaw);
    if (similarity >= threshold) {
      candidates.push({
        signal: 'rephrase_retry',
        traceId: trace.traceId,
        action: trace.action,
        prompt: trace.promptRaw,
        evidenceTraceId: next.traceId,
        evidencePrompt: next.promptRaw,
        similarity: Math.round(similarity * 100) / 100,
      });
    }
  }

  return candidates;
}

/** Group unsorted traces per (user, business) and mine each history. */
export function mineMisses(
  traces: readonly MinableTrace[],
  options: MissMiningOptions = {},
): MissCandidate[] {
  const byUser = new Map<string, MinableTrace[]>();
  for (const trace of traces) {
    if (!trace.userId) continue; // no user, no sequence to reason about
    const key = `${trace.businessId}::${trace.userId}`;
    const bucket = byUser.get(key) ?? [];
    bucket.push(trace);
    byUser.set(key, bucket);
  }

  const out: MissCandidate[] = [];
  for (const bucket of byUser.values()) {
    bucket.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    out.push(...detectMisses(bucket, options));
  }
  return out;
}

/**
 * Collapse candidates into a per-action work queue.
 *
 * Ranked by how many distinct signals point at the same action: a command that
 * is retried *and* complained about is a better use of the next hour than one
 * with a single noisy signal.
 */
export function rankMissesByAction(
  candidates: readonly MissCandidate[],
): { action: string; total: number; signals: Record<MissSignal, number> }[] {
  const byAction = new Map<string, Record<MissSignal, number>>();
  for (const c of candidates) {
    const slot = byAction.get(c.action) ?? {
      rephrase_retry: 0,
      repeated_failure: 0,
      negative_feedback: 0,
    };
    slot[c.signal] += 1;
    byAction.set(c.action, slot);
  }
  return [...byAction.entries()]
    .map(([action, signals]) => ({
      action,
      total:
        signals.rephrase_retry +
        signals.repeated_failure +
        signals.negative_feedback,
      signals,
    }))
    .sort((a, b) => b.total - a.total || a.action.localeCompare(b.action));
}
