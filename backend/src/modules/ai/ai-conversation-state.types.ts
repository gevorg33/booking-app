/**
 * tech-debt B8 / e2e-bug.401 — what survives between turns.
 *
 * B8 was written as "nothing carries conversation state between turns". Three
 * of its four parts already existed:
 *
 *   - conversation **identity** — `ai-conversation.util.ts` derives a stable
 *     `conversationId` from the replayed history;
 *   - the **turn buffer** — clients already resend the whole transcript;
 *   - the entity-store **shape** — `ai-entity-store.util.ts`.
 *
 * Only **persistence** was missing, and only for the facts the transcript
 * cannot reconstruct: which concrete records the server resolved (B5), and
 * which clarification is outstanding (B3). Everything else is re-derivable
 * from the replayed messages and is deliberately *not* stored.
 */
import type { EntityStore } from './ai-entity-store.util.js';

/**
 * Bumped when the stored shape changes incompatibly.
 *
 * Reads that see a different version discard the record rather than coercing
 * it: a conversation losing its context is recoverable, a conversation
 * silently binding "it" to a mis-parsed old ref is not.
 */
export const CONVERSATION_STATE_VERSION = 1;

export interface ConversationState {
  version: typeof CONVERSATION_STATE_VERSION;
  /** B5 — entities this conversation has already resolved. */
  entityStore: EntityStore;
  /** Last write, for debugging and for age checks that do not trust the TTL. */
  updatedAt: Date;
}

export function createConversationState(
  entityStore: EntityStore,
): ConversationState {
  return {
    version: CONVERSATION_STATE_VERSION,
    entityStore,
    updatedAt: new Date(),
  };
}
