/**
 * AI-ROADMAP Phase 1 / Phase 6 — conversation identity and the turn buffer,
 * derived rather than demanded from the clients.
 *
 * e2e-bug.357 concluded that follow-ups cannot be resolved server-side because
 * "nothing in the request identifies a conversation", and Phase 1's `session_id`
 * and Phase 6's turn buffer + entity store have all been parked behind it.
 *
 * That conclusion reads past a field the ticket itself lists. `AiCommandDto`
 * already carries:
 *
 *   history?: { role: 'user' | 'assistant'; content: string }[]
 *
 * and the clients populate it with the **whole** conversation, not a window —
 * `ConsumerBookingAssistant.tsx` sends `messages.map(...)` over its entire
 * message list. Two consequences:
 *
 * 1. §3.4's turn buffer ("last N messages verbatim") is **already arriving on
 *    every request**. It was never blocked; nothing consumed it.
 * 2. The first user message in that history is **stable for the life of the
 *    conversation**, so a conversation key can be derived from it. No client
 *    change, no new field, no migration.
 *
 * The derived key is what Phase 6's entity store was missing.
 */
import { createHash } from 'node:crypto';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationIdentity {
  /** Stable across every turn of one conversation. Null when underivable. */
  conversationId: string | null;
  /** Why it could not be derived, for the trace. */
  reason: string | null;
  /** 1 for the opening message, incrementing per user turn. */
  turnIndex: number;
}

export interface DeriveConversationInput {
  /** Null for anonymous public-surface visitors. */
  userId: string | null;
  businessId: string;
  history: readonly ConversationTurn[];
  /** The message being handled now, not yet in `history`. */
  prompt: string;
}

/**
 * Derive a stable conversation id from the replayed history.
 *
 * The anchor is the **first user message**, because that is the one value that
 * does not change as the conversation grows: on turn 1 it is `prompt`, and on
 * every later turn it is the same entry sitting at the head of `history`.
 *
 * Anchoring on the first *user* turn rather than `history[0]` is defensive. The
 * clients seed no greeting — `ConsumerBookingAssistant` initialises `messages`
 * to `[]` — so today the two are the same message. `looksTruncated` relies on
 * that: an assistant-first history means turns were dropped.
 *
 * ## Anonymous visitors get no id, deliberately
 *
 * Without a `userId` the only inputs are the business and the message text. Two
 * anonymous visitors to the same salon both opening with "book a haircut" would
 * hash to the same id and then **share an entity store** — one stranger's
 * resolved customer name visible to another. Returning null is the fail-safe
 * answer: callers treat it as "no conversation", which costs context and leaks
 * nothing.
 *
 * This is not hypothetical for this codebase. `AiEntityMemoryService.getEntityMemory`
 * is keyed by `businessId` alone today, and `EntityMemoryEntry` holds
 * `customerName` — see e2e-bug.371.
 */
/**
 * Field separator for the id hash.
 *
 * A byte that cannot appear in an id or in typed text, so the concatenation is
 * unambiguous: without it, `userId="a b"` + `businessId="c"` and `userId="a"` +
 * `businessId="b c"` would hash identically and two tenants would share a
 * conversation.
 */
const FIELD_SEPARATOR = '\u0000';

export function deriveConversationIdentity(
  input: DeriveConversationInput,
): ConversationIdentity {
  const userTurns = input.history.filter((t) => t.role === 'user');
  const turnIndex = userTurns.length + 1;

  if (!input.userId) {
    return {
      conversationId: null,
      reason:
        'anonymous visitor: no stable identity, and hashing message text alone would merge different people',
      turnIndex,
    };
  }

  const anchor = (userTurns[0]?.content ?? input.prompt).trim();
  if (!anchor) {
    return {
      conversationId: null,
      reason: 'no user message to anchor the conversation to',
      turnIndex,
    };
  }

  // userId and businessId are included so an id can never collide across
  // people or tenants even if two conversations open identically.
  const digest = createHash('sha256')
    .update(input.userId)
    .update(FIELD_SEPARATOR)
    .update(input.businessId)
    .update(FIELD_SEPARATOR)
    .update(anchor.toLowerCase())
    .digest('hex');

  return {
    conversationId: `cv_${digest.slice(0, 32)}`,
    reason: null,
    turnIndex,
  };
}

/**
 * §3.4 tier 1 — the last N messages verbatim.
 *
 * Takes the tail, not the head: recent turns are what a follow-up refers to.
 * Bounded because the clients replay the *entire* conversation, so an unbounded
 * buffer grows without limit and is passed to a model priced per token.
 */
export const DEFAULT_TURN_BUFFER_SIZE = 10;

export function buildTurnBuffer(
  history: readonly ConversationTurn[],
  size: number = DEFAULT_TURN_BUFFER_SIZE,
): ConversationTurn[] {
  if (size <= 0) return [];
  return history.slice(-size).map((t) => ({ ...t }));
}

/** The most recent user message before the current one, or null on turn 1. */
export function previousUserMessage(
  history: readonly ConversationTurn[],
): string | null {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role === 'user') return history[i].content;
  }
  return null;
}

/**
 * True when the replayed history looks truncated rather than complete.
 *
 * The derived id is only stable while clients replay from the beginning. If a
 * client ever starts trimming, the anchor changes and the conversation silently
 * splits into two. A heuristic cannot prove completeness, but a history opening
 * with an assistant turn is the observable symptom: the clients always start a
 * conversation with a user message, so an assistant-first history means earlier
 * turns were dropped.
 */
export function looksTruncated(history: readonly ConversationTurn[]): boolean {
  return history.length > 0 && history[0].role === 'assistant';
}
