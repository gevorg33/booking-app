import { Injectable, Logger } from '@nestjs/common';
import { AiConversationStateStore } from './ai-conversation-state.store.js';
import {
  createConversationState,
  type ConversationState,
} from './ai-conversation-state.types.js';
import { createEntityStore, type EntityStore } from './ai-entity-store.util.js';
import { recordEntityRefsFromResult } from './ai-entity-ref-recorder.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  deriveConversationIdentity,
  type ConversationIdentity,
  type DeriveConversationInput,
} from './ai-conversation.util.js';

/** The context key downstream reads, alongside `_entityMemoryBlock` etc. */
export const CONVERSATION_ENTITY_STORE_CONTEXT_KEY = '_conversationEntityStore';
/** e2e-bug.370 — the current user-turn number, for turn-based staleness. */
export const CONVERSATION_TURN_INDEX_CONTEXT_KEY = '_conversationTurnIndex';

export interface ConversationCarrierContext {
  identity: ConversationIdentity;
  entityStore: EntityStore;
  /** True when a previous turn's state was actually read back. */
  restored: boolean;
}

/**
 * e2e-bug.401 — the carrier that makes conversation state survive a turn.
 *
 * `AiConversationStateStore` has existed since tech-debt B8 and is complete:
 * Redis-backed, versioned, TTL'd, off by default, and never throwing. What was
 * missing is the thing this ticket is actually named for — nothing on a request
 * path ever called it. The store's own header says so ("Nothing reads this
 * store yet"), so the state it can hold has never crossed a turn boundary, and
 * that is what blocks e2e-bug.369, .370, .373 and .374.
 *
 * ## Why this sits in the gateway and not in each surface
 *
 * `deriveConversationIdentity` was already placed in the shared trace builder
 * for exactly this reason — "computed here rather than at the call site so
 * every gateway surface gets it from one place". The same argument applies to
 * loading and saving: `AiGatewayService.executeCommandPipeline` is where the
 * dashboard, customer and provider surfaces converge, so wiring it there gets
 * all three at once and leaves one place to change.
 *
 * ## Where the store gets written
 *
 * As first landed this carried an empty store, on the assumption that refs
 * would be recorded at resolution time (e2e-bug.373). §231 found that design
 * unworkable — resolution happens in ~44 places and hooking a subset would
 * leave a store that lies. So `commit` now records from the **result**
 * instead: every command's reported `serviceId` / `employeeId` / `bookingId`
 * / … is folded into the store here, in the one place every surface's result
 * passes through, regardless of which internal path resolved it. See
 * `ai-entity-ref-recorder.util.ts` for what that does and does not cover.
 *
 * `restored` distinguishes "read a previous turn" from "started fresh", so the
 * wiring can be verified independently of whether anything was recorded.
 */
@Injectable()
export class AiConversationCarrierService {
  private readonly logger = new Logger(AiConversationCarrierService.name);

  constructor(private readonly store: AiConversationStateStore) {}

  /**
   * Open a turn: derive the conversation key and read prior state.
   *
   * Always resolves. A disabled flag, an anonymous visitor, a Redis outage and
   * an unreadable record all yield a fresh store, because every one of them
   * means "start from nothing" — which is exactly today's behaviour, and is why
   * enabling this cannot make a turn worse than not having it.
   */
  async begin(
    input: DeriveConversationInput,
  ): Promise<ConversationCarrierContext> {
    const identity = deriveConversationIdentity(input);
    const state = await this.store.load(identity.conversationId);
    return {
      identity,
      entityStore:
        state?.entityStore ?? createEntityStore(identity.conversationId ?? ''),
      restored: state != null,
    };
  }

  /**
   * Close a turn: persist whatever it left behind.
   *
   * Fire-and-forget, like the command trace beside it. The response is already
   * built by the time this runs, so a slow or unreachable Redis must not be
   * able to delay it — and a failed write costs the next turn its context,
   * which the load path already treats as normal.
   */
  commit(
    context: ConversationCarrierContext,
    result?: Pick<CommandResult, 'success' | 'details'>,
  ): void {
    if (!context.identity.conversationId) return;
    // e2e-bug.373 — fold this turn's reported resolutions in before saving.
    // A missing or failed result records nothing and leaves the store as it
    // was, which is the safe direction: an anaphor then binds to a ref that a
    // successful, reported resolution wrote, or finds nothing and asks.
    const entityStore = result
      ? recordEntityRefsFromResult(
          context.entityStore,
          result,
          context.identity.turnIndex,
        )
      : context.entityStore;
    const state: ConversationState = createConversationState(entityStore);
    void this.store
      .save(context.identity.conversationId, state)
      .catch((err: unknown) =>
        this.logger.warn(
          `Conversation state commit failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      );
  }
}
